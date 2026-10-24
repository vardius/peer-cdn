import { expect, test } from 'vitest';
import { parseRange, partialResponse, resolveRange } from '../src/range.js';

test('parseRange reads a single byte range', () => {
  expect(parseRange('bytes=0-99')).toEqual({ first: 0, last: 99 });
  expect(parseRange('bytes=100-')).toEqual({ first: 100, last: undefined });
  expect(parseRange('bytes=-500')).toEqual({ suffix: 500 });
  expect(parseRange(' Bytes=5-5 ')).toEqual({ first: 5, last: 5 });
});

test('parseRange ignores what it should send the whole body for', () => {
  expect(parseRange('bytes=0-1,5-6')).toBeUndefined();
  expect(parseRange('items=0-1')).toBeUndefined();
  expect(parseRange('bytes=-')).toBeUndefined();
  expect(parseRange('bytes=9-1')).toBeUndefined();
  expect(parseRange('bytes=a-b')).toBeUndefined();
  expect(parseRange('')).toBeUndefined();
});

// peer-cdn 1.0.5 answered a range that ran past the end as unsatisfiable.
test('a range past the end is cut at the end', () => {
  expect(resolveRange({ first: 5, last: 100 }, 10)).toEqual([5, 9]);
  expect(resolveRange({ first: 5, last: undefined }, 10)).toEqual([5, 9]);
});

// peer-cdn 1.0.5 answered a suffix longer than the body as unsatisfiable.
test('a suffix longer than the body covers the whole body', () => {
  expect(resolveRange({ suffix: 100 }, 10)).toEqual([0, 9]);
  expect(resolveRange({ suffix: 3 }, 10)).toEqual([7, 9]);
});

// peer-cdn 1.0.5 served a range that started past the end instead of answering 416.
test('a range that starts past the end, or covers nothing, is unsatisfiable', () => {
  expect(resolveRange({ first: 20, last: undefined }, 10)).toBeUndefined();
  expect(resolveRange({ first: 10, last: 12 }, 10)).toBeUndefined();
  expect(resolveRange({ suffix: 0 }, 10)).toBeUndefined();
  expect(resolveRange({ first: 0, last: 0 }, 0)).toBeUndefined();
});

const cached = (): Response =>
  new Response('0123456789', { headers: { 'Content-Type': 'text/plain', 'Content-Length': '10' } });

test('partialResponse answers with the part asked for', async () => {
  const response = await partialResponse('bytes=2-4', cached());
  expect(response?.status).toBe(206);
  expect(response?.headers.get('Content-Range')).toBe('bytes 2-4/10');
  expect(response?.headers.get('Content-Length')).toBe('3');
  expect(response?.headers.get('Content-Type')).toBe('text/plain');
  expect(await response?.text()).toBe('234');
});

test('partialResponse answers 416 for a range outside the body', async () => {
  const response = await partialResponse('bytes=50-', cached());
  expect(response?.status).toBe(416);
  expect(response?.headers.get('Content-Range')).toBe('bytes */10');
  expect(response?.headers.has('Content-Length')).toBe(false);
  expect(await response?.text()).toBe('');
});

test('partialResponse leaves the response unread when the header should be ignored', async () => {
  const original = cached();
  expect(await partialResponse('bytes=0-1,4-5', original)).toBeUndefined();
  expect(original.bodyUsed).toBe(false);
});
