import { spawn } from 'node:child_process';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { checkoutRoot, runtimeSettings, assertDevelopmentCheckout } from './runtime-settings.mjs';

export async function selectedRelease() {
  let pointer;
  try { pointer = JSON.parse(await readFile(path.join(checkoutRoot, '.cavas', 'main-release.json'), 'utf8')); }
  catch { throw new Error('No valid main release. Run npm run release:main from clean main.'); }
  if (!pointer || typeof pointer.commit !== 'string' || !/^[a-f0-9]{40}$/.test(pointer.commit)) throw new Error('Invalid main release pointer. Run npm run release:main from clean main.');
  const directory = path.join(checkoutRoot, '.cavas', 'releases', pointer.commit);
  if (await realpath(directory) !== directory) throw new Error('Release directory must not be a symlink.');
  return { directory, commit: pointer.commit };
}
export async function launch(profile, action) {
  const settings = runtimeSettings(profile);
  if (!['web', 'mcp'].includes(action)) throw new Error('Runtime action must be web or mcp.');
  if (profile === 'dev') assertDevelopmentCheckout();
  const release = profile === 'main' ? await selectedRelease() : null;
  const root = release?.directory ?? checkoutRoot;
  const env = { ...process.env, CAVAS_PROFILE: profile, CAVAS_APP_PORT: String(settings.appPort), CAVAS_MCP_PORT: String(settings.brokerPort), CAVAS_APP_ORIGIN: settings.origin, CAVAS_RUNTIME_STATE_ROOT: settings.stateDirectory, CAVAS_RELEASE_COMMIT: release?.commit ?? 'development' };
  const args = action === 'web'
    ? [path.join(root, 'node_modules/vite/bin/vite.js'), ...(profile === 'main' ? ['preview'] : []), '--host', '0.0.0.0', '--port', String(settings.appPort), '--strictPort']
    : [path.join(root, 'node_modules/tsx/dist/cli.mjs'), path.join(root, 'server/index.ts')];
  process.stderr.write(`Open Cavas ${profile}: ${action === 'web' ? settings.origin : `private MCP ${settings.brokerPort}`} ${release ? `release ${release.commit.slice(0, 7)}` : ''}\n`);
  let backend;
  if (action === 'web') {
    backend = spawn(process.execPath, ['--import', 'tsx', path.join(root, 'server/workspace-daemon.ts')], {
      cwd: root, env, stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    });
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => { backend.kill(); reject(new Error('Workspace service startup timed out.')); }, 15000);
      backend.once('message', () => { clearTimeout(timer); resolve(); });
      backend.once('error', (error) => { clearTimeout(timer); reject(error); });
      backend.once('exit', (code) => { clearTimeout(timer); reject(new Error(`Workspace service exited (${code}).`)); });
    });
  }
  const child = spawn(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
  backend?.on('exit', () => child.kill());
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => { child.kill(signal); backend?.kill(signal); });
  child.on('error', (error) => { process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
  child.on('exit', (code, signal) => { backend?.kill(); process.exitCode = code ?? (signal ? 1 : 0); });
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.join(checkoutRoot, 'scripts/runtime.mjs')) {
  try { await launch(process.argv[2] ?? 'main', process.argv[3] ?? 'web'); }
  catch (error) { process.stderr.write(`${error instanceof Error ? error.message : 'Runtime failed.'}\n`); process.exitCode = 1; }
}
