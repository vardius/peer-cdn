import { afterEach, expect, inject, test, vi } from 'vitest';
import { io } from 'socket.io-client';
import { PeerData, SocketChannel, type Participant, type Signaling } from 'peer-data';
import { DelegatePlugin, PeerPlugin, type ClientLike, type PeerPluginOptions } from 'peer-cdn';
import { Hub } from './hub.js';
import { fetchEvent } from './fakes.js';

const cleanup: (() => unknown)[] = [];

afterEach(async () => {
  for (const close of cleanup.splice(0)) close();
  for (const name of await caches.keys()) await caches.delete(name);
});

const url = (path: string): string => `${location.origin}/assets/${path}`;

/** Sends a peer-cdn message, or bytes, back to the peer a message came from. */
type Reply = (data: object | Uint8Array<ArrayBuffer>) => void;

let unique = 0;

/** Peers that meet in a room of their own, signaling through a Hub unless told otherwise. */
function network(signal?: () => Signaling) {
  const hub = new Hub();
  const connect = signal ?? (() => hub.connect());
  const room = `room-${String(unique++)}`;
  return {
    /** A page running PeerPlugin, sharing a cache of its own. */
    plugin(options: Partial<PeerPluginOptions> = {}) {
      const cacheName = options.cacheName ?? `cache-${String(unique++)}`;
      const created = new PeerPlugin({ signaling: connect(), room, timeout: 60_000, ...options, cacheName });
      cleanup.push(() => {
        created.close();
      });
      return {
        plugin: created,
        /** Puts response in this page's cache, for path. */
        seed: async (path: string, response: Response) => {
          await (await caches.open(cacheName)).put(url(path), response);
        },
      };
    },
    /**
     * A peer that answers peer-cdn's messages as answer says, to play a slow, broken or lying peer, and sends
     * what opened says once connected.
     */
    peer(answer: (message: Record<string, unknown>, reply: Reply) => void, opened?: (reply: Reply) => void): PeerData {
      const peer = new PeerData(connect());
      cleanup.push(() => {
        peer.close();
      });
      peer.connect(room).on('participant', (participant: Participant) => {
        participant.on('connected', () => {
          opened?.((sent) => {
            participant.send(sent instanceof Uint8Array ? sent : JSON.stringify(sent));
          });
        });
        participant.on('message', (data) => {
          if (typeof data !== 'string') return;
          answer(JSON.parse(data) as Record<string, unknown>, (sent) => {
            participant.send(sent instanceof Uint8Array ? sent : JSON.stringify(sent));
          });
        });
      });
      return peer;
    },
  };
}

type Network = ReturnType<typeof network>;

async function connected(plugin: PeerPlugin, peers: number): Promise<void> {
  await vi.waitFor(
    () => {
      expect(plugin.peers).toBe(peers);
    },
    { timeout: 10_000 },
  );
}

const css = (text: string, headers: Record<string, string> = {}) =>
  new Response(text, { headers: { 'Content-Type': 'text/css', ...headers } });

const header = (id: unknown, size: number, status = 200) => ({
  type: 'response',
  id,
  size,
  status,
  statusText: '',
  headers: [],
});

function randomBytes(size: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(size);
  // getRandomValues fills at most 64 KiB at a time.
  for (let offset = 0; offset < size; offset += 65_536) {
    crypto.getRandomValues(bytes.subarray(offset, Math.min(offset + 65_536, size)));
  }
  return bytes;
}

/** A peer that has every URL and sends body for it, but says so only once ready resolves. */
function honestPeer(peers: Network, body: string, ready: Promise<unknown> = Promise.resolve()): void {
  const bytes = new TextEncoder().encode(body);
  peers.peer((message, reply) => {
    if (message.type === 'has')
      void ready.then(() => {
        reply({ type: 'have', id: message.id });
      });
    if (message.type !== 'get') return;
    reply(header(message.id, bytes.byteLength));
    reply(bytes);
  });
}

