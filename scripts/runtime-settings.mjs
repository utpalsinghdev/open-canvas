import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import path from 'node:path';

export const checkoutRoot = fileURLToPath(new URL('../', import.meta.url));

function port(value, fallback) {
  const result = Number(value ?? fallback);
  if (!Number.isInteger(result) || result < 1024 || result > 65535) throw new Error('Runtime ports must be integers between 1024 and 65535.');
  return result;
}
export function runtimeSettings(profile = process.env.CAVAS_PROFILE ?? 'dev', root = checkoutRoot) {
  if (!['main', 'dev', 'installed'].includes(profile)) throw new Error('CAVAS_PROFILE must be main, dev, or installed.');
  const main = profile === 'main';
  const installed = profile === 'installed';
  const appPort = port(process.env.CAVAS_APP_PORT, main ? 5182 : installed ? 5190 : 5188);
  const brokerPort = port(process.env.CAVAS_MCP_PORT, main ? 4781 : installed ? 4790 : 4785);
  const origin = installed ? `http://127.0.0.1:${appPort}` : process.env.CAVAS_APP_ORIGIN ?? `http://localmachine:${appPort}`;
  let url;
  try { url = new URL(origin); }
  catch { throw new Error('CAVAS_APP_ORIGIN must be a valid HTTP(S) origin.'); }
  if (!['http:', 'https:'].includes(url.protocol) || url.origin !== origin || Number(url.port || (url.protocol === 'https:' ? 443 : 80)) !== appPort) throw new Error('CAVAS_APP_ORIGIN must be an exact HTTP(S) origin using the app port.');
  if (appPort === brokerPort) throw new Error('App and private broker need separate ports.');
  if (main && (appPort !== 5182 || brokerPort !== 4781 || origin !== 'http://localmachine:5182')) throw new Error('Main runtime is fixed at http://localmachine:5182 and private broker 4781.');
  if (!main && [appPort, brokerPort].some((value) => [5182, 4781].includes(value))) throw new Error('Only main can use reserved ports 5182 and 4781.');
  if (installed && [appPort, brokerPort].some((value) => [5188, 4785].includes(value))) throw new Error('Installed runtime cannot use reserved development ports 5188 or 4785.');
  const stateDirectory = installed
    ? path.join(homedir(), '.open-cavas', 'data', `${appPort}-${brokerPort}`)
    : path.join(root, '.cavas', 'runtime', profile, `${appPort}-${brokerPort}`);
  return { profile, appPort, brokerPort, origin, stateDirectory, metadataPath: path.join(stateDirectory, 'broker.json') };
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
