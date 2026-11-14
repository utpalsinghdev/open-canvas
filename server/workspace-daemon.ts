import { createBroker } from './broker';

const broker = await createBroker();
process.send?.({ type: 'ready' });
let closing = false;
async function close() {
  if (closing) return;
  closing = true;
  await broker.close();
  process.disconnect?.();
}
process.once('SIGINT', () => { void close(); });
process.once('SIGTERM', () => { void close(); });
process.once('disconnect', () => { void close(); });
