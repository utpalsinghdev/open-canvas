import { createServer } from 'node:http';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, lstat, writeFile, rename, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import { browserMessageSchema } from '../src/mcp/tools';

const MAX_BYTES = 12_000_000;
const TIMEOUT_MS = 30_000;
type Canvas = { socket: WebSocket; name: string; revision: number };
type Pending = {
  socket: WebSocket;
  resolve: (data: unknown) => void;
  reject: (error: Error) => void;
  cleanup: () => void;
};
export async function createBroker() {
  const port = Number(process.env.CAVAS_MCP_PORT ?? 4781);
  if (!Number.isInteger(port) || port < 1024 || port > 65535)
    throw new Error('CAVAS_MCP_PORT must be between 1024 and 65535.');
  const origin = process.env.CAVAS_APP_ORIGIN ?? 'http://localmachine:5182';
  if (
    !['http:', 'https:'].includes(new URL(origin).protocol) ||
    new URL(origin).origin !== origin
  )
    throw new Error(
      'CAVAS_APP_ORIGIN must be an exact HTTP(S) origin without a path.'
    );
  const secret = randomBytes(32).toString('hex');
  const pairingDirectory = fileURLToPath(
    new URL('../.cavas/', import.meta.url)
  );
  await mkdir(pairingDirectory, { recursive: true, mode: 0o700 });
  const directory = await lstat(pairingDirectory);
  if (
    !directory.isDirectory() ||
    directory.isSymbolicLink() ||
    directory.mode & 0o077
  )
    throw new Error(
      '.cavas must be a private directory, mode 0700, not a symlink.'
    );
  const pairingPath = `${pairingDirectory}/pairing.json`;
  const temporaryPath = `${pairingPath}.${randomUUID()}`;
  const canvases = new Map<string, Canvas>();
  const pending = new Map<string, Pending>();
  const http = createServer((_request, response) => {
    response.writeHead(404);
    response.end();
  });
  const sockets = new WebSocketServer({
    noServer: true,
    maxPayload: MAX_BYTES,
    handleProtocols: (protocols) => (protocols.has('cavas') ? 'cavas' : false),
  });

  http.on('upgrade', (request, socket, head) => {
    const protocols = (request.headers['sec-websocket-protocol'] ?? '')
      .split(',')
      .map((value) => value.trim());
    const supplied =
      protocols.find((value) => value.startsWith('pair.'))?.slice(5) ?? '';
    const authorized =
      /^[a-f0-9]{64}$/.test(supplied) &&
      timingSafeEqual(Buffer.from(supplied), Buffer.from(secret));
    if (
      request.url !== '/__cavas' ||
      request.headers.origin !== origin ||
      !authorized ||
      !protocols.includes('cavas') ||
      sockets.clients.size >= 8
    ) {
      socket.write('HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n');
      socket.destroy();
      return;
    }
    sockets.handleUpgrade(request, socket, head, (ws) =>
      sockets.emit('connection', ws, request)
    );
  });
  sockets.on('connection', (socket) => {
    let canvasId: string | null = null;
    let alive = true;
    const helloTimeout = setTimeout(() => {
      if (!canvasId) socket.close(1008, 'Hello required');
    }, 5000);
    socket.on('pong', () => {
      alive = true;
    });
    const heartbeat = setInterval(() => {
      if (!alive) {
        socket.terminate();
        return;
      }
      alive = false;
      socket.ping();
    }, 15_000);
    socket.on('message', (raw) => {
      let value: unknown;
      try {
        value = JSON.parse(raw.toString());
      } catch {
        socket.close(1008, 'Invalid JSON');
        return;
      }
      const parsed = browserMessageSchema.safeParse(value);
      if (!parsed.success) {
        socket.close(1008, 'Invalid message');
        return;
      }
      const message = parsed.data;
      if (message.type === 'hello') {
        if (canvasId || canvases.has(message.canvasId)) {
          socket.close(1008, 'Duplicate canvas');
          return;
        }
        clearTimeout(helloTimeout);
        canvasId = message.canvasId;
        canvases.set(canvasId, {
          socket,
          name: message.name,
          revision: message.revision,
        });
        return;
      }
      if (!canvasId) {
        socket.close(1008, 'Hello required');
        return;
      }
      if (message.type === 'state') {
        canvases.set(canvasId, {
          socket,
          name: message.name,
          revision: message.revision,
        });
        return;
      }
      const call = pending.get(message.id);
      if (!call || call.socket !== socket) return;
      pending.delete(message.id);
      call.cleanup();
      if (message.ok) call.resolve(message.data);
      else call.reject(new Error(message.error));
    });
    socket.on('error', () => socket.terminate());
    socket.on('close', () => {
      clearTimeout(helloTimeout);
      clearInterval(heartbeat);
      if (canvasId) canvases.delete(canvasId);
      for (const [id, call] of pending) {
        if (call.socket !== socket) continue;
        pending.delete(id);
        call.cleanup();
        call.reject(
          new Error(
            'Canvas disconnected. Outcome may be unknown. Reconnect and read state before retrying a mutation.'
          )
        );
      }
    });
  });
  try {
    await new Promise<void>((resolve, reject) => {
      http.once('error', reject);
      http.listen(port, '127.0.0.1', () => {
        http.off('error', reject);
        resolve();
      });
    });
    await writeFile(
      temporaryPath,
      JSON.stringify({ token: secret, port, origin }),
      { mode: 0o600, flag: 'wx' }
    );
    await rename(temporaryPath, pairingPath);
  } catch (error) {
    await rm(temporaryPath, { force: true });
    http.close();
    sockets.close();
    throw error;
  }
  return {
    list: () =>
      [...canvases].map(([canvasId, canvas]) => ({
        canvasId,
        name: canvas.name,
        revision: canvas.revision,
      })),
    call: (
      canvasId: string,
      method: string,
      args: unknown,
      signal: AbortSignal
    ) =>
      new Promise<unknown>((resolve, reject) => {
        const canvas = canvases.get(canvasId);
        if (!canvas || canvas.socket.readyState !== WebSocket.OPEN) {
          reject(
            new Error(
              'Canvas not connected. Pair a browser and call list_canvases.'
            )
          );
          return;
        }
        if (signal.aborted) {
          reject(new Error('Request cancelled before dispatch.'));
          return;
        }
        const id = randomUUID();
        const message = JSON.stringify({ type: 'request', id, method, args });
        if (Buffer.byteLength(message) > MAX_BYTES) {
          reject(new Error('Request exceeds 12 MB transport limit.'));
          return;
        }
        const fail = (error: Error) => {
          const call = pending.get(id);
          if (!call) return;
          pending.delete(id);
          call.cleanup();
          reject(error);
        };
        const timer = setTimeout(
          () =>
            fail(
              new Error(
                'Canvas request timed out. Outcome may be unknown. Read state before retrying.'
              )
            ),
          TIMEOUT_MS
        );
        const abort = () =>
          fail(
            new Error(
              'Request cancelled after dispatch. Outcome may be unknown. Read state before retrying.'
            )
          );
        pending.set(id, {
          socket: canvas.socket,
          resolve,
          reject,
          cleanup: () => {
            clearTimeout(timer);
            signal.removeEventListener('abort', abort);
          },
        });
        signal.addEventListener('abort', abort, { once: true });
        canvas.socket.send(message, (error) => {
          if (error)
            fail(
              new Error(
                'Send failed. Outcome may be unknown. Read state before retrying.'
              )
            );
        });
      }),
    close: async () => {
      for (const socket of sockets.clients) socket.terminate();
      sockets.close();
      http.close();
      await rm(pairingPath, { force: true });
    },
    pairingPath,
  };
}
