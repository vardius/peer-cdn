import { expect, test } from 'vitest';
import { DelegatePlugin, type ClientLike, type ClientsLike } from 'peer-cdn';
import type { FetchReply } from '../src/protocol.js';
import { fetchEvent } from './fakes.js';

/** A page that answers each request with replies, after the given delays in ms. */
function page(...replies: { after?: number; reply: FetchReply }[]) {
  const asked: unknown[] = [];
  const client: ClientLike = {
    postMessage: (message, transfer) => {
      asked.push(message);
      const [port] = transfer as MessagePort[];
      for (const { after = 0, reply } of replies) {
        setTimeout(() => {
          port?.postMessage(reply);
        }, after);
      }
    },
  };
  return { client, asked };
}

function clients(byId: Record<string, ClientLike>, windows: ClientLike[] = []): ClientsLike {
  return {
    get: (id) => Promise.resolve(byId[id]),
    matchAll: () => Promise.resolve(windows),
  };
}

/** A request for a picture: what a page asks the visitors for without integrity metadata. */
function picture(url = 'https://example.com/a.png', init: RequestInit & { clientId?: string } = {}) {
  return fetchEvent(url, { destination: 'image', ...init }).event;
}

const ack: FetchReply = { type: 'ack' };
const found = (body: string): Extract<FetchReply, { type: 'response' }> => ({
  type: 'response',
  body: new TextEncoder().encode(body).buffer,
  status: 200,
  statusText: 'OK',
  headers: [['content-type', 'image/png']],
});

test('the page that made the request finds the response', async () => {
  const requester = page({ reply: ack }, { reply: found('from a peer') });
  const other = page({ reply: { type: 'miss' } });
  const plugin = new DelegatePlugin({ clients: clients({ tab: requester.client }, [other.client]) });

  const response = await plugin.getMiddleware(picture('https://example.com/a.png', { clientId: 'tab' })).get();

  expect(await response?.text()).toBe('from a peer');
  expect(response?.headers.get('content-type')).toBe('image/png');
  expect(requester.asked).toEqual([{ type: 'peer-cdn:fetch', url: 'https://example.com/a.png' }]);
  expect(other.asked).toEqual([]);
});

test('a request with no page of its own asks another open page', async () => {
  const open = page({ reply: ack }, { reply: found('page') });
  const plugin = new DelegatePlugin({ clients: clients({}, [open.client]) });

  const response = await plugin.getMiddleware(picture('https://example.com/a.png', { clientId: '' })).get();

  expect(await response?.text()).toBe('page');
});

test('a page that has closed is replaced by another open page', async () => {
  const open = page({ reply: ack }, { reply: found('other tab') });
  const plugin = new DelegatePlugin({ clients: clients({}, [open.client]) });

  const response = await plugin.getMiddleware(picture('https://example.com/a.png', { clientId: 'gone' })).get();

  expect(await response?.text()).toBe('other tab');
});

test('with no open page, it misses', async () => {
  const plugin = new DelegatePlugin({ clients: clients({}) });
  expect(await plugin.getMiddleware(picture()).get()).toBeNull();
});

test('a page whose peers miss makes it miss', async () => {
  const open = page({ reply: ack }, { reply: { type: 'miss' } });
  const plugin = new DelegatePlugin({ clients: clients({}, [open.client]) });
  expect(await plugin.getMiddleware(picture()).get()).toBeNull();
});

test('a page that does not acknowledge within half a second is passed over', async () => {
  const silent = page();
  const plugin = new DelegatePlugin({ clients: clients({}, [silent.client]) });
  const started = performance.now();

  expect(await plugin.getMiddleware(picture()).get()).toBeNull();
  expect(performance.now() - started).toBeLessThan(2000);
});

test('a page that acknowledged has until the timeout to answer', async () => {
  const slow = page({ reply: ack }, { after: 700, reply: found('slow peer') });
  const plugin = new DelegatePlugin({ clients: clients({}, [slow.client]) });

  const response = await plugin.getMiddleware(picture()).get();

  expect(await response?.text()).toBe('slow peer');
});

