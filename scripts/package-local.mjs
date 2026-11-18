import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { chmod, cp, mkdir, mkdtemp, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkoutRoot, git } from './runtime-settings.mjs';
import workspace from '../package.json' with { type: 'json' };

const { platform, arch } = process;
const output = path.resolve(process.argv[2] ?? path.join(checkoutRoot, '.cavas/packages'));
const asset = `open-cavas-${platform}-${arch}.tar.gz`;

function pnpm(cwd, args, env = process.env) {
  execFileSync('corepack', ['pnpm', ...args], { cwd, env, stdio: 'inherit' });
}

async function packageLocal() {
  if (!['linux', 'darwin'].includes(platform) || !['x64', 'arm64'].includes(arch)) {
    throw new Error(`Unsupported packaging platform: ${platform}-${arch}`);
  }
  if (process.versions.node !== workspace.engines.node) {
    throw new Error(`Use the pinned Node.js ${workspace.engines.node} distribution to build this archive.`);
  }
  const nodeLicense = path.resolve(path.dirname(process.execPath), '../LICENSE');
  const commit = git(checkoutRoot, 'status', '--porcelain') ? 'development' : git(checkoutRoot, 'rev-parse', 'HEAD');
  const staging = await mkdtemp(path.join(tmpdir(), 'open-cavas-package-'));
  const bundle = path.join(staging, 'bundle');
  try {
    pnpm(checkoutRoot, ['run', 'build'], { ...process.env, CAVAS_PROFILE: 'installed', CAVAS_RELEASE_COMMIT: commit });
    const files = [
      'LICENSE', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml',
      'apps/web/package.json', 'apps/web/dist',
      'apps/local-service/package.json', 'apps/local-service/src',
      'packages/document', 'packages/engine', 'packages/mcp', 'public',
      'scripts/runtime.mjs', 'scripts/runtime-settings.mjs',
      'scripts/installed.mjs', 'scripts/installed-preview.mjs',
    ];
    for (const file of files) {
      await cp(path.join(checkoutRoot, file), path.join(bundle, file), {
        recursive: true,
        filter: (source) => path.basename(source) !== 'node_modules',
      });
    }
    await mkdir(path.join(bundle, 'bin'));
    await cp(process.execPath, path.join(bundle, 'bin/node'));
    await cp(nodeLicense, path.join(bundle, 'LICENSE-node'));
    await cp(path.join(checkoutRoot, 'scripts/open-cavas'), path.join(bundle, 'bin/open-cavas'));
    await chmod(path.join(bundle, 'bin/open-cavas'), 0o755);

    // Keep pnpm's relative workspace and native dependency links in the archive.
    pnpm(bundle, ['install', '--prod', '--frozen-lockfile', '--ignore-scripts']);
    const archive = path.join(staging, asset);
    execFileSync('tar', ['-czf', archive, '-C', bundle, '.'], { stdio: 'inherit' });
    const digest = createHash('sha256');
    for await (const chunk of createReadStream(archive)) digest.update(chunk);
    await mkdir(output, { recursive: true });
    // Copy to the output filesystem before renaming into place.
    const delivery = await mkdtemp(path.join(output, '.package-'));
    try {
      const ready = path.join(delivery, asset);
      await cp(archive, ready);
      await writeFile(`${ready}.sha256`, `${digest.digest('hex')}  ${asset}\n`);
      await rename(ready, path.join(output, asset));
      await rename(`${ready}.sha256`, path.join(output, `${asset}.sha256`));
    } finally {
      await rm(delivery, { recursive: true, force: true });
    }
    console.log(path.join(output, asset));
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

try {
  await packageLocal();
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Could not package Open Cavas.');
  process.exitCode = 1;
}
