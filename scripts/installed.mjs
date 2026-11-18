import { launch } from './runtime.mjs';
import { runtimeSettings } from './runtime-settings.mjs';
import app from '../apps/web/package.json' with { type: 'json' };

const usage = `Usage: open-cavas [--no-open]
       open-cavas mcp-config
       open-cavas mcp
       open-cavas --version

Starts the local editor and opens your browser. Ctrl+C stops the editor server.
Use mcp-config to print the configuration for a local MCP client.`;

try {
  const args = process.argv.slice(2);
  const action = args.length ? args.join(' ') : 'start';
  if (action === '--help' || action === '-h') console.log(usage);
  else if (action === '--version') console.log(app.version);
  else if (action === 'mcp-config') {
    const { appPort, brokerPort } = runtimeSettings('installed');
    console.log(JSON.stringify({ mcpServers: { 'open-cavas': {
      command: process.env.OPEN_CAVAS_COMMAND,
      args: ['mcp'],
      env: { CAVAS_APP_PORT: String(appPort), CAVAS_MCP_PORT: String(brokerPort) },
    } } }, null, 2));
  } else if (action === 'mcp') {
    await launch('installed', 'mcp');
  } else if (args.length === 0 || action === '--no-open') {
    await launch('installed', 'web', { openBrowser: args.length === 0 });
  } else {
    throw new Error(usage);
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'Open Cavas failed.'}\n`);
  process.exitCode = 1;
}
