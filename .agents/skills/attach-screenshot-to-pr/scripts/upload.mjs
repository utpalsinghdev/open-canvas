#!/usr/bin/env node
import { createHash, randomUUID } from 'node:crypto';
import { readFile, stat } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';
import { parseEnv } from 'node:util';

class UploadError extends Error {}

const credentialsUrl = new URL('../.env', import.meta.url);
const usage = 'Usage: node upload.mjs /absolute/path/to/screenshot.png | --check';

async function configuration() {
  const names = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const fromEnvironment = names.some((name) => process.env[name] !== undefined);
  let env;
  if (fromEnvironment) {
    // Keep one credential source so partial environment settings cannot mix accounts.
    env = process.env;
  } else {
    let info;
    try {
      info = await stat(credentialsUrl);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      throw new UploadError('Cloudinary is not configured. Copy the skill .env.example to .env, fill in your own values, and run chmod 600 on .env. Alternatively set all three CLOUDINARY environment variables.');
    }
    if (!info.isFile()) throw new UploadError('The skill .env must be a regular file.');
    if (process.platform !== 'win32' && (info.mode & 0o077) !== 0) {
      throw new UploadError('Credential file must be owner-only. Run chmod 600 on the skill .env file.');
    }
    env = parseEnv(await readFile(credentialsUrl, 'utf8'));
  }
  const cloud = env.CLOUDINARY_CLOUD_NAME;
  const key = env.CLOUDINARY_API_KEY;
  const secret = env.CLOUDINARY_API_SECRET;
  if (!cloud || !key || !secret || !/^[a-z0-9_-]+$/i.test(cloud)) {
    throw new UploadError('Missing or invalid Cloudinary configuration. Provide all three values in the skill .env file or all three environment variables.');
  }
  return { cloud, key, secret };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length !== 1) throw new UploadError(usage);
  if (args[0] === '--help') {
    console.log(usage);
    return;
  }

  const { cloud, key, secret } = await configuration();
  if (args[0] === '--check') {
    console.log('Cloudinary configuration is complete. No network request made; credentials have not been authenticated.');
    return;
  }

  const file = resolve(args[0]);
  const types = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp' };
  const type = types[extname(file).toLowerCase()];
  if (!type) throw new UploadError('Only PNG, JPEG, and WebP screenshots are supported.');
  const info = await stat(file);
  if (!info.isFile() || info.size === 0 || info.size > 10 * 1024 * 1024) {
    throw new UploadError('Screenshot must be a nonempty file no larger than 10 MiB.');
  }

  // Unique IDs isolate PR evidence from client assets and prevent overwrites.
  const params = {
    overwrite: 'false',
    public_id: `pr-screenshots/${randomUUID()}`,
    timestamp: String(Math.floor(Date.now() / 1000)),
  };
  const signed = Object.entries(params).sort(([a], [b]) => a.localeCompare(b))
    .map(([name, value]) => `${name}=${value}`).join('&');
  const signature = createHash('sha1').update(signed + secret).digest('hex');
  const form = new FormData();
  for (const [name, value] of Object.entries(params)) form.set(name, value);
  form.set('api_key', key);
  form.set('signature', signature);
  form.set('file', new Blob([await readFile(file)], { type }), basename(file));

  // Do not retry automatically: a lost response can still mean a successful upload.
  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloud}/image/upload`, {
    method: 'POST', body: form, signal: AbortSignal.timeout(60_000), redirect: 'error',
  });
  if (!response.ok) {
    throw new UploadError(`Cloudinary upload failed (HTTP ${response.status}). No automatic retry performed.`);
  }
  const result = await response.json();
  if (typeof result.secure_url !== 'string') throw new UploadError('Cloudinary returned no secure image URL.');
  const url = new URL(result.secure_url);
  if (url.protocol !== 'https:' || url.hostname !== 'res.cloudinary.com') {
    throw new UploadError('Cloudinary returned an unexpected image URL.');
  }
  console.log(url.href);
}

main().catch((error) => {
  // Avoid dumping upstream responses or exceptions that might contain credentials.
  console.error(error instanceof UploadError ? error.message : 'Screenshot upload/configuration failed. Check input path, private credential configuration, and network access. Do not retry an uncertain upload automatically.');
  process.exitCode = 1;
});
