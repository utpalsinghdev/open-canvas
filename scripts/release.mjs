import { spawn, execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile, rename, rm, access } from 'node:fs/promises';
import path from 'node:path';
import { checkoutRoot, git, runtimeSettings } from './runtime-settings.mjs';

async function command(binary, args, cwd, extraEnv = {}) {
  await new Promise((resolve, reject) => {
    const child = spawn(binary, args, { cwd, env: { ...process.env, CAVAS_PROFILE: 'main', ...extraEnv }, stdio: 'inherit' });
    child.on('error', reject);
    child.on('exit', (code) => code === 0 ? resolve() : reject(new Error(`${binary} exited with ${code}. Release pointer unchanged.`)));
  });
}
let staging;
try {
  runtimeSettings('main');
  if (git(checkoutRoot, 'branch', '--show-current') !== 'main') throw new Error('Publish releases only from main. Merge verified features first.');
  if (git(checkoutRoot, 'status', '--porcelain')) throw new Error('Commit or resolve working-tree changes before publishing main.');
  const commit = git(checkoutRoot, 'rev-parse', 'HEAD');
  const releases = path.join(checkoutRoot, '.cavas', 'releases');
  await mkdir(releases, { recursive: true, mode: 0o700 });
  const target = path.join(releases, commit);
  let exists = false;
  try { await access(target); exists = true; } catch { /* New release. */ }
  if (!exists) {
    staging = path.join(releases, `.building-${process.pid}`);
    await mkdir(staging, { mode: 0o700 });
    const archive = execFileSync('git', ['-C', checkoutRoot, 'archive', '--format=tar', commit], { maxBuffer: 30_000_000 });
    execFileSync('tar', ['-xf', '-', '-C', staging], { input: archive });
    await command('npm', ['ci', '--ignore-scripts'], staging);
    await command('npm', ['run', 'build'], staging, { CAVAS_RELEASE_COMMIT: commit });
    await writeFile(path.join(staging, '.cavas-release.json'), JSON.stringify({ commit, createdAt: new Date().toISOString() }));
    await rename(staging, target);
    staging = undefined;
  }
  const marker = JSON.parse(await readFile(path.join(target, '.cavas-release.json'), 'utf8'));
  if (marker.commit !== commit) throw new Error('Existing release does not match commit. Refusing to publish.');
  const pointer = path.join(checkoutRoot, '.cavas', 'main-release.json');
  const temporary = `${pointer}.${process.pid}`;
  await writeFile(temporary, JSON.stringify({ commit }), { mode: 0o600, flag: 'wx' });
  await rename(temporary, pointer);
  process.stdout.write(`Main release prepared: ${commit}\nExisting services were not stopped or changed. At your release window, restart npm start and reconnect MCP clients.\n`);
} catch (error) {
  if (staging) await rm(staging, { recursive: true, force: true });
  process.stderr.write(`${error instanceof Error ? error.message : 'Release failed.'}\n`);
  process.exitCode = 1;
}
