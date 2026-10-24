import { cp, mkdtemp, readFile, rm } from 'node:fs/promises';
import { request, type Server as NodeServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script, createContext } from 'node:vm';
import { afterAll, afterEach, beforeAll, expect, test, vi } from 'vitest';
import { io as connect, type Socket } from 'socket.io-client';
import { build, createServer, preview, type HttpServer, type InlineConfig, type Plugin } from 'vite';
import { peerCDN, type PeerCDNPluginOptions } from '../src/vite.js';

const cleanups: (() => Promise<void>)[] = [];

afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

/** The test site, copied out of this package, where only the alias below finds peer-cdn. */
let root = '';

beforeAll(async () => {
  root = await mkdtemp(join(tmpdir(), 'peer-cdn-vite-site-'));
  await cp(fileURLToPath(new URL('vite-site', import.meta.url)), root, { recursive: true });
});

afterAll(() => rm(root, { recursive: true }));

/** The test site's config, with the plugin. */
function site(options: Partial<PeerCDNPluginOptions> = {}, config: InlineConfig = {}): InlineConfig {
  return {
    configFile: false,
    logLevel: 'silent',
    root,
    // The worker is bundled with the site's aliases.
    resolve: { alias: { 'peer-cdn': fileURLToPath(new URL('../src/index.ts', import.meta.url)) } },
    plugins: [peerCDN({ worker: 'sw.ts', ...options })],
    ...config,
  };
}

async function tempDir(): Promise<string> {
  const dir = await mkdtemp(join(tmpdir(), 'peer-cdn-vite-'));
  cleanups.push(() => rm(dir, { recursive: true }));
  return dir;
}

const urlOf = (address: AddressInfo | string | null | undefined) =>
  `http://127.0.0.1:${String((address as AddressInfo).port)}`;

/**
 * Runs a script as a browser runs a service worker's classic script, served from at, and returns the routes it
 * handles. A module script, with import or export, doesn't compile.
 */
function runAsWorker(code: string, at: string): { listens: string[]; handles(url: string): boolean } {
  const listeners = new Map<string, (event: unknown) => void>();
  const scope = {
    addEventListener: (type: string, listener: (event: unknown) => void) => listeners.set(type, listener),
    skipWaiting: () => Promise.resolve(),
    clients: { claim: () => Promise.resolve() },
    location: new URL(at),
    Request,
    Response,
    URL,
  };
  new Script(code).runInContext(createContext(scope));
  return {
    listens: [...listeners.keys()],
    handles: (url) => {
      let answered = false;
      listeners.get('fetch')?.({
        request: new Request(url),
        clientId: '',
        respondWith: (response: Promise<unknown>) => {
          answered = true;
          // Nothing in this scope can answer: no caches, no network.
          response.catch(() => undefined);
        },
        waitUntil: () => undefined,
      });
      return answered;
    },
  };
}

test('vite build writes the worker below the base, as one classic script with the routes', async () => {
  const outDir = await tempDir();
  await build(site({}, { base: '/site/', build: { outDir } }));

  const code = await readFile(join(outDir, 'sw.js'), 'utf8');
  const worker = runAsWorker(code, 'https://example.com/site/sw.js');

  expect(worker.listens.sort()).toEqual(['activate', 'fetch', 'install']);
  // PeerPlugin, and the peer-data signaling peer-cdn passes on, stay in the pages.
  expect(code).not.toMatch(/RTCPeerConnection|BroadcastChannel|socket/);
  expect(worker.handles('https://example.com/site/assets/logo.svg')).toBe(true);
  expect(worker.handles('https://example.com/site/index.html')).toBe(false);
});

test('with a relative base, the built worker routes below the folder it is served from', async () => {
  const outDir = await tempDir();
  await build(site({}, { base: './', build: { outDir } }));

  const worker = runAsWorker(await readFile(join(outDir, 'sw.js'), 'utf8'), 'https://example.com/app/sw.js');

  expect(worker.handles('https://example.com/app/assets/logo.svg')).toBe(true);
  expect(worker.handles('https://example.com/assets/logo.svg')).toBe(false);
});

test('a server build has no worker', async () => {
  const outDir = await tempDir();
  const built = await build(site({}, { build: { outDir, write: false, ssr: 'server-entry.ts' } }));

  const files = (Array.isArray(built) ? built : [built]).flatMap((output) =>
    'output' in output ? output.output.map((file) => file.fileName) : [],
  );
  expect(files).toEqual(['server-entry.mjs']);
});

test('vite serves the worker below the base, as one classic script with the routes', async () => {
  const server = await createServer(site({}, { base: '/site/', server: { host: '127.0.0.1', port: 0 } }));
  cleanups.push(() => server.close());
  await server.listen();

  const response = await fetch(`${urlOf(server.httpServer?.address())}/site/sw.js`);

  expect(response.status).toBe(200);
  expect(response.headers.get('content-type')).toBe('text/javascript');
  const worker = runAsWorker(await response.text(), 'https://example.com/site/sw.js');
  expect(worker.handles('https://example.com/site/assets/logo.svg')).toBe(true);
});

