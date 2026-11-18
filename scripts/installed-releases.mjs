import { spawn } from 'node:child_process';
import { readFile, realpath } from 'node:fs/promises';
import { homedir } from 'node:os';
import path from 'node:path';
import { checkoutRoot } from './runtime-settings.mjs';

const repository = 'utpalsinghdev/open-canvas';
const releases = `https://github.com/${repository}/releases`;
const latestApi = `https://api.github.com/repos/${repository}/releases/latest`;
const stableTag = /^v(0|[1-9]\d{0,8})\.(0|[1-9]\d{0,8})\.(0|[1-9]\d{0,8})$/;
const archive = `open-cavas-${process.platform}-${process.arch}.tar.gz`;

async function latestRelease() {
  let response;
  try {
    response = await fetch(latestApi, {
      headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'open-cavas-cli' },
      redirect: 'error',
      signal: AbortSignal.timeout(10_000),
    });
  } catch {
    throw new Error(`Could not reach GitHub for release information. Try again later or visit ${releases}.`);
  }
  if (response.status === 404) {
    throw new Error(`No public stable release is available yet. See ${releases}.`);
  }
  if (!response.ok) {
    throw new Error(`GitHub returned HTTP ${response.status}. Try again later or visit ${releases}.`);
  }
  let release;
  try { release = await response.json(); }
  catch { throw new Error('GitHub returned unreadable release information.'); }
  const tag = release?.tag_name;
  if (typeof tag !== 'string' || tag.match(stableTag)?.[0] !== tag || release.draft !== false || release.prerelease !== false || !Array.isArray(release.assets)) {
    throw new Error('GitHub did not return a stable Open Cavas release.');
  }
  const assets = new Set(release.assets.map((asset) => asset?.name));
  return {
    tag,
    version: tag.slice(1),
    url: `${releases}/tag/${tag}`,
    installable: assets.has(archive) && assets.has(`${archive}.sha256`),
    notes: typeof release.body === 'string' ? release.body.slice(0, 65_536) : '',
  };
}

function compareVersions(left, right) {
  const current = right.split('.').map(Number);
  return left.split('.').map(Number).reduce((comparison, part, index) => comparison || part - current[index], 0);
}

async function assertManagedInstall() {
  const command = path.join(homedir(), '.local', 'bin', 'open-cavas');
  const installedPath = await realpath(command).catch(() => undefined);
  const bundleLauncher = path.join(checkoutRoot, 'bin', 'open-cavas');
  if (installedPath !== bundleLauncher) {
    throw new Error('Update the active install through ~/.local/bin/open-cavas, or run the installer to install this app.');
  }
}

function runInstaller(tag) {
  const installer = path.join(checkoutRoot, 'scripts', 'install.sh');
  const child = spawn('bash', [installer, '--version', tag], { stdio: 'inherit' });
  const interrupt = () => child.kill('SIGINT');
  const terminate = () => child.kill('SIGTERM');
  process.once('SIGINT', interrupt);
  process.once('SIGTERM', terminate);
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('close', (code, signal) => {
      process.removeListener('SIGINT', interrupt);
      process.removeListener('SIGTERM', terminate);
      resolve(code ?? (signal === 'SIGINT' ? 130 : signal === 'SIGTERM' ? 143 : 1));
    });
  });
}

export async function update(current, checkOnly) {
  if (!stableTag.test(`v${current}`)) throw new Error('This build does not have a stable version to update.');
  const latest = await latestRelease();
  const comparison = compareVersions(latest.version, current);
  if (comparison === 0) {
    console.log(`Open Cavas ${current} is up to date.\n${latest.url}`);
    return;
  }
  if (comparison < 0) {
    console.log(`Open Cavas ${current} is newer than the latest release (${latest.version}). No downgrade.\n${latest.url}`);
    return;
  }
  if (!latest.installable) {
    const notice = `Open Cavas ${latest.version} has no archive and checksum for ${process.platform}-${process.arch}.\n${latest.url}`;
    if (!checkOnly) throw new Error(notice);
    console.log(notice);
    return;
  }
  console.log(`Open Cavas ${current} → ${latest.version} is available.\nRelease notes: ${latest.url}`);
  if (checkOnly) {
    console.log('Save your work and stop the editor and MCP clients, then run open-cavas update.');
    return;
  }
  await assertManagedInstall();
  const status = await runInstaller(latest.tag);
  if (status === 130 || status === 143) {
    process.exitCode = status;
    return;
  }
  if (status !== 0) throw new Error('Update did not complete. Check the installer error above.');
  console.log('Start open-cavas again and reconnect your MCP clients to use the new version.');
}

export async function changelog(latest) {
  if (latest) {
    const release = await latestRelease();
    // Treat release notes as plain text, never as terminal control sequences.
    const notes = Array.from(release.notes).filter((char) => char === '\n' || char === '\t' || (char >= ' ' && (char < '\x7f' || char > '\x9f'))).join('');
    console.log(`Open Cavas ${release.version}\n${release.url}\n\n${notes.trim() || 'No release notes were provided.'}`);
  } else {
    const notes = await readFile(path.join(checkoutRoot, 'apps/web/CHANGELOG.md'), 'utf8');
    process.stdout.write(notes);
  }
}