test('a page that acknowledged but answers after the timeout is passed over', async () => {
  const late = page({ reply: ack }, { after: 300, reply: found('too late') });
  const plugin = new DelegatePlugin({ timeout: 100, clients: clients({}, [late.client]) });

  expect(await plugin.getMiddleware(picture()).get()).toBeNull();
});

// Digests of "hello" and "other" from openssl dgst -sha256 -binary | base64.
const HELLO = 'sha256-LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=';
const OTHER = 'sha256-2SmKENGwc1g33EvYXaxkGw887yekfl1TpU8vP1svz/o=';

test('a response that does not match the request integrity is dropped', async () => {
  const open = page({ reply: ack }, { reply: found('hello') });
  const plugin = new DelegatePlugin({ clients: clients({}, [open.client]) });

  const matching = await plugin
    .getMiddleware(fetchEvent(undefined, { integrity: HELLO, destination: 'script' }).event)
    .get();
  const tampered = await plugin
    .getMiddleware(fetchEvent(undefined, { integrity: OTHER, destination: 'script' }).event)
    .get();

  expect(await matching?.text()).toBe('hello');
  expect(tampered).toBeNull();
});

test('without integrity metadata, only images, fonts, audio, video and text tracks are asked for', async () => {
  const open = page({ reply: ack }, { reply: found('from a peer') });
  const plugin = new DelegatePlugin({ clients: clients({}, [open.client]) });
  const answer = async (destination: RequestDestination) => {
    const response = await plugin.getMiddleware(fetchEvent('https://example.com/file', { destination }).event).get();
    return response ? await response.text() : null;
  };

  const media = await Promise.all((['image', 'font', 'audio', 'video', 'track'] as const).map(answer));
  const code = await Promise.all((['script', 'style', '', 'manifest'] as const).map(answer));

  expect(media).toEqual(Array(5).fill('from a peer'));
  expect(code).toEqual([null, null, null, null]);
  expect(open.asked).toHaveLength(5);
});

test('a response nothing checked is marked so, and one that matched the integrity metadata is not', async () => {
  const open = page({ reply: ack }, { reply: found('hello') });
  const plugin = new DelegatePlugin({ clients: clients({}, [open.client]) });

  const unchecked = await plugin.getMiddleware(picture()).get();
  const checked = await plugin
    .getMiddleware(fetchEvent(undefined, { integrity: HELLO, destination: 'script' }).event)
    .get();

  expect(unchecked?.headers.get('Peer-CDN-Unchecked')).toBe('1');
  expect(checked?.headers.has('Peer-CDN-Unchecked')).toBe(false);
});

test('integrity metadata with no hash browsers check counts as none', async () => {
  const open = page({ reply: ack }, { reply: found('hello') });
  const plugin = new DelegatePlugin({ clients: clients({}, [open.client]) });
  // The SHA-1 digest of "hello": browsers check only SHA-256, SHA-384 and SHA-512.
  const sha1 = 'sha1-qvTGHdzF6KLavt4PO0gs2a6pQ00=';

  const script = await plugin
    .getMiddleware(fetchEvent(undefined, { integrity: sha1, destination: 'script' }).event)
    .get();
  const image = await plugin.getMiddleware(picture(undefined, { integrity: sha1 })).get();

  expect(script).toBeNull();
  expect(image?.headers.get('Peer-CDN-Unchecked')).toBe('1');
  expect(open.asked).toHaveLength(1);
});

test('a response the browser rejects makes it miss', async () => {
  const open = page({ reply: ack }, { reply: { ...found('x'), headers: [['bad name', 'x']] } });
  const plugin = new DelegatePlugin({ clients: clients({}, [open.client]) });
  expect(await plugin.getMiddleware(picture()).get()).toBeNull();
});