/** A peer that has every URL and answers each get with send, and a promise of its first get. */
function brokenPeer(peers: Network, send: (id: unknown, reply: Reply) => void) {
  let asked: () => void = () => undefined;
  const wasAsked = new Promise<void>((resolve) => (asked = resolve));
  const peer = peers.peer((message, reply) => {
    if (message.type === 'has') reply({ type: 'have', id: message.id });
    if (message.type !== 'get') return;
    send(message.id, reply);
    asked();
  });
  return { peer, wasAsked };
}

test("a peer's cached response reaches the page that asks for it", async () => {
  const peers = network();
  const holder = peers.plugin();
  const asker = peers.plugin();
  await holder.seed('app.css', css('body { color: red }', { ETag: '"v1"' }));
  await connected(asker.plugin, 1);

  const response = await asker.plugin.fetch(url('app.css'));

  expect(response?.status).toBe(200);
  expect(response?.headers.get('Content-Type')).toBe('text/css');
  expect(response?.headers.get('ETag')).toBe('"v1"');
  expect(await response?.text()).toBe('body { color: red }');
});

test('a body many chunks long arrives whole, and an empty one arrives too', async () => {
  const peers = network();
  const holder = peers.plugin();
  const asker = peers.plugin();
  const bytes = randomBytes(300_000);
  await holder.seed('photo.jpg', new Response(bytes, { headers: { 'Content-Type': 'image/jpeg' } }));
  await holder.seed('empty.txt', new Response(''));
  await connected(asker.plugin, 1);

  const [photo, empty] = await Promise.all([
    asker.plugin.fetch(url('photo.jpg')),
    asker.plugin.fetch(url('empty.txt')),
  ]);

  expect(new Uint8Array((await photo?.arrayBuffer()) ?? new ArrayBuffer(0))).toEqual(bytes);
  expect(empty?.status).toBe(200);
  expect(await empty?.text()).toBe('');
});

test('a relative URL is resolved against the page', async () => {
  const peers = network();
  const holder = peers.plugin();
  const asker = peers.plugin();
  await holder.seed('app.css', css('relative'));
  await connected(asker.plugin, 1);

  expect(await (await asker.plugin.fetch('/assets/app.css'))?.text()).toBe('relative');
});

test('when no peer has it, it resolves with null as soon as they all said so', async () => {
  const peers = network();
  const asker = peers.plugin();
  peers.plugin();
  peers.plugin();
  await connected(asker.plugin, 2);

  // The timeout is a minute: only the peers' answers can settle it within the test's time.
  expect(await asker.plugin.fetch(url('missing.css'))).toBeNull();
});

test('with no peers, it resolves with null at once', async () => {
  const { plugin } = network().plugin();
  expect(await plugin.fetch(url('app.css'))).toBeNull();
});

test('responses marked private or no-store, errors and other origins are not shared', async () => {
  const peers = network();
  const holder = peers.plugin({ cacheName: 'holder' });
  const asker = peers.plugin();
  await holder.seed('private.css', css('mine', { 'Cache-Control': 'private, max-age=60' }));
  await holder.seed('no-store.css', css('mine', { 'Cache-Control': 'no-store' }));
  await holder.seed('missing.css', new Response('not found', { status: 404 }));
  await (await caches.open('holder')).put('https://example.com/assets/app.css', css('theirs'));
  await connected(asker.plugin, 1);

  expect(await asker.plugin.fetch(url('private.css'))).toBeNull();
  expect(await asker.plugin.fetch(url('no-store.css'))).toBeNull();
  expect(await asker.plugin.fetch(url('missing.css'))).toBeNull();
  expect(await asker.plugin.fetch('https://example.com/assets/app.css')).toBeNull();
});

test('a body over maxSize is neither sent nor accepted', async () => {
  const peers = network();
  const small = peers.plugin({ maxSize: 1000 });
  const asker = peers.plugin({ maxSize: 1000 });
  const holder = peers.plugin();
  await small.seed('big.bin', new Response(randomBytes(5000)));
  await holder.seed('big.bin', new Response(randomBytes(5000)));
  await connected(asker.plugin, 2);

  expect(await asker.plugin.fetch(url('big.bin'))).toBeNull();
});

/**
 * What a page answered a peer that sent it messages as soon as they connected, once count answers came, by id:
 * a page answers each message when it has looked, in no set order.
 */
