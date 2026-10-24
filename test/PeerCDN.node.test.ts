import { afterEach, expect, test, vi } from 'vitest';
import { PeerCDN, fastest, ordered, type Strategy, type WorkerScope } from 'peer-cdn';
import { captureReports, fetchEvent, middleware } from './fakes.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

/** A service worker's global scope, with a way to fire its events. */
function workerScope(origin = 'https://example.com') {
  const listeners = new Map<string, (event: unknown) => void>();
  let tookOver = false;
  let claimed = false;
  const scope: WorkerScope = {
    addEventListener: (type: string, listener: (event: never) => void) => {
      listeners.set(type, listener as (event: unknown) => void);
    },
    skipWaiting: () => {
      tookOver = true;
      return Promise.resolve();
    },
    clients: {
      claim: () => {
        claimed = true;
        return Promise.resolve();
      },
    },
    location: { origin },
  };
  return {
    scope,
    fire: (type: string, event: unknown) => {
      listeners.get(type)?.(event);
    },
    get tookOver() {
      return tookOver;
    },
    get claimed() {
      return claimed;
    },
  };
}

/** Network responses, by URL. */
function network(): string[] {
  const fetched: string[] = [];
  vi.stubGlobal('fetch', (request: Request) => {
    fetched.push(request.url);
    return Promise.resolve(new Response(`network: ${request.url}`));
  });
  return fetched;
}

test('a new worker takes over at once, and claims the open pages', async () => {
  const worker = workerScope();
  new PeerCDN().register(worker.scope);
  const waits: Promise<unknown>[] = [];
  const event = { waitUntil: (promise: Promise<unknown>) => waits.push(promise) };

  worker.fire('install', event);
  worker.fire('activate', event);
  await Promise.all(waits);

  expect(worker.tookOver).toBe(true);
  expect(worker.claimed).toBe(true);
  expect(waits).toHaveLength(2);
});

test('a request on a route is answered by its middleware', async () => {
  const worker = workerScope();
  new PeerCDN().GET('/assets', ordered, middleware(() => new Response('cached')).factory).register(worker.scope);
  const fetched = fetchEvent('https://example.com/assets/app.js');

  worker.fire('fetch', fetched.event);

  expect(await (await fetched.response)?.text()).toBe('cached');
});

// peer-cdn 1.0.5 answered such a request with null, which fails it.
test('a request no middleware answers goes to the network', async () => {
  const fetchedUrls = network();
  const worker = workerScope();
  new PeerCDN().GET('/assets', fastest, middleware(() => null).factory).register(worker.scope);
  const fetched = fetchEvent('https://example.com/assets/app.js');

  worker.fire('fetch', fetched.event);

  expect(await (await fetched.response)?.text()).toBe('network: https://example.com/assets/app.js');
  expect(fetchedUrls).toEqual(['https://example.com/assets/app.js']);
});

test('a strategy that fails is reported, and the request goes to the network', async () => {
  network();
  const reported = captureReports();
  const error = new Error('broken strategy');
  const failing: Strategy = () => () => Promise.reject(error);
  const worker = workerScope();
  new PeerCDN().GET('/', failing).register(worker.scope);
  const fetched = fetchEvent('https://example.com/index.html');

  worker.fire('fetch', fetched.event);

  expect(await (await fetched.response)?.text()).toBe('network: https://example.com/index.html');
  expect(reported).toEqual([error]);
});

test('requests off the routes, to other origins, or not GET are left to the browser', () => {
  const worker = workerScope();
  new PeerCDN().GET('/assets', ordered, middleware(() => new Response('cached')).factory).register(worker.scope);
  const offRoute = fetchEvent('https://example.com/api/user');
  const otherOrigin = fetchEvent('https://cdn.example.net/assets/app.js');
  const post = fetchEvent('https://example.com/assets/upload', { method: 'POST', body: 'data' });

  worker.fire('fetch', offRoute.event);
  worker.fire('fetch', otherOrigin.event);
  worker.fire('fetch', post.event);

  expect(offRoute.response).toBeUndefined();
  expect(otherOrigin.response).toBeUndefined();
  expect(post.response).toBeUndefined();
});

test('page loads, frames, embedded objects, workers, worklets and XSLT are left to the browser on any route', () => {
  const worker = workerScope();
  new PeerCDN().GET('/', ordered, middleware(() => new Response('from a visitor')).factory).register(worker.scope);
  // Only the browser makes these, so a Request made here can't have their mode and destination.
  const made = (mode: RequestMode, destination: RequestDestination) => {
    const fetched = fetchEvent('https://example.com/assets/file');
    Object.defineProperties(fetched.event.request, { mode: { value: mode }, destination: { value: destination } });
    worker.fire('fetch', fetched.event);
    return fetched.response;
  };

  expect([
    made('navigate', 'document'),
    made('navigate', 'iframe'),
    made('navigate', 'frame'),
    made('no-cors', 'object'),
    made('no-cors', 'embed'),
    made('same-origin', 'worker'),
    made('same-origin', 'sharedworker'),
    made('cors', 'audioworklet'),
    made('cors', 'paintworklet'),
    made('same-origin', 'xslt'),
  ]).toEqual(Array(10).fill(undefined));
  expect(made('no-cors', 'script')).toBeDefined();
  expect(made('no-cors', 'image')).toBeDefined();
});

test('the most specific route answers', async () => {
  const worker = workerScope();
  new PeerCDN()
    .GET('/', ordered, middleware(() => new Response('site')).factory)
    .GET('/images/:file', ordered, middleware(() => new Response('image')).factory)
    .register(worker.scope);
  const image = fetchEvent('https://example.com/images/logo.png');
  const page = fetchEvent('https://example.com/about');

  worker.fire('fetch', image.event);
  worker.fire('fetch', page.event);

  expect(await (await image.response)?.text()).toBe('image');
  expect(await (await page.response)?.text()).toBe('site');
});
