import { readdir, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import type { Connect, Plugin, ResolvedConfig } from 'vite';

function privatePath(value: string, root: string) {
  // A frozen release root itself lives under .cavas/releases; only its children are public.
  const relative = path.relative(root, value);
  const outside = relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative);
  return (outside ? value : relative).split(/[\\/]/).includes('.cavas');
}

async function checkPublicFiles(directory: string, root: string, ancestors = new Set<string>()) {
  const canonical = await realpath(directory);
  if (privatePath(directory, root) || privatePath(canonical, root))
    throw new Error('Private application data cannot be copied from public into a release.');
  if (!(await stat(canonical)).isDirectory()) return;
  if (ancestors.has(canonical)) throw new Error('Cyclic public directory alias.');
  const parents = new Set([...ancestors, canonical]);
  for (const name of await readdir(directory)) await checkPublicFiles(path.join(directory, name), root, parents);
}

/** Vite's lexical deny globs alone do not block symlink aliases to private state. */
export function privateStateGuard(): Plugin {
  let config: ResolvedConfig;
  function middleware(preview: boolean): Connect.NextHandleFunction {
    return (request, response, next) => {
      void (async () => {
        const pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://vite.local').pathname);
        const root = preview ? path.resolve(config.root, config.build.outDir) : config.root;
        const candidates = [path.resolve(root, `.${pathname}`)];
        if (!preview) {
          if (pathname.startsWith('/@fs/')) candidates.push(path.resolve(pathname.slice(4)));
          if (config.publicDir) candidates.push(path.resolve(config.publicDir, `.${pathname}`));
          for (const { find, replacement } of config.resolve.alias) {
            if (typeof find === 'string' ? pathname.startsWith(find) : find.test(pathname)) {
              candidates.push(path.resolve(config.root, pathname.replace(find, replacement)));
              break;
            }
          }
        }
        for (const candidate of candidates) {
          if (privatePath(candidate, config.root)) throw new Error('Private application data.');
          try {
            if (privatePath(await realpath(candidate), config.root)) throw new Error('Private application data.');
          } catch (error) {
            if (!(error instanceof Error && 'code' in error &&
                (error.code === 'ENOENT' || error.code === 'ENOTDIR'))) throw error;
          }
        }
        next();
      })().catch(() => {
        response.writeHead(403, { 'Content-Type': 'text/plain', 'Cache-Control': 'no-store' });
        response.end('Private application data is not served.');
      });
    };
  }
  return {
    name: 'cavas-private-state-guard',
    configResolved(resolved) { config = resolved; },
    async buildStart() {
      if (!config.publicDir) return;
      try { await stat(config.publicDir); }
      catch (error) {
        if (error instanceof Error && 'code' in error && error.code === 'ENOENT') return;
        throw error;
      }
      await checkPublicFiles(config.publicDir, config.root);
    },
    configureServer(server) { server.middlewares.use(middleware(false)); },
    configurePreviewServer(server) { server.middlewares.use(middleware(true)); },
  };
}