async function answersTo(
  peers: Network,
  messages: object[],
  count = messages.length,
  timeout = 10_000,
): Promise<unknown[]> {
  const answers: unknown[] = [];
  peers.peer(
    (message) => {
      if (message.type !== 'response') answers.push(message);
      else answers.push({ type: 'response', id: message.id });
    },
    (reply) => {
      for (const message of messages) reply(message);
    },
  );
  await vi.waitFor(
    () => {
      expect(answers.length).toBeGreaterThanOrEqual(count);
    },
    { timeout },
  );
  return answers.sort((a, b) => (a as { id: number }).id - (b as { id: number }).id);
}

test('a page tells a peer it lacks what is over its maxSize', async () => {
  const peers = network();
  const holder = peers.plugin({ maxSize: 1000 });
  await holder.seed('big.bin', new Response(randomBytes(5000)));
  await holder.seed('small.bin', new Response(randomBytes(500)));

  expect(
    await answersTo(peers, [
      { type: 'has', id: 1, url: url('big.bin') },
      { type: 'has', id: 2, url: url('small.bin') },
    ]),
  ).toEqual([
    { type: 'miss', id: 1 },
    { type: 'have', id: 2 },
  ]);
});

test('a peer that asks for several bodies at once gets one, and gone for the others', async () => {
  const peers = network();
  const holder = peers.plugin();
  await holder.seed('app.css', css('body { color: red }'));

  const answers = await answersTo(
    peers,
    [1, 2, 3].map((id) => ({ type: 'get', id, url: url('app.css') })),
  );

  expect(answers).toEqual([
    { type: 'response', id: 1 },
    { type: 'gone', id: 2 },
    { type: 'gone', id: 3 },
  ]);
});

/** Signaling through every hub at once: the peers of each hub meet this page, but not each other. */
function star(hubs: Hub[]): Signaling {
  const links = hubs.map((hub) => hub.connect());
  return {
    send: (event) => {
      for (const link of links) link.send(event);
    },
    subscribe: (listener) => {
      const stops = links.map((link) => link.subscribe(listener));
      return () => {
        for (const stop of stops) stop();
      };
    },
  };
}

/**
 * A page holding big.bin, 4 MiB, and count peers that each meet only it, to ask it for bodies: WebKit connects no
 * more than a dozen RTCPeerConnections in a page, where a mesh of six would make thirty.
 */
async function askers(count: number) {
  const hubs = Array.from({ length: count }, () => new Hub());
  const room = `room-${String(unique++)}`;
  const cacheName = `cache-${String(unique++)}`;
  const holder = new PeerPlugin({ signaling: star(hubs), room, cacheName, maxSize: 8 * 1024 * 1024 });
  cleanup.push(() => {
    holder.close();
  });
  await (await caches.open(cacheName)).put(url('big.bin'), new Response(randomBytes(4 * 1024 * 1024)));
  const all = hubs.map((hub) => {
    const peer = new PeerData(hub.connect());
    cleanup.push(() => {
      peer.close();
    });
    const asker: { peer: PeerData; ask?: Reply; answers: string[] } = { peer, answers: [] };
    peer.connect(room).on('participant', (participant: Participant) => {
      participant.on('connected', () => {
        asker.ask = (sent) => {
          participant.send(JSON.stringify(sent));
        };
      });
      participant.on('message', (data) => {
        if (typeof data !== 'string') return;
        const { type } = JSON.parse(data) as { type: string };
        if (type === 'response' || type === 'gone') asker.answers.push(type);
      });
    });
    return asker;
  });
  await connected(holder, count);
  await vi.waitFor(() => {
    expect(all.every((asker) => asker.ask)).toBe(true);
  });
  return all;
}

/** Makes every data channel in this page say it buffers 2 MiB, as one whose peer takes no more does. */
function stallChannels(): void {
  const real = Object.getOwnPropertyDescriptor(RTCDataChannel.prototype, 'bufferedAmount');
  Object.defineProperty(RTCDataChannel.prototype, 'bufferedAmount', { configurable: true, get: () => 2 * 1024 * 1024 });
  cleanup.push(() => {
    if (real) Object.defineProperty(RTCDataChannel.prototype, 'bufferedAmount', real);
  });
}

