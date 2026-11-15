import { createBroker } from './broker';

/** Recover only before dispatch. A failed design request is never replayed. */
export async function createBrokerSession() {
  let broker = await createBroker();
  let checking: Promise<typeof broker> | undefined;
  let closing = false;
  async function ready() {
    if (closing) throw new Error('Broker session is shutting down.');
    if (!checking) {
      checking = (async () => {
        try { await broker.verify(); }
        catch {
          // createBroker refuses live-owner metadata and unverified listeners.
          // Only its exclusive listener/publication path can acquire ownership.
          try { broker = await createBroker(); }
          catch {
            throw new Error('Broker unavailable before dispatch. No design command was sent. Keep browser backups; coordinate recovery of the owner using the same runtime profile, then read current state. Live owners and unverified metadata were not replaced.');
          }
        }
        return broker;
      })();
    }
    const currentCheck = checking;
    try { return await currentCheck; }
    finally { if (checking === currentCheck) checking = undefined; }
  }
  return {
    metadataPath: broker.metadataPath,
    check: async () => { await ready(); },
    list: async () => (await ready()).list(),
    call: async (canvasId: string, method: string, args: unknown, signal: AbortSignal) => {
      const current = await ready();
      if (signal.aborted) throw new Error('Request cancelled before dispatch.');
      return current.call(canvasId, method, args, signal);
    },
    workspace: async (value: unknown, signal?: AbortSignal) => {
      const current = await ready();
      if (signal?.aborted) throw new Error('Request cancelled before dispatch.');
      return current.workspace(value, signal);
    },
    close: async () => {
      closing = true;
      await checking?.catch(() => {});
      await broker.close();
    },
  };
}
