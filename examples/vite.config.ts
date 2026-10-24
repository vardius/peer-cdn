import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import { peerCDN } from '../src/vite.js';

// npm run examples: the example site on one dev server, with its service worker and signaling server.
export default defineConfig({
  root: fileURLToPath(new URL('.', import.meta.url)),
  resolve: { alias: { 'peer-cdn': fileURLToPath(new URL('../src/index.ts', import.meta.url)) } },
  plugins: [
    peerCDN({ worker: 'sw.ts' }),
    {
      // Counts the pictures the server sends, so the page can show that a second browser didn't need them.
      name: 'served-counter',
      configureServer(server) {
        let served = 0;
        server.middlewares.use('/assets/', (_request, _response, next) => {
          served++;
          next();
        });
        server.middlewares.use('/served', (_request, response) => {
          response.setHeader('Content-Type', 'application/json');
          response.setHeader('Cache-Control', 'no-store');
          response.end(JSON.stringify({ served }));
        });
      },
    },
  ],
});