test(
  'a page sends four bodies at once at most, and gone to the peers asking for more',
  { timeout: 60_000 },
  async () => {
    const all = await askers(5);

    for (const [id, asker] of all.entries()) asker.ask?.({ type: 'get', id, url: url('big.bin') });
    await vi.waitFor(
      () => {
        expect(all.flatMap((asker) => asker.answers)).toHaveLength(5);
      },
      { timeout: 30_000 },
    );

    expect(all.flatMap((asker) => asker.answers).sort()).toEqual([
      'gone',
      'response',
      'response',
      'response',
      'response',
    ]);
  },
);

test(
  'a page stops sending a body to a peer that takes no more of it for ten seconds',
  { timeout: 30_000 },
  async () => {
    stallChannels();
    const peers = network();
    const holder = peers.plugin();
    await holder.seed('app.css', css('body { color: red }'));

    const answers = await answersTo(peers, [{ type: 'get', id: 1, url: url('app.css') }], 2, 20_000);

    expect(answers).toEqual([
      { type: 'response', id: 1 },
      { type: 'gone', id: 1 },
    ]);
  },
);

test('a page answers a URL that does not parse', async () => {
  const peers = network();
  peers.plugin();

  expect(
    await answersTo(peers, [
      { type: 'has', id: 1, url: 'http://[' },
      { type: 'get', id: 2, url: 'http://[' },
    ]),
  ).toEqual([
    { type: 'miss', id: 1 },
    { type: 'gone', id: 2 },
  ]);
});

test('two lookups at once get both bodies from one peer', async () => {
  const peers = network();
  const holder = peers.plugin();
  const asker = peers.plugin();
  await holder.seed('one.css', css('one'));
  await holder.seed('two.css', css('two'));
  await connected(asker.plugin, 1);

  const [one, two] = await Promise.all([asker.plugin.fetch(url('one.css')), asker.plugin.fetch(url('two.css'))]);

  expect([await one?.text(), await two?.text()]).toEqual(['one', 'two']);
});

test('a body larger than a data channel buffers arrives whole', { timeout: 60_000 }, async () => {
  const peers = network();
  const size = 20 * 1024 * 1024;
  const holder = peers.plugin({ maxSize: 32 * 1024 * 1024 });
  const asker = peers.plugin({ maxSize: 32 * 1024 * 1024, timeout: 30_000 });
  const bytes = randomBytes(size);
  await holder.seed('video.bin', new Response(bytes));
  await connected(asker.plugin, 1);

  const received = new Uint8Array(await ((await asker.plugin.fetch(url('video.bin'))) ?? new Response()).arrayBuffer());

  expect(received.byteLength).toBe(size);
  expect(received.subarray(size - 1024)).toEqual(bytes.subarray(size - 1024));
});

test('a lookup the time runs out on resolves with null', async () => {
  const peers = network();
  const asker = peers.plugin({ timeout: 200 });
  peers.peer(() => undefined);
  await connected(asker.plugin, 1);

  expect(await asker.plugin.fetch(url('app.css'))).toBeNull();
});

test('close resolves the lookups in progress with null, and later ones too', async () => {
  const peers = network();
  const asker = peers.plugin();
  peers.peer(() => undefined);
  await connected(asker.plugin, 1);

  const lookup = asker.plugin.fetch(url('app.css'));
  asker.plugin.close();

  expect(await lookup).toBeNull();
  expect(await asker.plugin.fetch(url('app.css'))).toBeNull();
});

test('a peer still sending a body a lookup gave up on is asked for the next once it has arrived', async () => {
  const peers = network();
  const asker = peers.plugin({ timeout: 1000 });
  let sending = false;
  peers.peer((message, reply) => {
    if (message.type === 'has') reply({ type: 'have', id: message.id });
    if (message.type !== 'get') return;
    // As a page does, it sends one body at a time.
    if (sending) {
      reply({ type: 'gone', id: message.id });
      return;
    }
    const body = new TextEncoder().encode(String(message.url));
    reply(header(message.id, body.byteLength));
    if (message.url !== url('slow.css')) {
      reply(body);
      return;
    }
    sending = true;
    setTimeout(() => {
      reply(body);
      sending = false;
    }, 1500);
  });
  await connected(asker.plugin, 1);

  expect(await asker.plugin.fetch(url('slow.css'))).toBeNull();
  expect(await (await asker.plugin.fetch(url('next.css')))?.text()).toBe(url('next.css'));
});

