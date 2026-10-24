import { afterEach, expect, test } from 'vitest';
import { CachePlugin } from 'peer-cdn';
import { fetchEvent } from './fakes.js';

afterEach(async () => {
  for (const name of await caches.keys()) await caches.delete(name);
});

const url = `${location.origin}/assets/app.css`;

async function seed(cacheName: string, response: Response): Promise<void> {
  await (await caches.open(cacheName)).put(url, response);
}

test('it answers from its cache', async () => {
  await seed('peer-cdn', new Response('body { color: red }', { headers: { 'Content-Type': 'text/css' } }));
  const response = await new CachePlugin().getMiddleware(fetchEvent(url).event).get();

  expect(response?.status).toBe(200);
  expect(response?.headers.get('Content-Type')).toBe('text/css');
  expect(await response?.text()).toBe('body { color: red }');
});

test('it misses what its cache does not have, even when another cache has it', async () => {
  await seed('another-cache', new Response('elsewhere'));
  expect(await new CachePlugin().getMiddleware(fetchEvent(url).event).get()).toBeNull();
});

test('it keeps what it is given, in the cache it is named after', async () => {
  const plugin = new CachePlugin({ cacheName: 'site-v2' });
  await plugin.getMiddleware(fetchEvent(url).event).put?.(new Response('kept'));

  expect(await caches.keys()).toEqual(['site-v2']);
  expect(await (await plugin.getMiddleware(fetchEvent(url).event).get())?.text()).toBe('kept');
});

// peer-cdn 1.0.5 named its caches "peerfetch-cache-vundefined" when its options had no version.
test('with no options, its cache is "peer-cdn"', async () => {
  await new CachePlugin().getMiddleware(fetchEvent(url).event).put?.(new Response('kept'));
  expect(await caches.keys()).toEqual(['peer-cdn']);
});

test('it does not keep errors, partial responses, or responses marked no-store', async () => {
  const plugin = new CachePlugin();
  const put = (response: Response) => plugin.getMiddleware(fetchEvent(url).event).put?.(response);

  await put(new Response('missing', { status: 404 }));
  await put(new Response('part', { status: 206, headers: { 'Content-Range': 'bytes 0-3/10' } }));
  await put(new Response('secret', { headers: { 'Cache-Control': 'private, no-store' } }));

  expect(await plugin.getMiddleware(fetchEvent(url).event).get()).toBeNull();
});

test("a cached body that fails the request's integrity is deleted and passed on, and one that matches is answered", async () => {
  await seed('peer-cdn', new Response('body { color: blue }'));
  const red = 'sha256-kl6HQb5peP+QG0x7FWklMRxR/HYq4xozK9Oa6BWSDQA=';
  const blue = 'sha256-s8wPawHpldex3ubIDJaTu6HV4z5d5xg/kE3WN5gLgII=';
  const plugin = new CachePlugin();

  expect(await (await plugin.getMiddleware(fetchEvent(url, { integrity: blue }).event).get())?.text()).toBe(
    'body { color: blue }',
  );
  expect(await plugin.getMiddleware(fetchEvent(url, { integrity: red }).event).get()).toBeNull();
  expect(await (await caches.open('peer-cdn')).match(url)).toBeUndefined();
});

test("a peer's response nothing checked answers requests for images, fonts and media, or with matching integrity", async () => {
  await seed('peer-cdn', new Response('<svg/>', { headers: { 'Peer-CDN-Unchecked': '1' } }));
  const plugin = new CachePlugin();
  const answer = async (init: Parameters<typeof fetchEvent>[1]) => {
    const response = await plugin.getMiddleware(fetchEvent(url, init).event).get();
    return response ? await response.text() : null;
  };
  // The digest of "<svg/>" from openssl dgst -sha256 -binary | base64, and a SHA-1 digest browsers don't check.
  const svg = 'sha256-1NxWZpFDA08xqjCWNdQRPZrXagKxc52iLJZe0gSb6eY=';
  const sha1 = 'sha1-qvTGHdzF6KLavt4PO0gs2a6pQ00=';

  const media = await Promise.all(
    (['image', 'font', 'audio', 'video', 'track'] as const).map((destination) => answer({ destination })),
  );
  const code = await Promise.all((['script', 'style', ''] as const).map((destination) => answer({ destination })));

  expect(media).toEqual(Array(5).fill('<svg/>'));
  expect(code).toEqual([null, null, null]);
  expect(await answer({ destination: 'script', integrity: sha1 })).toBeNull();
  expect(await answer({ destination: 'script', integrity: svg })).toBe('<svg/>');
});

test('a Range request gets its part of the cached response', async () => {
  await seed('peer-cdn', new Response('0123456789', { headers: { 'Content-Type': 'text/plain' } }));
  const middleware = new CachePlugin().getMiddleware(fetchEvent(url, { headers: { Range: 'bytes=2-4' } }).event);

  const response = await middleware.get();

  expect(response?.status).toBe(206);
  expect(response?.headers.get('Content-Range')).toBe('bytes 2-4/10');
  expect(await response?.text()).toBe('234');
});

test('a Range request it cannot satisfy gets 416, and one it should ignore gets the whole response', async () => {
  await seed('peer-cdn', new Response('0123456789'));
  const plugin = new CachePlugin();
  const get = (range: string) => plugin.getMiddleware(fetchEvent(url, { headers: { Range: range } }).event).get();

  expect((await get('bytes=10-'))?.status).toBe(416);
  const whole = await get('bytes=0-1,4-5');
  expect(whole?.status).toBe(200);
  expect(await whole?.text()).toBe('0123456789');
});
