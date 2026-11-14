import { lstat, readFile, rm, writeFile, link } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const TIMEOUT_MS = 30_000;
export const brokerMetadataSchema = z.object({
  token: z.string().regex(/^[a-f0-9]{64}$/),
  port: z.number().int().min(1024).max(65535),
  origin: z.string().url(),
  pid: z.number().int().positive(),
  instanceId: z.string().uuid(),
});
/** Publish complete credentials exclusively; a killed writer cannot expose an empty final file. */
export async function publishBrokerMetadata(metadataPath: string, metadata: z.infer<typeof brokerMetadataSchema>) {
  const temporary = `${metadataPath}.${randomUUID()}.tmp`;
  try {
    await writeFile(temporary, JSON.stringify(brokerMetadataSchema.parse(metadata)), { mode: 0o600, flag: 'wx' });
    await link(temporary, metadataPath);
  } finally {
    await rm(temporary, { force: true });
  }
}
export async function removeStaleMetadata(metadataPath: string) {
  let raw: string;
  let metadata: z.infer<typeof brokerMetadataSchema>;
  try {
    const file = await lstat(metadataPath);
    if (!file.isFile() || file.isSymbolicLink() || file.mode & 0o077)
      throw new Error('Broker metadata is not a private regular file.');
    raw = await readFile(metadataPath, 'utf8');
    metadata = brokerMetadataSchema.parse(JSON.parse(raw));
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'ENOENT')
      return;
    throw new Error(
      'Existing broker metadata is invalid; refusing to replace it.'
    );
  }
  try {
    process.kill(metadata.pid, 0);
    return;
  } catch (error) {
    if (
      !(error instanceof Error) ||
      !('code' in error) ||
      error.code !== 'ESRCH'
    )
      return;
  }
  try {
    const response = await fetch(
      `http://127.0.0.1:${metadata.port}/__cavas_internal/identity`,
      {
        headers: { authorization: `Bearer ${metadata.token}` },
        signal: AbortSignal.timeout(3000),
        redirect: 'error',
      }
    );
    const identity = z
      .object({ instanceId: z.string().uuid() })
      .safeParse(await response.json());
    if (
      response.ok &&
      identity.success &&
      identity.data.instanceId === metadata.instanceId
    )
      return;
  } catch {
    /* Listener is gone or no longer owns this private identity. */
  }
  const current = await readFile(metadataPath, 'utf8').catch(() => null);
  if (current === raw) await rm(metadataPath);
}
export async function connectToExistingBroker(
  metadataPath: string,
  port: number,
  origin: string
) {
  const file = await lstat(metadataPath);
  if (!file.isFile() || file.isSymbolicLink() || file.mode & 0o077)
    throw new Error('Existing broker metadata is not a private regular file.');
  let metadata: z.infer<typeof brokerMetadataSchema>;
  try {
    metadata = brokerMetadataSchema.parse(
      JSON.parse(await readFile(metadataPath, 'utf8'))
    );
  } catch {
    throw new Error(
      'Existing broker metadata is missing or invalid; refusing to replace it.'
    );
  }
  if (metadata.port !== port || metadata.origin !== origin)
    throw new Error(
      'Existing broker configuration does not match this MCP process.'
    );
  const base = `http://127.0.0.1:${port}`;
  const headers = { authorization: `Bearer ${metadata.token}` };
  const identityResponse = await fetch(`${base}/__cavas_internal/identity`, {
    headers,
    signal: AbortSignal.timeout(3000),
    redirect: 'error',
  });
  if (!identityResponse.ok)
    throw new Error('Port is occupied by an unverified listener.');
  const identity = z
    .object({ instanceId: z.string().uuid() })
    .parse(await identityResponse.json());
  if (identity.instanceId !== metadata.instanceId)
    throw new Error(
      'Existing broker identity does not match its private metadata.'
    );
  return {
    list: async () => {
      const response = await fetch(`${base}/__cavas_internal/list`, {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: '{}',
        signal: AbortSignal.timeout(5000),
        redirect: 'error',
      });
      if (!response.ok) throw new Error('Shared broker request failed.');
      return z
        .object({
          result: z.array(
            z.object({
              canvasId: z.string(),
              name: z.string(),
              revision: z.number(),
              context: z.unknown(),
            })
          ),
        })
        .parse(await response.json()).result;
    },
    call: async (
      canvasId: string,
      method: string,
      args: unknown,
      signal: AbortSignal
    ) => {
      const response = await fetch(`${base}/__cavas_internal/call`, {
        method: 'POST',
        headers: { ...headers, 'content-type': 'application/json' },
        body: JSON.stringify({ canvasId, method, args }),
        signal: AbortSignal.any([
          signal,
          AbortSignal.timeout(TIMEOUT_MS + 3000),
        ]),
        redirect: 'error',
      });
      const body: unknown = await response.json();
      if (!response.ok) {
        const error = z.object({ error: z.string() }).safeParse(body);
        throw new Error(
          error.success ? error.data.error : 'Shared broker request failed.'
        );
      }
      return z.object({ result: z.unknown() }).parse(body).result;
    },
    close: async () => {},
    metadataPath,
  };
}
