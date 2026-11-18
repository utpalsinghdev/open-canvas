import path from 'node:path';
import { checkoutRoot, runtimeSettings, assertDevelopmentCheckout } from './runtime-settings.mjs';
import { mainRuntimeSettings, selectedRelease } from './runtime.mjs';
try {
  const profile = process.argv[2] ?? 'main';
  if (profile === 'dev') assertDevelopmentCheckout();
  const settings = profile === 'main' ? await mainRuntimeSettings(await selectedRelease()) : runtimeSettings(profile);
  process.stdout.write(JSON.stringify({ mcpServers: { [profile === 'main' ? 'open-cavas' : `open-cavas-dev-${settings.appPort}`]: {
    command: process.execPath, args: [path.join(checkoutRoot, 'scripts/runtime.mjs'), profile, 'mcp'], cwd: checkoutRoot,
    env: { CAVAS_PROFILE: profile, CAVAS_APP_PORT: String(settings.appPort), CAVAS_MCP_PORT: String(settings.brokerPort), CAVAS_APP_ORIGIN: settings.origin },
  } } }, null, 2) + '\n');
} catch (error) { process.stderr.write(`${error instanceof Error ? error.message : 'Config failed.'}\n`); process.exitCode = 1; }
