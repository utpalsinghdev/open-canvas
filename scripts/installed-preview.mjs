import { fileURLToPath } from 'node:url';
import { runtimeSettings } from './runtime-settings.mjs';

const settings = runtimeSettings('installed');
const host = `127.0.0.1:${settings.appPort}`;
const browserRoutes = '^/__cavas(?:/session|/workspace)?$';
const browserRoute = new RegExp(browserRoutes);

export default {
  root: fileURLToPath(new URL('../apps/web/', import.meta.url)),
  publicDir: false,
  plugins: [{
    name: 'cavas-installed-host',
    configurePreviewServer({ middlewares }) {
      middlewares.use((request, response, next) => {
        if (request.headers.host !== host) return response.writeHead(403).end();
        if (request.url?.startsWith('/__cavas') && !browserRoute.test(request.url)) {
          return response.writeHead(404).end();
        }
        next();
      });
    },
  }],
  preview: {
    proxy: {
      [browserRoutes]: {
        target: `http://127.0.0.1:${settings.brokerPort}`,
        ws: true,
      },
    },
  },
};
