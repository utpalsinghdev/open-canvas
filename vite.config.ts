import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { runtimeSettings } from './scripts/runtime-settings.mjs';

const settings = runtimeSettings();
const agentProxy = { '/__cavas': { target: `http://127.0.0.1:${settings.brokerPort}`, ws: true } };

export default defineConfig({
  plugins: [react(), tailwindcss(), {
    name: 'cavas-runtime-info',
    transformIndexHtml: () => [
      { tag: 'meta', attrs: { name: 'cavas-profile', content: settings.profile }, injectTo: 'head' },
      { tag: 'meta', attrs: { name: 'cavas-release', content: process.env.CAVAS_RELEASE_COMMIT ?? 'development' }, injectTo: 'head' },
    ],
  }],
  server: {
    port: settings.appPort, strictPort: true,
    allowedHosts: ['localmachine'],
    proxy: agentProxy,
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.cavas/**'] },
  },
  preview: { port: settings.appPort, strictPort: true, allowedHosts: ['localmachine'], proxy: agentProxy },
});
