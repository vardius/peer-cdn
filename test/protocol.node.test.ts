import { expect, test } from 'vitest';
import { cacheControl, isFetchReply, metaOf, parsePeerMessage, toResponse } from '../src/protocol.js';

test('parsePeerMessage reads every message peers send', () => {
  const meta = { status: 200, statusText: 'OK', headers: [['content-type', 'text/css']] };
  for (const message of [
    { type: 'has', id: 0, url: 'https://example.com/a.css' },
    { type: 'have', id: 1 },
    { type: 'miss', id: 2 },
    { type: 'get', id: 3, url: 'https://example.com/a.css' },
    { type: 'gone', id: 4 },
    { type: 'response', id: 5, size: 10, ...meta },
  ]) {
    expect(parsePeerMessage(JSON.stringify(message))).toEqual(message);
  }
});

test('parsePeerMessage drops anything else', () => {
  for (const data of [
    'not json',
    'null',
    '[]',
    '{"type":"has","id":0}',
    '{"type":"have","id":-1}',
    '{"type":"have","id":1.5}',
    '{"type":"have"}',
    '{"type":"steal","id":0}',
    '{"type":"response","id":0,"status":200,"statusText":"OK","headers":[]}',
    '{"type":"response","id":0,"size":1,"status":200,"statusText":"OK","headers":[["a"]]}',
    '{"type":"response","id":0,"size":1,"status":200,"statusText":"OK","headers":{"a":"b"}}',
  ]) {
    expect(parsePeerMessage(data)).toBeUndefined();
  }
});

test('isFetchReply accepts the replies a page sends its worker, and nothing else', () => {
  expect(isFetchReply({ type: 'ack' })).toBe(true);
  expect(isFetchReply({ type: 'miss' })).toBe(true);
  expect(isFetchReply({ type: 'response', body: new ArrayBuffer(1), status: 200, statusText: '', headers: [] })).toBe(
    true,
  );
  expect(isFetchReply({ type: 'response', body: 'text', status: 200, statusText: '', headers: [] })).toBe(false);
  expect(isFetchReply({ type: 'other' })).toBe(false);
  expect(isFetchReply(null)).toBe(false);
});

test('metaOf keeps the headers that describe the body, not how it travelled', () => {
  const response = new Response('body', {
    status: 200,
    statusText: 'OK',
    headers: { 'Content-Type': 'text/css', 'Content-Encoding': 'gzip', 'Content-Length': '4', ETag: '"1"' },
  });
  expect(metaOf(response)).toEqual({
    status: 200,
    statusText: 'OK',
    headers: [
      ['content-type', 'text/css'],
      ['etag', '"1"'],
    ],
  });
});

test('toResponse builds a response, or nothing for one the browser rejects', async () => {
  const response = toResponse('body', { status: 200, statusText: 'OK', headers: [['content-type', 'text/css']] });
  expect(response?.headers.get('content-type')).toBe('text/css');
  expect(await response?.text()).toBe('body');
  expect(toResponse('body', { status: 99, statusText: '', headers: [] })).toBeUndefined();
  expect(toResponse('body', { status: 200, statusText: '', headers: [['bad name', 'x']] })).toBeUndefined();
});

test('cacheControl lists the directives in lower case', () => {
  const directives = cacheControl(new Response(null, { headers: { 'Cache-Control': 'Public, max-age=60, No-Store' } }));
  expect([...directives].sort()).toEqual(['max-age', 'no-store', 'public']);
  expect(cacheControl(new Response(null)).has('private')).toBe(false);
});