test('a worker that fails to bundle fails its request', async () => {
  const server = await createServer(site({ worker: 'missing.ts' }, { server: { host: '127.0.0.1', port: 0 } }));
  cleanups.push(() => server.close());
  await server.listen();

  const response = await fetch(`${urlOf(server.httpServer?.address())}/sw.js`);

  expect(response.status).toBe(500);
});

async function socketTo(url: string): Promise<Socket> {
  const socket = connect(url, { transports: ['websocket'] });
  cleanups.push(() => Promise.resolve(void socket.close()));
  await new Promise<void>((resolve) => socket.on('connect', resolve));
  return socket;
}

const connectEvent = (id: string) => ({
  type: 'CONNECT',
  room: { id: 'vite' },
  caller: { id },
  callee: null,
  payload: null,
});

/** Joins a room from two sockets, and resolves with what the first heard of the second. */
async function meet(url: string): Promise<unknown> {
  const first = await socketTo(url);
  const second = await socketTo(url);
  const heard: unknown[] = [];
  first.on('message', (event: unknown) => heard.push(event));
  first.emit('message', connectEvent('first'));

  // Each try joins with a new id, until one arrives after the first socket's own CONNECT was routed.
  let tries = 0;
  await vi.waitFor(() => {
    second.emit('message', connectEvent(`second-${String(tries++)}`));
    expect(heard).not.toEqual([]);
  });
  return heard[0];
}

test('pages signal through the dev server', async () => {
  const server = await createServer(site({}, { server: { host: '127.0.0.1', port: 0 } }));
  cleanups.push(() => server.close());
  await server.listen();

  expect(await meet(urlOf(server.httpServer?.address()))).toMatchObject({ type: 'CONNECT', room: { id: 'vite' } });
});

test('pages signal through the preview server, which serves the built worker', async () => {
  const outDir = await tempDir();
  await build(site({}, { build: { outDir } }));
  const server = await preview(site({}, { build: { outDir }, preview: { host: '127.0.0.1', port: 0 } }));
  cleanups.push(() => server.close());
  const url = urlOf(server.httpServer.address());

  expect(await meet(url)).toMatchObject({ type: 'CONNECT', room: { id: 'vite' } });
  expect((await fetch(`${url}/sw.js`)).status).toBe(200);
});

test('with signaling off, the dev server has no signaling', async () => {
  const server = await createServer(site({ signaling: false }, { server: { host: '127.0.0.1', port: 0 } }));
  cleanups.push(() => server.close());
  await server.listen();

  // The start of socket.io's handshake, which a signaling server answers with a session id.
  const handshake = await fetch(`${urlOf(server.httpServer?.address())}/socket.io/?EIO=4&transport=polling`);

  expect(await handshake.text()).not.toMatch(/^0\{"sid"/);
});

/** Another WebSocket on the same server, as a proxy to a slow backend has: it answers after more than a second. */
const slowSocket: Plugin = {
  name: 'slow-socket',
  configureServer(server) {
    if (server.httpServer) answerLate(server.httpServer);
  },
  configurePreviewServer(server) {
    answerLate(server.httpServer);
  },
};

function answerLate(httpServer: HttpServer): void {
  (httpServer as NodeServer).on('upgrade', (incoming, socket) => {
    if (incoming.url !== '/slow') return;
    setTimeout(() => {
      socket.end('HTTP/1.1 101 Switching Protocols\r\nConnection: Upgrade\r\nUpgrade: websocket\r\n\r\n');
    }, 1200);
  });
}

/** Whether a WebSocket upgrade to /slow gets its answer. */
function upgrades(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const asking = request(`${url}/slow`, { headers: { Connection: 'Upgrade', Upgrade: 'websocket' } });
    asking.on('upgrade', (_response, socket) => {
      socket.destroy();
      resolve(true);
    });
    asking.on('error', () => {
      resolve(false);
    });
    asking.end();
  });
}

test("signaling leaves the dev and preview servers' other WebSockets open, however slow", async () => {
  const outDir = await tempDir();
  const withSlowSocket = (config: InlineConfig): InlineConfig => {
    const plugins = site({}, config).plugins ?? [];
    return { ...site({}, config), plugins: [...plugins, slowSocket] };
  };
  await build(site({}, { build: { outDir } }));
  const dev = await createServer(withSlowSocket({ server: { host: '127.0.0.1', port: 0 } }));
  cleanups.push(() => dev.close());
  await dev.listen();
  const previewed = await preview(withSlowSocket({ build: { outDir }, preview: { host: '127.0.0.1', port: 0 } }));
  cleanups.push(() => previewed.close());

  expect(
    await Promise.all([upgrades(urlOf(dev.httpServer?.address())), upgrades(urlOf(previewed.httpServer.address()))]),
  ).toEqual([true, true]);
});
