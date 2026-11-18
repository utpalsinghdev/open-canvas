import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { lstatSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

export const checkoutRoot = fileURLToPath(new URL('../', import.meta.url));
export const dataDirectoryName = '.open-canvas';
export const legacySourceDirectoryName = '.cavas';
const legacyInstalledDirectoryName = '.open-cavas';
export const privateDirectoryNames = [dataDirectoryName, legacySourceDirectoryName, legacyInstalledDirectoryName];

export function runtimeStateDirectory({ profile, appPort, brokerPort }, root = checkoutRoot) {
  const installed = profile === 'installed';
  const base = installed ? homedir() : root;
  const parts = [...(installed ? ['data'] : ['runtime', profile]), `${appPort}-${brokerPort}`];
  const directory = path.join(base, dataDirectoryName, ...parts);
  const legacy = path.join(base, installed ? legacyInstalledDirectoryName : legacySourceDirectoryName, ...parts);
  if (!lstatSync(legacy, { throwIfNoEntry: false })) return directory;
  if (lstatSync(directory, { throwIfNoEntry: false })) {
    throw new Error(`Two state directories exist for this runtime: ${directory} and ${legacy}. Stop the runtime and back up both before choosing a workspace directory. No data was moved.`);
  }
  return legacy;
}

function port(value, fallback) {
  const result = Number(value ?? fallback);
  if (!Number.isInteger(result) || result < 1024 || result > 65535) throw new Error('Runtime ports must be integers between 1024 and 65535.');
  return result;
}
export function runtimeSettings(profile = process.env.CAVAS_PROFILE ?? 'dev') {
  if (!['main', 'dev', 'installed'].includes(profile)) throw new Error('CAVAS_PROFILE must be main, dev, or installed.');
  const main = profile === 'main';
  const installed = profile === 'installed';
  const appPort = port(process.env.CAVAS_APP_PORT, main ? 5182 : installed ? 5190 : 5188);
  const brokerPort = port(process.env.CAVAS_MCP_PORT, main ? 4781 : installed ? 4790 : 4785);
  const defaultOrigin = `http://127.0.0.1:${appPort}`;
  const origin = (installed ? undefined : process.env.CAVAS_APP_ORIGIN) ?? defaultOrigin;
  let url;
  try { url = new URL(origin); }
  catch { throw new Error('CAVAS_APP_ORIGIN must be a valid HTTP(S) origin.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || Number(url.port || (url.protocol === 'https:' ? 443 : 80)) !== appPort) throw new Error('CAVAS_APP_ORIGIN must be an exact HTTP(S) origin using the app port.');
  if (appPort === brokerPort) throw new Error('App and private broker need separate ports.');
  const bindHost = url.hostname.replace(/^\[|\]$/g, '');
  if (['0.0.0.0', '::', '*'].includes(bindHost)) throw new Error('CAVAS_APP_ORIGIN must name a specific interface, not a wildcard.');
  if (main && (appPort !== 5182 || brokerPort !== 4781)) throw new Error('Main runtime uses fixed ports 5182 and 4781.');
  if (!main && [appPort, brokerPort].some((value) => [5182, 4781].includes(value))) throw new Error('Only main can use reserved ports 5182 and 4781.');
  if (installed && [appPort, brokerPort].some((value) => [5188, 4785].includes(value))) throw new Error('Installed runtime cannot use reserved development ports 5188 or 4785.');
  return { profile, appPort, brokerPort, origin, bindHost };
}
export function git(root, ...args) {
  return execFileSync('git', ['-C', root, ...args], { encoding: 'utf8' }).trim();
}
export function assertDevelopmentCheckout(root = checkoutRoot) {
  const branch = git(root, 'branch', '--show-current');
  const common = path.resolve(root, git(root, 'rev-parse', '--git-common-dir'));
  if (path.dirname(common) === path.resolve(root)) throw new Error('Use a separate feature worktree for development, not the primary main checkout.');
  if (!branch || branch === 'main') throw new Error('Development must run on a feature branch in a separate checkout/worktree. Use pnpm start for the main release.');
}
