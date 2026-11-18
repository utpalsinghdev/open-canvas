import { spawn } from 'node:child_process';
import { readFile, realpath } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { checkoutRoot, runtimeSettings, assertDevelopmentCheckout } from './runtime-settings.mjs';

export async function selectedRelease() {
  let pointer;
  try { pointer = JSON.parse(await readFile(path.join(checkoutRoot, '.cavas', 'main-release.json'), 'utf8')); }
  catch { throw new Error('No valid main release. Run pnpm run release:main from clean main.'); }
  if (!pointer || typeof pointer.commit !== 'string' || !/^[a-f0-9]{40}$/.test(pointer.commit)) throw new Error('Invalid main release pointer. Run pnpm run release:main from clean main.');
  const directory = path.join(checkoutRoot, '.cavas', 'releases', pointer.commit);
  if (await realpath(directory) !== directory) throw new Error('Release directory must not be a symlink.');
  const marker = JSON.parse(await readFile(path.join(directory, '.cavas-release.json'), 'utf8'));
  const layoutVersion = marker.layoutVersion ?? 1;
  if (marker.commit !== pointer.commit || ![1, 2].includes(layoutVersion)) throw new Error('Unsupported main release layout. Prepare a compatible main snapshot.');
  return { directory, commit: pointer.commit, layoutVersion };
}
export async function mainRuntimeSettings(release) {
  // Older snapshots enforce their original origin inside the broker.
  const moduleUrl = pathToFileURL(path.join(release.directory, 'scripts/runtime-settings.mjs'));
  const snapshot = await import(moduleUrl.href);
  const settings = snapshot.runtimeSettings('main', checkoutRoot);
  return { ...settings, bindHost: settings.bindHost ?? '0.0.0.0' };
}

export async function launch(profile, action, { openBrowser = false } = {}) {
  if (!['web', 'mcp'].includes(action)) throw new Error('Runtime action must be web or mcp.');
  if (profile === 'dev') assertDevelopmentCheckout();
  const installed = profile === 'installed';
  const release = profile === 'main' ? await selectedRelease() : null;
  const settings = release ? await mainRuntimeSettings(release) : runtimeSettings(profile);
  const root = release?.directory ?? checkoutRoot;
  // Already-prepared snapshots retain their original single-package layout.
  const legacy = release?.layoutVersion === 1;
  const webRoot = legacy ? root : path.join(root, 'apps/web');
  const serviceRoot = path.join(root, legacy ? 'server' : 'apps/local-service/src');
  let commit = release?.commit ?? 'development';
  if (installed) {
    try {
      const info = JSON.parse(await readFile(path.join(webRoot, 'dist/runtime.json'), 'utf8'));
      if (info.profile !== 'installed' || typeof info.release !== 'string' || !/^(development|[a-f0-9]{40})$/.test(info.release)) throw new Error('Invalid runtime metadata.');
      commit = info.release;
    } catch {
      throw new Error('Invalid installed bundle. Reinstall Open Cavas.');
    }
  }
  const env = { ...process.env, CAVAS_PROFILE: profile, CAVAS_APP_PORT: String(settings.appPort), CAVAS_MCP_PORT: String(settings.brokerPort), CAVAS_APP_ORIGIN: settings.origin, CAVAS_RUNTIME_STATE_ROOT: settings.stateDirectory, CAVAS_RELEASE_COMMIT: commit };
  const args = action === 'web'
    ? [
        path.join(installed ? root : webRoot, 'node_modules/vite/bin/vite.js'),
        ...(profile === 'dev' ? [] : ['preview']),
        '--config', installed ? path.join(root, 'scripts/installed-preview.mjs') : path.join(webRoot, 'vite.config.ts'),
        '--host', settings.bindHost,
        '--port', String(settings.appPort), '--strictPort',
        ...(openBrowser ? ['--open'] : []),
      ]
    : [path.join(root, 'node_modules/tsx/dist/cli.mjs'), path.join(serviceRoot, 'index.ts')];
  process.stderr.write(`Open Cavas ${profile}: ${action === 'web' ? settings.origin : `private MCP ${settings.brokerPort}`} ${release ? `release ${release.commit.slice(0, 7)}` : ''}\n`);
  let backend;
  let stopping = false;
  let restartTimer;
  let restartDelay = 1000;
  function recoverBackend() {
    if (stopping) return;
    process.stderr.write('Workspace service unavailable. Recovering ownership; no design request will be replayed.\n');
    restartTimer = setTimeout(() => {
      void startBackend().catch(() => { restartDelay = Math.min(30_000, restartDelay * 2); recoverBackend(); });
    }, restartDelay);
  }
  async function startBackend() {
    const processBackend = spawn(process.execPath, ['--import', 'tsx', path.join(serviceRoot, 'workspace-daemon.ts')], {
      cwd: root, env, stdio: ['ignore', 'inherit', 'inherit', 'ipc'],
    });
    backend = processBackend;
    await new Promise((resolve, reject) => {
      let ready = false;
      const timer = setTimeout(() => { processBackend.kill(); reject(new Error('Workspace service startup timed out.')); }, 15000);
      processBackend.once('message', () => { ready = true; clearTimeout(timer); restartDelay = 1000; resolve(); });
      processBackend.once('error', (error) => { clearTimeout(timer); reject(error); });
      processBackend.once('exit', (code) => {
        clearTimeout(timer);
        if (ready) recoverBackend();
        else reject(new Error(`Workspace service exited (${code}).`));
      });
    });
  }
  if (action === 'web') await startBackend();
  const child = spawn(process.execPath, args, { cwd: root, env, stdio: 'inherit' });
  function stop(signal = 'SIGTERM') {
    stopping = true;
    clearTimeout(restartTimer);
    child.kill(signal);
    backend?.kill(signal);
  }
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => stop(signal));
  child.on('error', (error) => { stop(); process.stderr.write(`${error.message}\n`); process.exitCode = 1; });
  child.on('exit', (code, signal) => { stop(); process.exitCode = code ?? (signal ? 1 : 0); });
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.join(checkoutRoot, 'scripts/runtime.mjs')) {
  try { await launch(process.argv[2] ?? 'main', process.argv[3] ?? 'web'); }
  catch (error) { process.stderr.write(`${error instanceof Error ? error.message : 'Runtime failed.'}\n`); process.exitCode = 1; }
}
