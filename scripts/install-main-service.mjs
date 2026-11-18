import { execFileSync, spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile, rename, lstat } from 'node:fs/promises';
import { createConnection } from 'node:net';
import { homedir } from 'node:os';
import path from 'node:path';
import { checkoutRoot, git, runtimeSettings } from './runtime-settings.mjs';
import { mainRuntimeSettings, selectedRelease } from './runtime.mjs';

const UNIT = 'open-cavas-main.service';
const MARKER = '# Managed by Open Cavas install-main-service.mjs';
const quote = (value) => `"${value.replace(/%/g, '%%').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
function serviceUnit({ origin }) {
  const environment = process.env.CAVAS_APP_ORIGIN
    ? `Environment=${quote(`CAVAS_APP_ORIGIN=${origin}`)}\n`
    : '';
  return `${MARKER}
[Unit]
Description=Open Cavas stable main frontend
StartLimitIntervalSec=60
StartLimitBurst=5

[Service]
Type=simple
WorkingDirectory=${checkoutRoot.replace(/%/g, '%%')}
ExecStart=${quote(process.execPath)} ${quote(path.join(checkoutRoot, 'scripts/runtime.mjs'))} main web
${environment}Restart=on-failure
RestartSec=2
TimeoutStopSec=20
KillMode=control-group

[Install]
WantedBy=default.target
`;
}
function portOccupied(host, port) {
  return new Promise((resolve, reject) => {
    const socket = createConnection({ host, port });
    socket.setTimeout(1500);
    socket.once('connect', () => { socket.destroy(); resolve(true); });
    socket.once('timeout', () => { socket.destroy(); reject(new Error('Port check timed out; no service changes made.')); });
    socket.once('error', (error) => error.code === 'ECONNREFUSED' ? resolve(false) : reject(error));
  });
}
try {
  if (process.argv.includes('--print')) { process.stdout.write(serviceUnit(runtimeSettings('main'))); process.exit(0); }
  if (process.platform !== 'linux') throw new Error('This installer requires a Linux systemd user manager.');
  const common = path.resolve(checkoutRoot, git(checkoutRoot, 'rev-parse', '--git-common-dir'));
  if (git(checkoutRoot, 'branch', '--show-current') !== 'main' || path.dirname(common) !== path.resolve(checkoutRoot)) throw new Error('Install from the primary main checkout only.');
  const settings = await mainRuntimeSettings(await selectedRelease());
  const unit = serviceUnit(settings);
  execFileSync('systemctl', ['--user', 'show-environment'], { stdio: 'ignore' });
  const directory = path.join(homedir(), '.config', 'systemd', 'user');
  const target = path.join(directory, UNIT);
  let previous;
  try {
    const stats = await lstat(target);
    if (!stats.isFile() || stats.isSymbolicLink()) throw new Error('Refusing to replace a non-regular service file.');
    previous = await readFile(target, 'utf8');
    if (!previous.startsWith(MARKER)) throw new Error('Service name already belongs to another owner. No changes made.');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const active = spawnSync('systemctl', ['--user', 'is-active', '--quiet', UNIT]).status === 0;
  if (active && previous === unit) {
    process.stdout.write(`${UNIT} is already installed and running. No service changes made.\n`);
    process.exit(0);
  }
  const probeHost = settings.bindHost === '0.0.0.0' ? '127.0.0.1' : settings.bindHost;
  if (!active && await portOccupied(probeHost, settings.appPort)) throw new Error('Main web address is already owned by another process. Coordinate stopping that frontend before installing the service.');
  await mkdir(directory, { recursive: true });
  if (previous !== undefined && previous !== unit) await writeFile(`${target}.backup-${Date.now()}`, previous, { flag: 'wx', mode: 0o600 });
  const temporary = `${target}.${process.pid}.tmp`;
  await writeFile(temporary, unit, { flag: 'wx', mode: 0o644 });
  await rename(temporary, target);
  execFileSync('systemctl', ['--user', 'daemon-reload'], { stdio: 'inherit' });
  execFileSync('systemctl', ['--user', 'enable', '--now', UNIT], { stdio: 'inherit' });
  process.stdout.write(`Installed ${UNIT}. Main frontend is managed outside agent sessions.\nExisting active services are not restarted by this installer. Use pnpm run service:restart at an authorized rollout boundary.\n`);
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'Service installation failed.'}\n`);
  process.exitCode = 1;
}