test('a peer sending a body over maxSize is asked for the next once it has arrived', async () => {
  const peers = network();
  const asker = peers.plugin({ maxSize: 1000 });
  const PROBE = 1_000_000;
  let probed: () => void = () => undefined;
  const probe = new Promise<void>((resolve) => (probed = resolve));
  let sending = false;
  peers.peer((message, reply) => {
    if (message.type === 'miss' && message.id === PROBE) probed();
    if (message.type === 'has') {
      reply({ type: 'have', id: message.id });
      // The channel keeps order: a get the asker sends on hearing it has small.css arrives before its answer.
      if (message.url === url('small.css')) reply({ type: 'has', id: PROBE, url: url('probe.css') });
    }
    if (message.type !== 'get') return;
    // As a page does, it sends one body at a time.
    if (sending) {
      reply({ type: 'gone', id: message.id });
      return;
    }
    const body = message.url === url('small.css') ? new TextEncoder().encode('small') : new Uint8Array(5000);
    reply(header(message.id, body.byteLength));
    if (body.byteLength < 5000) {
      reply(body);
      return;
    }
    sending = true;
    void probe.then(() => {
      reply(body);
      sending = false;
    });
  });
  await connected(asker.plugin, 1);

  expect(await asker.plugin.fetch(url('big.bin'))).toBeNull();
  expect(await (await asker.plugin.fetch(url('small.css')))?.text()).toBe('small');
});

const failures: [string, (id: unknown, reply: Reply) => void][] = [
  [
    'answers gone',
    (id, reply) => {
      reply({ type: 'gone', id });
    },
  ],
  [
    'sends an error response',
    (id, reply) => {
      reply(header(id, 4, 500));
      reply(new TextEncoder().encode('oops'));
    },
  ],
  [
    'sends more than it announced',
    (id, reply) => {
      reply(header(id, 2));
      reply(new TextEncoder().encode('too long'));
    },
  ],
  [
    'announces more than maxSize',
    (id, reply) => {
      reply(header(id, 3 * 1024 * 1024));
    },
  ],
];

test.each(failures)('a peer that has it but %s is passed over for the next', async (_, send) => {
  const peers = network();
  const asker = peers.plugin();
  const broken = brokenPeer(peers, send);
  // The honest peer says it has it only once the broken one was asked for it.
  honestPeer(peers, 'honest', broken.wasAsked);
  await connected(asker.plugin, 2);

  expect(await (await asker.plugin.fetch(url('app.css')))?.text()).toBe('honest');
});

test('a peer that gives up on a body the lookup has moved on from does not stop the next peer', async () => {
  const peers = network();
  const asker = peers.plugin();
  const PROBE = 1_000_000;
  let honestAsked: () => void = () => undefined;
  const honestWasAsked = new Promise<void>((resolve) => (honestAsked = resolve));
  let tookItIn: () => void = () => undefined;
  const tookInGone = new Promise<void>((resolve) => (tookItIn = resolve));
  let tooBigSent: () => void = () => undefined;
  const tooBig = new Promise<void>((resolve) => (tooBigSent = resolve));
  peers.peer((message, reply) => {
    if (message.type === 'has') reply({ type: 'have', id: message.id });
    if (message.type === 'miss' && message.id === PROBE) tookItIn();
    if (message.type !== 'get') return;
    // More than the asker takes, which it moves on from while this peer sends it, then gives up on.
    reply(header(message.id, 3 * 1024 * 1024));
    tooBigSent();
    void honestWasAsked.then(() => {
      reply({ type: 'gone', id: message.id });
      // The channel keeps order: the asker answers this once it has taken in the gone.
      reply({ type: 'has', id: PROBE, url: url('probe.css') });
    });
  });
  peers.peer((message, reply) => {
    if (message.type === 'has')
      void tooBig.then(() => {
        reply({ type: 'have', id: message.id });
      });
    if (message.type !== 'get') return;
    honestAsked();
    const body = new TextEncoder().encode('honest');
    void tookInGone.then(() => {
      reply(header(message.id, body.byteLength));
      reply(body);
    });
  });
  await connected(asker.plugin, 2);

  expect(await (await asker.plugin.fetch(url('app.css')))?.text()).toBe('honest');
});

