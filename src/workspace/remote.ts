import { z } from 'zod';
import type { ServiceRequest } from './service-schema';

const ticketSchema = z.object({ ticket: z.string().regex(/^[a-f0-9]{64}$/) });
const responseSchema = z.union([
  z.object({ result: z.unknown() }), z.object({ error: z.string() }),
]);

/** Each request consumes a fresh exact-origin ticket. Never replay an uncertain write. */
export async function workspaceRequest(request: ServiceRequest): Promise<unknown> {
  try {
    const registration = await fetch('/__cavas/session', {
      method: 'POST', headers: { 'X-Cavas-Connection': 'browser' },
      credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(10_000),
    });
    if (!registration.ok) throw new Error('Local workspace service unavailable.');
    const { ticket } = ticketSchema.parse(await registration.json());
    const response = await fetch('/__cavas/workspace', {
      method: 'POST', credentials: 'same-origin', cache: 'no-store',
      headers: { 'Content-Type': 'application/json', 'X-Cavas-Connection': 'browser', 'X-Cavas-Ticket': ticket },
      body: JSON.stringify(request), signal: AbortSignal.timeout(30_000),
    });
    const body = responseSchema.parse(await response.json());
    if ('error' in body) throw new Error(body.error);
    if (!response.ok) throw new Error('Local workspace request failed.');
    return body.result;
  } catch (error) {
    throw new Error(`${error instanceof Error ? error.message : 'Workspace request failed.'} No write was retried. If its outcome is uncertain, reload and inspect saved state after downloading your browser backup.`);
  }
}
