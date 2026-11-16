import { randomBytes } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';

const TICKET_LIFETIME_MS = 20_000;
const MAX_TICKETS = 32;

/** Browser registration is automatic; this never exposes the internal broker secret. */
export function browserAuthentication(origin: string) {
  const host = new URL(origin).host;
  const tickets = new Map<string, number>();
  function trusted(request: IncomingMessage) {
    const site = request.headers['sec-fetch-site'];
    return (
      request.headers.origin === origin &&
      request.headers.host === host &&
      (site === undefined || site === 'same-origin')
    );
  }
  return {
    bootstrap(request: IncomingMessage, response: ServerResponse) {
      response.setHeader('Cache-Control', 'no-store');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      if (
        !trusted(request) ||
        request.method !== 'POST' ||
        request.headers['x-cavas-connection'] !== 'browser' ||
        request.headers['transfer-encoding'] ||
        (request.headers['content-length'] &&
          request.headers['content-length'] !== '0')
      ) {
        response.writeHead(403);
        response.end();
        return;
      }
      const now = Date.now();
      for (const [ticket, expires] of tickets)
        if (expires <= now) tickets.delete(ticket);
      if (tickets.size >= MAX_TICKETS) {
        response.writeHead(429);
        response.end();
        return;
      }
      const ticket = randomBytes(32).toString('hex');
      tickets.set(ticket, now + TICKET_LIFETIME_MS);
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ ticket }));
    },
    accept(request: IncomingMessage, protocols: string[]) {
      if (!trusted(request)) return false;
      const ticket =
        protocols.find((value) => value.startsWith('auth.'))?.slice(5) ?? '';
      const expires = tickets.get(ticket);
      tickets.delete(ticket);
      return expires !== undefined && expires > Date.now();
    },
  };
}
