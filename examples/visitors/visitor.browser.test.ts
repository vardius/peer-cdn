import { afterEach, expect, test, vi } from 'vitest';
import { Hub } from '../../test/hub.js';
import { visit } from './visitor.js';

const cleanup: (() => unknown)[] = [];

afterEach(async () => {
  for (const close of cleanup.splice(0)) close();
  for (const name of await caches.keys()) await caches.delete(name);
});

const picture = `${location.origin}/examples/assets/peaks.svg`;

function visitors() {
  const hub = new Hub();
  const counts = new Map<string, number>();
  const create = (cacheName: string) => {
    const visitor = visit({
      signaling: hub.connect(),
      room: 'visitors',
      cacheName,
      onPeers: (count) => counts.set(cacheName, count),
    });
    cleanup.push(visitor.leave);
    return visitor;
  };
  const ada = create('ada');
  const grace = create('grace');
  return {
    ada,
    grace,
    connected: () =>
      vi.waitFor(
        () => {
          expect([counts.get('ada'), counts.get('grace')]).toEqual([1, 1]);
        },
        { timeout: 10_000 },
      ),
  };
}

test('the first visitor gets a file from the server, the second from the first, then each from its cache', async () => {
  const { ada, grace, connected } = visitors();
  await connected();
  const server = await (await fetch(picture)).text();

  const first = await ada.load(picture);
  const second = await grace.load(picture);
  const again = await grace.load(picture);

  expect(first.from).toBe('server');
  expect(second.from).toBe('peers');
  expect(again.from).toBe('cache');
  expect(await second.response.text()).toBe(server);
});

test('a visitor that forgot its files gets them back from the other', async () => {
  const { ada, grace, connected } = visitors();
  await connected();
  await ada.load(picture);
  await grace.load(picture);

  await ada.forget();

  expect((await ada.load(picture)).from).toBe('peers');
});
