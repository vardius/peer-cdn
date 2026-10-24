import { resolve } from 'node:path';
import { build, type HttpServer, type Plugin, type ResolvedConfig } from 'vite';

/** Options for {@link peerCDN}. */
export interface PeerCDNPluginOptions {
  /** The service worker's entry, relative to Vite's root, such as `"src/sw.ts"`. */
  worker: string;
  /**
   * Runs peer-cdn's signaling server on Vite's dev and preview servers, so pages signal through `io()` on the
   * origin they came from: true by default. It needs socket.io installed. Turn it off when the pages signal
   * some other way.
   */
  signaling?: boolean;
}

/**
 * Runs the signaling server on Vite's server, loaded only then, as socket.io is needed for it alone. socket.io
 * would close any other WebSocket it doesn't handle, such as a proxy's, that isn't answered within a second:
 * those are left to their own handlers.
 */
async function attachSignaling(httpServer: HttpServer): Promise<void> {
  (await import('./server.js')).attachSignaling(httpServer, { destroyUpgrade: false });
}

/** Where the worker is served and written, below the site's base. */
const FILE_NAME = 'sw.js';

/**
 * A Vite plugin for peer-cdn. It bundles the service worker into one classic script, which every browser can
 * run as a service worker, at `sw.js` below the site's base: served by `vite`, and written by `vite build`. A
 * page registers it with `navigator.serviceWorker.register(import.meta.env.BASE_URL + 'sw.js')`, or with a
 * relative base, by its path from the page's folder, such as `../sw.js`.
 */
export function peerCDN({ worker, signaling = true }: PeerCDNPluginOptions): Plugin {
  let config: ResolvedConfig;

  return {
    name: 'peer-cdn',
    configResolved(resolved) {
      config = resolved;
    },
    async configureServer(server) {
      // Middleware mode has no server of its own.
      if (signaling && server.httpServer) await attachSignaling(server.httpServer);

      // Before Vite's own middleware, which would serve the worker's source as a module.
      const path = `${config.base}${FILE_NAME}`;
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== path) {
          next();
          return;
        }
        bundleWorker(config, worker, true).then((code) => {
          response.setHeader('Content-Type', 'text/javascript');
          response.setHeader('Cache-Control', 'no-cache');
          response.end(code);
        }, next);
      });
    },
    async configurePreviewServer(server) {
      if (signaling) await attachSignaling(server.httpServer);
    },
    async generateBundle() {
      // A server build, as a framework makes for rendering, has no pages to register the worker.
      if (this.environment.config.consumer !== 'client') return;
      this.emitFile({ type: 'asset', fileName: FILE_NAME, source: await bundleWorker(config, worker, false) });
    },
  };
}

/** Bundles the worker on its own, with the site's aliases, defines and base. */
async function bundleWorker(config: ResolvedConfig, entry: string, dev: boolean): Promise<string> {
  const built = await build({
    configFile: false,
    root: config.root,
    base: config.base,
    mode: config.mode,
    logLevel: config.logLevel === 'silent' ? 'silent' : 'warn',
    publicDir: false,
    resolve: { alias: config.resolve.alias },
    define: config.define ?? {},
    build: {
      write: false,
      ...(dev && { minify: false, sourcemap: 'inline' as const }),
      lib: { entry: resolve(config.root, entry), formats: ['iife'], name: 'peerCDNWorker', fileName: () => FILE_NAME },
    },
  });
  const chunk = (Array.isArray(built) ? built : [built])
    .flatMap((output) => ('output' in output ? output.output : []))
    .find((file) => file.type === 'chunk');
  if (!chunk) throw new Error(`peer-cdn: bundling ${entry} gave no script`);
  return chunk.code;
}
