import { readFile } from 'node:fs/promises';
import { runtimeSettings } from './runtime-settings.mjs';
try {
  const settings = runtimeSettings(process.argv[2] ?? 'main');
  const { token, origin, port } = JSON.parse(await readFile(settings.pairingPath, 'utf8'));
  if (origin !== settings.origin || port !== settings.brokerPort || !/^[a-f0-9]{64}$/.test(token)) throw new Error('Pairing metadata does not match selected runtime.');
  process.stdout.write(`Open ${origin} (${settings.profile}), choose Connect agent, then paste this private pairing code:\n${token}\nDo not share this code. It grants document read/write access while paired.\n`);
} catch (error) {
  process.stderr.write(`No usable pairing metadata for this runtime. Start its MCP client first. ${error instanceof Error ? error.message : ''}\n`);
  process.exitCode = 1;
}
