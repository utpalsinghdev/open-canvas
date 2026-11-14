import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

const agentProxy = { '/__cavas': { target: `http://127.0.0.1:${process.env.CAVAS_MCP_PORT ?? '4781'}`, ws: true } };

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: ['localmachine'],
    proxy: agentProxy,
    fs: { deny: ['.env', '.env.*', '*.{crt,pem}', '**/.git/**', '**/.cavas/**'] },
  },
  preview: { allowedHosts: ['localmachine'], proxy: agentProxy },
});
