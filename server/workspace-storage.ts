import { constants } from 'node:fs';
import { link, lstat, mkdir, open, readdir, rename, rm } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { serviceRecordSchema, type ServiceRecord } from '../src/workspace/service-schema';

export class WorkspacePublicationUncertain extends Error {}
export const WORKSPACE_BYTES = 40_000_000;

/** A single broker owns this directory. Publish only complete, fsynced snapshots. */
export async function workspaceStorage(root: string) {
  await mkdir(root, { recursive: true, mode: 0o700 });
  const directory = await lstat(root);
  if (!directory.isDirectory() || directory.isSymbolicLink() || directory.mode & 0o077)
    throw new Error('Workspace directory must be private (0700), not a symlink.');
  async function load() {
    const records = new Map<string, ServiceRecord>();
    for (const name of await readdir(root)) {
      if (!name.endsWith('.json')) continue;
      if (!/^[A-Za-z0-9_-]{1,100}\.json$/.test(name))
        throw new Error('Invalid workspace filename. Existing data was not changed.');
      const file = await open(`${root}/${name}`, constants.O_RDONLY | constants.O_NOFOLLOW);
      try {
        const stat = await file.stat();
        if (!stat.isFile() || stat.mode & 0o077 || stat.size > WORKSPACE_BYTES)
          throw new Error('Workspace must be a private regular file under 40 MB.');
        const record = serviceRecordSchema.parse(JSON.parse(await file.readFile('utf8')));
        if (`${record.id}.json` !== name) throw new Error('Workspace identity mismatch.');
        records.set(record.id, record);
      } finally { await file.close(); }
    }
    return records;
  }
  async function write(record: ServiceRecord, creating = false) {
    const content = JSON.stringify(serviceRecordSchema.parse(record));
    if (Buffer.byteLength(content) > WORKSPACE_BYTES)
      throw new Error('Workspace exceeds the 40 MB local storage limit. Download backups and reduce its size.');
    const target = `${root}/${record.id}.json`;
    const temporary = `${root}/${record.id}.${randomUUID()}.tmp`;
    let published = false;
    const file = await open(temporary, 'wx', 0o600);
    try {
      await file.writeFile(content);
      await file.sync();
      await file.close();
      if (creating) await link(temporary, target);
      else {
        const stat = await lstat(target);
        if (!stat.isFile() || stat.isSymbolicLink() || stat.mode & 0o077)
          throw new Error('Workspace target is not a private regular file.');
        await rename(temporary, target);
      }
      published = true;
      const directory = await open(root, constants.O_RDONLY | constants.O_DIRECTORY);
      try { await directory.sync(); } finally { await directory.close(); }
    } catch (error) {
      if (published) throw new WorkspacePublicationUncertain('Workspace published but durability could not be confirmed. Restart only after coordinating clients; read state before any retry.');
      throw error;
    } finally {
      await file.close().catch(() => {});
      await rm(temporary, { force: true });
    }
  }
  return { load, write };
}
