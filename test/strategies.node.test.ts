import { afterEach, expect, test, vi } from 'vitest';
import { fastest, ordered } from '../src/strategies.js';
import { captureReports, deferred, fetchEvent, middleware } from './fakes.js';

afterEach(() => {
  vi.unstubAllGlobals();
});

const text = (body: string) => () => new Response(body);
const miss = () => null;

test('ordered answers with the first response, and asks no further', async () => {
  const first = middleware(miss);
  const second = middleware(text('second'));
  const third = middleware(text('third'));

  const response = await ordered(first.factory, second.factory, third.factory)(fetchEvent().event);

  expect(await response?.text()).toBe('second');
  expect(third.asked).toBe(0);
});

test('ordered gives a copy to each middleware asked before the answer, and to no other', async () => {
  const { event, settled } = fetchEvent();
  const cache = middleware(miss);
  const peers = middleware(miss);
  const network = middleware(text('from the network'));
  const after = middleware(text('never asked'));

  const response = await ordered(cache.factory, peers.factory, network.factory, after.factory)(event);
  await settled();

  expect(await response?.text()).toBe('from the network');
  expect(cache.kept).toEqual(['from the network']);
  expect(peers.kept).toEqual(['from the network']);
  expect(network.kept).toEqual([]);
  expect(after.kept).toEqual([]);
});

test('ordered resolves with null when every middleware misses', async () => {
  expect(await ordered(middleware(miss).factory, middleware(miss).factory)(fetchEvent().event)).toBeNull();
  expect(await ordered()(fetchEvent().event)).toBeNull();
});

test('a middleware that throws counts as a miss, and its error is reported', async () => {
  const reported = captureReports();
  const error = new Error('broken cache');
  const broken = middleware(() => Promise.reject(error));
  const factoryError = new Error('broken factory');
  const throwing = () => {
    throw factoryError;
  };

  const response = await ordered(broken.factory, throwing, middleware(text('ok')).factory)(fetchEvent().event);

  expect(await response?.text()).toBe('ok');
  expect(reported).toEqual([error, factoryError]);
});

test('a put that fails is reported and leaves the response alone', async () => {
  const reported = captureReports();
  const { event, settled } = fetchEvent();
  const error = new Error('quota exceeded');
  const full = { get: () => null, put: () => Promise.reject(error) };

  const response = await ordered(() => full, middleware(text('ok')).factory)(event);
  await settled();

  expect(await response?.text()).toBe('ok');
  expect(reported).toEqual([error]);
});

// peer-cdn 1.0.5 answered with whichever middleware settled first, a miss included.
test('fastest answers with the first response, not the first miss', async () => {
  const late = deferred<Response>();
  const handler = fastest(middleware(miss).factory, middleware(() => late.promise).factory);

  const answer = handler(fetchEvent().event);
  late.resolve(new Response('world'));

  expect(await (await answer)?.text()).toBe('world');
});

test('fastest gives every other middleware a copy, the slower ones included', async () => {
  const { event, settled } = fetchEvent();
  const slow = deferred<Response | null>();
  const cache = middleware(miss);
  const peers = middleware(() => slow.promise);
  const network = middleware(text('fast'));

  const response = await fastest(cache.factory, peers.factory, network.factory)(event);
  slow.resolve(new Response('slow'));
  await settled();

  expect(await response?.text()).toBe('fast');
  expect(cache.kept).toEqual(['fast']);
  expect(peers.kept).toEqual(['fast']);
  expect(network.kept).toEqual([]);
});

test('fastest resolves with null once every middleware missed', async () => {
  expect(await fastest(middleware(miss).factory, middleware(miss).factory)(fetchEvent().event)).toBeNull();
  expect(await fastest()(fetchEvent().event)).toBeNull();
});
