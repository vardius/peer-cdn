import { createServer } from 'node:http';
import type { AddressInfo } from 'node:net';
import { afterAll, beforeAll, expect, test } from 'vitest';
import { io as connect, type Socket } from 'socket.io-client';
import type { Server } from 'socket.io';
import type { SignalingEvent } from 'peer-data';
import { attachSignaling } from '../src/server.js';

let url = '';
let server: Server;
const sockets: Socket[] = [];

beforeAll(async () => {
  const httpServer = createServer();
  server = attachSignaling(httpServer);
  // Registered after the server's own handler, so each acknowledgement means the message was routed.
  server.on('connection', (socket) => {
    socket.on('message', (_event: unknown, ack?: () => void) => {
      ack?.();
    });
  });
  await new Promise<void>((resolve) => httpServer.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${String((httpServer.address() as AddressInfo).port)}`;
});

afterAll(async () => {
  for (const socket of sockets) socket.close();
  await server.close();
});

interface Client {
  id: string;
  socket: Socket;
  /** Everything received, but flush markers. */
  inbox: SignalingEvent[];
  /** Sends, and resolves once the server has routed it. */
  send(message: unknown): Promise<void>;
  /** Resolves with the first message from now on that matches. */
  next(match: (event: SignalingEvent) => boolean): Promise<SignalingEvent>;
}

let marker: Client;
let markers = 0;

/** A connected socket that joined room as id. */
async function join(room: string, id: string): Promise<Client> {
  const socket = connect(url, { transports: ['websocket'] });
  sockets.push(socket);
  const inbox: SignalingEvent[] = [];
  const waiting = new Set<{ match: (event: SignalingEvent) => boolean; resolve: (event: SignalingEvent) => void }>();
  socket.on('message', (event: SignalingEvent) => {
    if (event.caller.id !== 'marker') inbox.push(event);
    for (const w of waiting) {
      if (!w.match(event)) continue;
      waiting.delete(w);
      w.resolve(event);
    }
  });
  await new Promise<void>((resolve) => socket.on('connect', resolve));
  const client: Client = {
    id,
    socket,
    inbox,
    send: async (message) => {
      await socket.emitWithAck('message', message);
    },
    next: (match) => new Promise((resolve) => waiting.add({ match, resolve })),
  };
  await client.send(connectEvent(room, id));
  return client;
}

/**
 * Resolves once everything the server sent to client so far has arrived: a marker routed after it comes after it
 * on the same connection.
 */
async function flush(client: Client): Promise<void> {
  const sdp = `marker ${String(markers++)}`;
  const arrived = client.next((event) => event.type === 'OFFER' && event.payload.sdp === sdp);
  await marker.send({ ...offer('markers', 'marker', client.id), payload: { type: 'offer', sdp } });
  await arrived;
}

beforeAll(async () => {
  marker = await join('markers', 'marker');
});

const connectEvent = (room: string, id: string): SignalingEvent => ({
  type: 'CONNECT',
  room: { id: room },
  caller: { id },
  callee: null,
  payload: null,
});

const offer = (room: string, from: string, to: string, sdp = 'v=0'): SignalingEvent => ({
  type: 'OFFER',
  room: { id: room },
  caller: { id: from },
  callee: { id: to },
  payload: { type: 'offer', sdp },
});

test('CONNECT reaches the others in the room, and no one else', async () => {
  const a = await join('r1', 'a1');
  const elsewhere = await join('r2', 'e1');
  const b = await join('r1', 'b1');
  await Promise.all([a, b, elsewhere].map(flush));

  expect(a.inbox).toEqual([connectEvent('r1', 'b1')]);
  expect(b.inbox).toEqual([]);
  expect(elsewhere.inbox).toEqual([]);
});

test('an offer reaches the callee alone, and only from the id that joined with it', async () => {
  const a = await join('r3', 'a3');
  const b = await join('r3', 'b3');
  const c = await join('r3', 'c3');
  await Promise.all([a, b, c].map(flush));
  for (const client of [a, b, c]) client.inbox.length = 0;

  await c.send(offer('r3', 'a3', 'b3', 'spoofed'));
  await a.send(offer('r3', 'a3', 'b3'));
  await Promise.all([a, b, c].map(flush));

  expect(b.inbox).toEqual([offer('r3', 'a3', 'b3')]);
  expect(a.inbox).toEqual([]);
  expect(c.inbox).toEqual([]);
});

test('an id another socket joined with cannot be claimed', async () => {
  const a = await join('r4', 'a4');
  const b = await join('r4', 'b4');
  const thief = await join('r4', 't4');
  await Promise.all([a, b].map(flush));
  for (const client of [a, b]) client.inbox.length = 0;

  await thief.send(connectEvent('r4', 'a4'));
  await thief.send(offer('r4', 'a4', 'b4', 'stolen'));
  await flush(b);

  expect(b.inbox).toEqual([]);
});

test('a page that reconnects before its old socket is noticed gone gets its id once that socket goes', async () => {
  const old = await join('r9', 'a9');
  const b = await join('r9', 'b9');
  await flush(b);
  b.inbox.length = 0;

  // The new socket asks for the id while the server still holds the old one, which may be a thief's too.
  const renewed = await join('r9', 'a9');
  await flush(b);
  expect(b.inbox).toEqual([]);

  const back = b.next((event) => event.type === 'CONNECT');
  old.socket.close();
  await back;
  expect(b.inbox).toEqual([{ ...connectEvent('r9', 'a9'), type: 'DISCONNECT' }, connectEvent('r9', 'a9')]);

  await b.send(offer('r9', 'b9', 'a9'));
  await flush(renewed);
  expect(renewed.inbox).toEqual([offer('r9', 'b9', 'a9')]);
});

test('an id left with DISCONNECT goes to the socket waiting for it, after the DISCONNECT', async () => {
  const a = await join('r10', 'a10');
  const b = await join('r10', 'b10');
  await join('r10', 'a10');
  await flush(b);
  b.inbox.length = 0;

  const back = b.next((event) => event.type === 'CONNECT');
  await a.send({ ...connectEvent('r10', 'a10'), type: 'DISCONNECT' });
  await back;

  expect(b.inbox).toEqual([{ ...connectEvent('r10', 'a10'), type: 'DISCONNECT' }, connectEvent('r10', 'a10')]);
});

test('a socket that leaves an id it waits for does not get it', async () => {
  const old = await join('r12', 'a12');
  const b = await join('r12', 'b12');
  const renewed = await join('r12', 'a12');
  await renewed.send({ ...connectEvent('r12', 'a12'), type: 'DISCONNECT' });
  await flush(b);
  b.inbox.length = 0;

  old.socket.close();
  await b.next((event) => event.type === 'DISCONNECT');
  await flush(b);

  expect(b.inbox).toEqual([{ ...connectEvent('r12', 'a12'), type: 'DISCONNECT' }]);
});

test('the ids a socket waits for count toward its 16, until another socket asks for them', async () => {
  const holder = await join('r13', 'a13');
  const waiter = await join('r13', 'a13');
  await flush(holder);
  holder.inbox.length = 0;

  for (let i = 1; i <= 16; i++) await waiter.send(connectEvent('r13', `w${String(i)}`));
  await join('r13', 'a13');
  await waiter.send(connectEvent('r13', 'w16'));
  await flush(holder);

  expect(holder.inbox.map((event) => event.caller.id)).toEqual(
    Array.from({ length: 16 }, (_, i) => `w${String(i + 1)}`),
  );
});

test('a socket joins with 16 ids at most', async () => {
  const a = await join('r11', 'a11');
  const flood = await join('r11', 'f0');
  await flush(a);
  a.inbox.length = 0;

  for (let i = 1; i <= 16; i++) await flood.send(connectEvent('r11', `f${String(i)}`));
  await flush(a);

  expect(a.inbox.map((event) => event.caller.id)).toEqual(Array.from({ length: 15 }, (_, i) => `f${String(i + 1)}`));
});

test('an offer only goes into the room its id joined', async () => {
  const victim = await join('lobby', 'v1');
  await victim.send(connectEvent('secret', 'v2'));
  const mallory = await join('lobby', 'm1');
  await Promise.all([victim, mallory].map(flush));
  victim.inbox.length = 0;

  // The victim's peer in "secret" would take it for a participant of that room.
  await mallory.send(offer('secret', 'm1', 'v1', 'sneaked in'));
  await flush(victim);

  expect(victim.inbox).toEqual([]);
});

test('DISCONNECT reaches the others in the room, and only from the id that joined', async () => {
  const a = await join('r5', 'a5');
  const b = await join('r5', 'b5');
  await flush(a);
  a.inbox.length = 0;

  await a.send({ ...connectEvent('r5', 'b5'), type: 'DISCONNECT' });
  await Promise.all([a, b].map(flush));
  expect(a.inbox).toEqual([]);
  expect(b.inbox).toEqual([]);

  await b.send({ ...connectEvent('r5', 'b5'), type: 'DISCONNECT' });
  await flush(a);
  expect(a.inbox).toEqual([{ ...connectEvent('r5', 'b5'), type: 'DISCONNECT' }]);
});

test('a socket that drops sends a DISCONNECT for each id it joined with', async () => {
  const a = await join('r6', 'a6');
  const b = await join('r6', 'b6');
  await b.send(connectEvent('r7', 'b7'));
  const c = await join('r7', 'c7');
  await Promise.all([a, c].map(flush));

  const atA = a.next((event) => event.type === 'DISCONNECT');
  const atC = c.next((event) => event.type === 'DISCONNECT');
  b.socket.close();

  expect(await atA).toEqual({ ...connectEvent('r6', 'b6'), type: 'DISCONNECT' });
  expect(await atC).toEqual({ ...connectEvent('r7', 'b7'), type: 'DISCONNECT' });
});

test('malformed messages are dropped', async () => {
  const a = await join('r8', 'a8');
  const b = await join('r8', 'b8');
  await flush(a);
  a.inbox.length = 0;

  for (const message of [
    null,
    'CONNECT',
    { type: 'CONNECT', room: { id: 'r8' } },
    { type: 'CONNECT', room: { id: 'r8' }, caller: { id: '' } },
    { type: 'OFFER', room: { id: 'r8' }, caller: { id: 'b8' }, callee: null, payload: {} },
  ]) {
    await b.send(message);
  }
  await flush(a);

  expect(a.inbox).toEqual([]);
});
