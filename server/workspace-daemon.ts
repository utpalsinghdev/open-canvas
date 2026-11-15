import { createBrokerSession } from './broker-session';

const broker = await createBrokerSession();
process.send?.({ type: 'ready' });
let closing = false;
// Keep browser-only access recoverable after an attached MCP owner exits.
const health = setInterval(() => { void broker.check().catch(() => {}); }, 2000);
async function close() {
  if (closing) return;
  closing = true;
  clearInterval(health);
  await broker.close();
  process.disconnect?.();
}
process.once('SIGINT', () => { void close(); });
process.once('SIGTERM', () => { void close(); });
process.once('disconnect', () => { void close(); });
