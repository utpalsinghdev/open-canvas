import { launch } from './runtime.mjs';
import { runtimeSettings } from './runtime-settings.mjs';
import { changelog, update } from './installed-releases.mjs';
import app from '../apps/web/package.json' with { type: 'json' };

const usage = `Usage: open-canvas [--no-open]
       open-canvas mcp-config
       open-canvas mcp
       open-canvas --version
       open-canvas update [--check]
       open-canvas changelog [--latest]

Starts the local editor and opens your browser. Ctrl+C stops the editor server.
Use mcp-config to print the configuration for a local MCP client.`;

try {
  const [action, flag, ...extra] = process.argv.slice(2);
  if (extra.length || (flag !== undefined && !(action === 'update' && flag === '--check' || action === 'changelog' && flag === '--latest'))) {
    throw new Error(usage);
  }
  if (action === '--help' || action === '-h') console.log(usage);
  else if (action === '--version') console.log(app.version);
  else if (action === 'update') await update(app.version, flag === '--check');
  else if (action === 'changelog') await changelog(flag === '--latest');
  else if (action === 'mcp-config') {
    const { appPort, brokerPort } = runtimeSettings('installed');
    console.log(JSON.stringify({ mcpServers: { 'open-canvas': {
      command: process.env.OPEN_CAVAS_COMMAND,
      args: ['mcp'],
      env: { CAVAS_APP_PORT: String(appPort), CAVAS_MCP_PORT: String(brokerPort) },
    } } }, null, 2));
  } else if (action === 'mcp') {
    await launch('installed', 'mcp');
  } else if (action === undefined || action === '--no-open') {
    await launch('installed', 'web', { openBrowser: action === undefined });
  } else {
    throw new Error(usage);
  }
} catch (error) {
  process.stderr.write(`${error instanceof Error ? error.message : 'Open Canvas failed.'}\n`);
  process.exitCode = 1;
}
