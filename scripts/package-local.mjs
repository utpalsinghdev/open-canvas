import { execFileSync, execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { chmod, cp, mkdir, mkdtemp, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { checkoutRoot, dataDirectoryName, git } from './runtime-settings.mjs';
import workspace from '../package.json' with { type: 'json' };

const { platform, arch } = process;
const windows = platform === 'win32';
const output = path.resolve(process.argv[2] ?? path.join(checkoutRoot, dataDirectoryName, 'packages'));
const asset = `open-canvas-${platform}-${arch}.tar.gz`;

function pnpm(cwd, args, env = process.env) {
  // On Windows corepack is a .cmd shim, which only runs through the shell.
  if (windows) execSync(['corepack', 'pnpm', ...args].join(' '), { cwd, env, stdio: 'inherit' });
  else execFileSync('corepack', ['pnpm', ...args], { cwd, env, stdio: 'inherit' });
}

/** Windows junctions store absolute targets, so ship copies of the shared workspace packages instead. */
async function removeLinks(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) await rm(entryPath, { force: true });
    else if (entry.isDirectory()) await removeLinks(entryPath);
  }
}
async function materializeWorkspacePackages(bundle) {
  await removeLinks(bundle);
  for (const name of ['document', 'engine', 'mcp']) {
    await cp(path.join(bundle, 'packages', name), path.join(bundle, 'node_modules/@open-cavas', name), { recursive: true });
  }
}

async function packageLocal() {
  if (!['linux', 'darwin', 'win32'].includes(platform) || !['x64', 'arm64'].includes(arch)) {
    throw new Error(`Unsupported packaging platform: ${platform}-${arch}`);
  }
  if (process.versions.node !== workspace.engines.node) {
    throw new Error(`Use the pinned Node.js ${workspace.engines.node} distribution to build this archive.`);
  }
  // Windows distributions keep node.exe beside LICENSE; Unix ones keep it in bin/.
  const nodeLicense = path.resolve(path.dirname(process.execPath), windows ? 'LICENSE' : '../LICENSE');
  const commit = git(checkoutRoot, 'status', '--porcelain') ? 'development' : git(checkoutRoot, 'rev-parse', 'HEAD');
  const staging = await mkdtemp(path.join(tmpdir(), 'open-canvas-package-'));
  const bundle = path.join(staging, 'bundle');
  try {
    pnpm(checkoutRoot, ['run', 'build'], { ...process.env, CAVAS_PROFILE: 'installed', CAVAS_RELEASE_COMMIT: commit });
    const files = [
      'LICENSE', 'package.json', 'pnpm-lock.yaml', 'pnpm-workspace.yaml',
      'apps/web/package.json', 'apps/web/CHANGELOG.md', 'apps/web/dist',
      'apps/local-service/package.json', 'apps/local-service/src',
      'packages/document', 'packages/engine', 'packages/mcp', 'public',
      'scripts/runtime.mjs', 'scripts/runtime-settings.mjs',
      'scripts/installed.mjs', 'scripts/installed-preview.mjs',
      'scripts/installed-releases.mjs', 'scripts/install.sh', 'scripts/install.ps1',
    ];
    for (const file of files) {
      await cp(path.join(checkoutRoot, file), path.join(bundle, file), {
        recursive: true,
        filter: (source) => path.basename(source) !== 'node_modules',
      });
    }
    await mkdir(path.join(bundle, 'bin'));
    await cp(process.execPath, path.join(bundle, windows ? 'bin/node.exe' : 'bin/node'));
    await cp(nodeLicense, path.join(bundle, 'LICENSE-node'));
    const launcher = windows ? 'open-canvas.cmd' : 'open-canvas';
    await cp(path.join(checkoutRoot, 'scripts', launcher), path.join(bundle, 'bin', launcher));
    if (!windows) await chmod(path.join(bundle, 'bin/open-canvas'), 0o755);

    if (windows) {
      // A flat node_modules keeps paths short and leaves only the workspace links to replace.
      pnpm(bundle, ['install', '--prod', '--frozen-lockfile', '--ignore-scripts', '--node-linker=hoisted']);
      await materializeWorkspacePackages(bundle);
    } else {
      // Keep pnpm's relative workspace and native dependency links in the archive.
      pnpm(bundle, ['install', '--prod', '--frozen-lockfile', '--ignore-scripts']);
    }
    const archive = path.join(staging, asset);
    // Name the system bsdtar on Windows; GNU tar on PATH reads "C:" as a remote host.
    const tar = windows ? path.join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'tar.exe') : 'tar';
    execFileSync(tar, ['-czf', archive, '-C', bundle, '.'], { stdio: 'inherit' });
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
  console.error(error instanceof Error ? error.message : 'Could not package Open Canvas.');
  process.exitCode = 1;
}
