import { readFile } from 'node:fs/promises';
const path = new URL('../.cavas/pairing.json', import.meta.url);
try {
  const { token, origin } = JSON.parse(await readFile(path, 'utf8'));
  process.stdout.write(`Open ${origin}, choose Connect agent, then paste this private pairing code:\n${token}\nDo not share this code. It grants document read/write access while paired.\n`);
} catch {
  process.stderr.write('No MCP pairing file. Start the MCP server through your agent first.\n');
  process.exitCode = 1;
}
