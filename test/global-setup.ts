import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { fileURLToPath } from 'node:url';
import { build } from 'vite';
import type { TestProject } from 'vitest/node';
import { attachSignaling } from '../src/server.js';

declare module 'vitest' {
  export interface ProvidedContext {
    signalingUrl: string;
  }
}

/**
 * Starts peer-cdn's signaling server for the browser tests, on a free port, and bundles the example site's
 * service worker for the service worker test: a classic script, which every browser runs as a service worker.
 */
export default async function setup(project: TestProject): Promise<() => Promise<void>> {
  await build({
    configFile: false,
    logLevel: 'warn',
    publicDir: false,
    resolve: { alias: { 'peer-cdn': fileURLToPath(new URL('../src/index.ts', import.meta.url)) } },
    build: {
      // Next to the test's page: a worker's scope can't reach above its own folder.
      outDir: fileURLToPath(new URL('sw', import.meta.url)),
      emptyOutDir: false,
      minify: false,
      lib: {
        entry: fileURLToPath(new URL('../examples/sw.ts', import.meta.url)),
        formats: ['iife'],
        name: 'worker',
        fileName: () => 'worker.built.js',
      },
    },
  });

  const httpServer = createServer();
  // The tests run on Vitest's own origin.
  const io = attachSignaling(httpServer, { cors: { origin: '*' } });
  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  const { port } = httpServer.address() as AddressInfo;
  project.provide('signalingUrl', `http://127.0.0.1:${String(port)}`);
  return () => io.close();
}