test('a peer that leaves part-way through a body is passed over for the next', async () => {
  const peers = network();
  const asker = peers.plugin();
  const stalling = brokenPeer(peers, (id, reply) => {
    reply(header(id, 10));
    reply(new TextEncoder().encode('half'));
  });
  honestPeer(peers, 'honest', stalling.wasAsked);
  await connected(asker.plugin, 2);

  const response = asker.plugin.fetch(url('app.css'));
  await stalling.wasAsked;
  stalling.peer.close();

  expect(await (await response)?.text()).toBe('honest');
});

test('a page asks each peer for one body at a time', async () => {
  const peers = network();
  const asker = peers.plugin();
  const gets: unknown[] = [];
  let release: () => void = () => undefined;
  const released = new Promise<void>((resolve) => (release = resolve));
  let probed: () => void = () => undefined;
  const probe = new Promise<void>((resolve) => (probed = resolve));
  const PROBE = 1_000_000;
  peers.peer((message, reply) => {
    if (message.type === 'has') reply({ type: 'have', id: message.id });
    if (message.type === 'miss' && message.id === PROBE) probed();
    if (message.type !== 'get') return;
    gets.push(message.url);
    const body = new TextEncoder().encode(String(message.url));
    const send = () => {
      reply(header(message.id, body.byteLength));
      reply(body);
    };
    if (gets.length > 1) {
      send();
      return;
    }
    // The channel keeps order: a second get sent before the asker answers this would arrive before its answer.
    reply({ type: 'has', id: PROBE, url: url('probe.css') });
    void released.then(send);
  });
  await connected(asker.plugin, 1);

  const first = asker.plugin.fetch(url('one.css'));
  const second = asker.plugin.fetch(url('two.css'));
  await probe;
  expect(gets).toEqual([url('one.css')]);
  release();

  expect(await (await first)?.text()).toBe(url('one.css'));
  expect(await (await second)?.text()).toBe(url('two.css'));
  expect(gets).toEqual([url('one.css'), url('two.css')]);
});

test("the worker's DelegatePlugin gets the response the page found among its peers", async () => {
  const peers = network();
  const page = peers.plugin();
  honestPeer(peers, 'from a peer');
  await connected(page.plugin, 1);
  // What a service worker's client.postMessage does: a message event on the page's navigator.serviceWorker.
  const client: ClientLike = {
    postMessage: (message, transfer) => {
      const ports = transfer as MessagePort[];
      navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: message, ports }));
    },
  };
  const delegate = new DelegatePlugin({
    clients: { get: () => Promise.resolve(client), matchAll: () => Promise.resolve([]) },
  });

  const response = await delegate
    .getMiddleware(fetchEvent(url('logo.png'), { clientId: 'page', destination: 'image' }).event)
    .get();

  expect(await response?.text()).toBe('from a peer');
});

test('peers find each other through the socket.io signaling server', async () => {
  const sockets = network(() => {
    const socket = io(inject('signalingUrl'), { transports: ['websocket'] });
    cleanup.push(() => socket.close());
    return new SocketChannel(socket);
  });
  const holder = sockets.plugin();
  const asker = sockets.plugin();
  await holder.seed('app.css', css('over socket.io'));
  await connected(asker.plugin, 1);

  expect(await (await asker.plugin.fetch(url('app.css')))?.text()).toBe('over socket.io');
});

test('onPeers hears each peer connect and leave', async () => {
  const peers = network();
  const counts: number[] = [];
  const watcher = peers.plugin({ onPeers: (count) => counts.push(count) });
  const other = peers.plugin();
  await connected(watcher.plugin, 1);

  other.plugin.close();
  await connected(watcher.plugin, 0);

  expect(counts).toEqual([1, 0]);
});
