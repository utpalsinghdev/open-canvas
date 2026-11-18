import { createServer } from 'node:http';
import { randomBytes, randomUUID, timingSafeEqual } from 'node:crypto';
import { mkdir, lstat, readFile, rm } from 'node:fs/promises';
import {
  runtimeSettings,
  runtimeStateDirectory,
  assertDevelopmentCheckout,
} from '../../../scripts/runtime-settings.mjs';
import { WebSocketServer, WebSocket } from 'ws';
import type { Location } from '@open-cavas/document/workspace';
import { browserAuthentication } from './browser-auth';
import { browserMessageSchema } from '@open-cavas/mcp/tools';
import { z } from 'zod';
import { createWorkspaceService } from './workspaces';
import { WORKSPACE_BYTES } from './workspace-storage';
import {
  brokerMetadataSchema,
  publishBrokerMetadata,
  connectToExistingBroker,
  removeStaleMetadata,
} from './shared-broker';

const MAX_BYTES = 12_000_000;
const TIMEOUT_MS = 30_000;
type Canvas = {
  workspaceId: string;
  socket: WebSocket;
  name: string;
  revision: number;
  context: Location;
};
type Pending = {
  socket: WebSocket;
  resolve: (data: unknown) => void;
  reject: (error: Error) => void;
  cleanup: () => void;
};
export async function createBroker() {
  const settings = runtimeSettings();
  if (settings.profile === 'dev') assertDevelopmentCheckout();
  const port = settings.brokerPort;
  const origin = settings.origin;
  const secret = randomBytes(32).toString('hex');
  const instanceId = randomUUID();
  const stateDirectory =
    process.env.CAVAS_RUNTIME_STATE_ROOT ?? runtimeStateDirectory(settings);
  await mkdir(stateDirectory, { recursive: true, mode: 0o700 });
  const directory = await lstat(stateDirectory);
  if (
    !directory.isDirectory() ||
    directory.isSymbolicLink() ||
    directory.mode & 0o077
  )
    throw new Error(
      'The runtime state directory must be private, mode 0700, and not a symlink.'
    );
  const metadataPath = `${stateDirectory}/broker.json`;
  const canvases = new Map<string, Canvas>();
  const pending = new Map<string, Pending>();
  const browserAuth = browserAuthentication(origin);
  let workspaces: Awaited<ReturnType<typeof createWorkspaceService>> | undefined;
  const workspace = (value: unknown, source: 'agent' | 'browser' = 'agent', signal?: AbortSignal) => {
    if (!workspaces) return Promise.reject(new Error('Workspace service starting or unavailable.'));
    return workspaces.request(value, source, signal);
  };
  const http = createServer((request, response) => {
    if (request.url === '/__cavas/session') {
      browserAuth.bootstrap(request, response);
      return;
    }
    if (request.url === '/__cavas/workspace') {
      if (request.method !== 'POST' || request.headers['x-cavas-connection'] !== 'browser' ||
          !browserAuth.accept(request, [`auth.${request.headers['x-cavas-ticket'] ?? ''}`])) {
        response.writeHead(403); response.end(); return;
      }
      const chunks: Buffer[] = [];
      let size = 0;
      request.on('data', (chunk: Buffer) => {
        size += chunk.length;
        if (size > WORKSPACE_BYTES) request.destroy(); else chunks.push(chunk);
      });
      request.on('end', () => {
        void Promise.resolve().then(() => workspace(JSON.parse(Buffer.concat(chunks).toString()), 'browser')).then(
          (result) => {
            response.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            response.end(JSON.stringify({ result }));
          },
          (error: unknown) => {
            response.writeHead(400, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
            response.end(JSON.stringify({ error: error instanceof Error ? error.message : 'Workspace request failed.' }));
          }
        );
      });
      return;
    }
    if (!request.url?.startsWith('/__cavas_internal/')) {
      response.writeHead(404);
      response.end();
      return;
    }
    const authorization = request.headers.authorization ?? '';
    const supplied = authorization.startsWith('Bearer ')
      ? authorization.slice(7)
      : '';
    if (
      !/^[a-f0-9]{64}$/.test(supplied) ||
      !timingSafeEqual(Buffer.from(supplied), Buffer.from(secret))
    ) {
      response.writeHead(403);
      response.end();
      return;
    }
    const chunks: Buffer[] = [];
    let bytes = 0;
    request.on('data', (chunk: Buffer) => {
      bytes += chunk.length;
      if (bytes > MAX_BYTES) request.destroy();
      else chunks.push(chunk);
    });
    request.on('end', () => {
      void (async () => {
        try {
          const route = request.url;
          if (
            route === '/__cavas_internal/identity' &&
            request.method === 'GET'
          ) {
            response.writeHead(200, { 'content-type': 'application/json' });
            response.end(JSON.stringify({ instanceId }));
            return;
          }
          if (request.method !== 'POST')
            throw new Error('Invalid internal request.');
          const input: unknown = JSON.parse(Buffer.concat(chunks).toString());
          const body = z.record(z.string(), z.unknown()).safeParse(input);
          if (!body.success) throw new Error('Invalid internal request.');
          const controller = new AbortController();
          request.on('aborted', () => controller.abort());
          response.on('close', () => {
            if (!response.writableEnded) controller.abort();
          });
          const result =
            route === '/__cavas_internal/workspace'
              ? await workspace(input, 'agent', controller.signal)
              : route === '/__cavas_internal/list'
              ? [...canvases].map(([canvasId, canvas]) => ({
                  canvasId,
                  name: canvas.name,
                  revision: canvas.revision,
                  context: canvas.context,
                }))
              : route === '/__cavas_internal/call' &&
                  typeof body.data.canvasId === 'string' &&
                  typeof body.data.method === 'string'
                ? await callLocal(
                    body.data.canvasId,
                    body.data.method,
                    body.data.args,
                    controller.signal
                  )
                : (() => {
                    throw new Error('Invalid internal request.');
                  })();
          response.writeHead(200, { 'content-type': 'application/json' });
          response.end(JSON.stringify({ result }));
        } catch (error) {
          response.writeHead(400, { 'content-type': 'application/json' });
          response.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : 'Request failed.',
            })
          );
        }
      })();
    });
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
    if (
      request.url !== '/__cavas' ||
      request.headers.origin !== origin ||
      !browserAuth.accept(request, protocols) ||
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
          workspaceId: message.workspaceId,
          socket,
          name: message.name,
          revision: message.revision,
          context: message.context,
        });
        return;
      }
      if (!canvasId) {
        socket.close(1008, 'Hello required');
        return;
      }
      if (message.type === 'state') {
        const current = canvases.get(canvasId);
        if (!current) return;
        canvases.set(canvasId, {
          workspaceId: current.workspaceId,
          socket,
          name: message.name,
          revision: message.revision,
          context: message.context,
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
  const listLocal = () =>
    [...canvases].map(([canvasId, canvas]) => ({
      canvasId,
      name: canvas.name,
      revision: canvas.revision,
      context: canvas.context,
    }));
  const callLocal = async (
    canvasId: string,
    method: string,
    args: unknown,
    signal: AbortSignal
  ) => {
    const target = canvases.get(canvasId);
    if (!target) throw new Error('Canvas not connected. Use list_workspaces for browser-independent access.');
    const record = await workspace({ method: 'read', id: target.workspaceId });
    const access = z.object({ agentEnabled: z.boolean() }).parse(record);
    if (!access.agentEnabled) throw new Error('Agent access paused for this workspace.');
    return new Promise<unknown>((resolve, reject) => {
      const canvas = canvases.get(canvasId);
      if (!canvas || canvas.socket.readyState !== WebSocket.OPEN) {
        reject(
          new Error(
            'Canvas not connected. Open Open Cavas in the browser and call list_canvases.'
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
        // End presence only. A dispatched write can still have an unknown outcome.
        if (canvas.socket.readyState === WebSocket.OPEN)
          canvas.socket.send(JSON.stringify({ type: 'activity-end', id }), () => {});
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
    });
  };
  try {
    await new Promise<void>((resolve, reject) => {
      http.once('error', reject);
      http.listen(port, '127.0.0.1', () => {
        http.off('error', reject);
        resolve();
      });
    });
    // Reclaim stale credentials only while holding the exclusive listener.
    // Attaching clients must never race another owner's metadata publication.
    await removeStaleMetadata(metadataPath);
    workspaces = await createWorkspaceService(`${stateDirectory}/workspaces`, (id, enabled) => {
      if (enabled) return;
      for (const canvas of canvases.values()) {
        if (canvas.workspaceId === id) canvas.socket.close(1008, 'Workspace agent access paused');
      }
    });
    await publishBrokerMetadata(metadataPath, {
      token: secret, port, origin, pid: process.pid, instanceId,
    });
  } catch (error) {
    http.close();
    sockets.close();
    if (
      error instanceof Error &&
      'code' in error &&
      error.code === 'EADDRINUSE'
    ) {
      return connectToExistingBroker(metadataPath, port, origin);
    }
    throw error;
  }
  let closed = false;
  return {
    verify: async () => {
      if (closed) throw new Error('Broker is closed.');
    },
    list: listLocal,
    call: callLocal,
    workspace: (value: unknown, signal?: AbortSignal) => workspace(value, 'agent', signal),
    close: async () => {
      closed = true;
      await workspaces?.close();
      for (const socket of sockets.clients) socket.terminate();
      sockets.close();
      http.close();
      try {
        const stored = brokerMetadataSchema.parse(
          JSON.parse(await readFile(metadataPath, 'utf8'))
        );
        if (stored.instanceId === instanceId) await rm(metadataPath);
      } catch {
        /* Another process may have replaced or removed the metadata. */
      }
    },
    metadataPath,
  };
}
