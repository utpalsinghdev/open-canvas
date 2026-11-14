import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
process.stdout.write(JSON.stringify({
  mcpServers: {
    'open-cavas': {
      command: process.execPath,
      args: [
        fileURLToPath(new URL('../node_modules/tsx/dist/cli.mjs', import.meta.url)),
        fileURLToPath(new URL('../server/index.ts', import.meta.url)),
      ],
      cwd: root,
    },
  },
}, null, 2) + '\n');
