import { afterEach, expect, test, vi } from 'vitest';
import { server } from 'vitest/browser';
import { BroadcastChannelSignaling } from 'peer-data';
import { PeerPlugin } from 'peer-cdn';

const cleanup: (() => unknown)[] = [];

afterEach(async () => {
  for (const close of cleanup.splice(0).reverse()) await close();
  for (const name of await caches.keys()) await caches.delete(name);
});

/** Waits until plugin is connected to a peer. */
async function connected(plugin: PeerPlugin): Promise<void> {
  await vi.waitFor(
    () => {
      expect(plugin.peers).toBe(1);
    },
    { timeout: 10_000 },
  );
}

async function activate(registration: ServiceWorkerRegistration): Promise<void> {
  const worker = registration.installing ?? registration.waiting ?? registration.active;
  if (!worker || worker.state === 'activated') return;
  await new Promise<void>((resolve) => {
    worker.addEventListener('statechange', () => {
      if (worker.state === 'activated') resolve();
    });
  });
}

// Playwright's Firefox passes navigations to a service worker but not a page's own requests, in a frame or a
// window, so a worker there never sees them: the peers' side runs in Firefox in PeerPlugin's tests instead.
test.skipIf(server.browser === 'firefox')(
  "the example site's worker shows its page a picture from a peer, and caches it",
  async () => {
    const room = `sw-test-${crypto.randomUUID()}`;
    const picture = `${location.origin}/test/sw/assets/peer-only.svg`;

    // The peer: a PeerPlugin in this page, sharing a picture the server doesn't have.
    const signaling = new BroadcastChannelSignaling(room);
    const peer = new PeerPlugin({ signaling, room, cacheName: 'sw-test-peer' });
    cleanup.push(() => {
      peer.close();
      signaling.close();
    });
    const peerCache = await caches.open('sw-test-peer');
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>';
    await peerCache.put(picture, new Response(svg, { headers: { 'Content-Type': 'image/svg+xml' } }));

    // A page the worker controls, running PeerPlugin for it.
    const registration = await navigator.serviceWorker.register('/test/sw/worker.built.js', { scope: '/test/sw/' });
    cleanup.push(() => registration.unregister());
    await activate(registration);
    const frame = document.createElement('iframe');
    const loaded = new Promise((resolve) => {
      frame.addEventListener('load', resolve, { once: true });
    });
    frame.src = `/test/sw/page.html?room=${room}`;
    document.body.append(frame);
    cleanup.push(() => {
      frame.remove();
    });
    await loaded;
    const page = frame.contentWindow as (Window & typeof globalThis & { peerPlugin?: PeerPlugin }) | null;
    expect(page?.navigator.serviceWorker.controller).not.toBeNull();
    await vi.waitFor(() => {
      expect(page?.peerPlugin).toBeDefined();
    });
    await connected(peer);
    if (page?.peerPlugin) await connected(page.peerPlugin);

    // An image, as the example site shows its pictures.
    const image = page?.document.createElement('img');
    const shown = new Promise<boolean>((resolve) => {
      if (!image) return;
      image.onload = () => {
        resolve(true);
      };
      image.onerror = () => {
        resolve(false);
      };
      image.src = '/test/sw/assets/peer-only.svg';
    });
    expect(await shown).toBe(true);
    // The worker's CachePlugin kept it, under its default name.
    const kept = await (await caches.open('peer-cdn')).match(picture);
    expect(kept?.headers.get('Content-Type')).toBe('image/svg+xml');
    expect(await kept?.text()).toBe(svg);

    // A fetch has no integrity metadata to check what the peer sent, so neither the peers nor the cache, which
    // keeps the peer's picture for images, answer it: it goes to the server, which hasn't the picture.
    expect((await page?.fetch('/test/sw/assets/peer-only.svg'))?.status).toBe(404);
  },
);
