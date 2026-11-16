import { z } from 'zod';

export type ConnectionStatus = 'waiting' | 'connected';
const sessionSchema = z.object({ ticket: z.string().regex(/^[a-f0-9]{64}$/) });

/** Reconnects the transport only. Design requests are never replayed. */
export function automaticConnection(
  onStatus: (status: ConnectionStatus) => void,
  attach: (socket: WebSocket) => () => void
) {
  let stopped = false;
  let retryMs = 500;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let deadline: ReturnType<typeof setTimeout> | undefined;
  let abort: AbortController | undefined;
  let socket: WebSocket | undefined;
  let detach: (() => void) | undefined;
  function retry() {
    if (stopped) return;
    onStatus('waiting');
    timer = setTimeout(() => {
      void connect();
    }, retryMs);
    retryMs = Math.min(10_000, retryMs * 2);
  }
  async function connect() {
    if (stopped) return;
    onStatus('waiting');
    abort = new AbortController();
    deadline = setTimeout(() => {
      abort?.abort();
      socket?.close();
    }, 10_000);
    try {
      const response = await fetch('/__cavas/session', {
        method: 'POST',
        headers: { 'X-Cavas-Connection': 'browser' },
        credentials: 'same-origin',
        cache: 'no-store',
        signal: abort.signal,
      });
      if (!response.ok) throw new Error('MCP server unavailable.');
      const session = sessionSchema.parse(await response.json());
      if (stopped) return;
      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const connection = new WebSocket(
        `${protocol}//${location.host}/__cavas`,
        ['cavas', `auth.${session.ticket}`]
      );
      socket = connection;
      detach = attach(connection);
      connection.addEventListener('open', () => {
        clearTimeout(deadline);
        retryMs = 500;
        if (!stopped) onStatus('connected');
      });
      connection.addEventListener('error', () => connection.close());
      connection.addEventListener(
        'close',
        () => {
          clearTimeout(deadline);
          detach?.();
          detach = undefined;
          socket = undefined;
          retry();
        },
        { once: true }
      );
    } catch {
      clearTimeout(deadline);
      retry();
    }
  }
  void connect();
  return () => {
    stopped = true;
    clearTimeout(timer);
    clearTimeout(deadline);
    abort?.abort();
    detach?.();
    socket?.close(1000, 'Agent access paused');
  };
}
