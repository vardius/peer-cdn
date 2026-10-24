import type { Server as HttpServer } from 'node:http';
import type { Http2SecureServer } from 'node:http2';
import { Server, type ServerOptions } from 'socket.io';

interface Event {
  type: string;
  room: { id: string };
  caller: { id: string };
  callee?: { id: string } | null;
}

const hasId = (value: unknown): value is { id: string } =>
  typeof value === 'object' && value !== null && 'id' in value && typeof value.id === 'string' && value.id !== '';

const isEvent = (value: unknown): value is Event =>
  typeof value === 'object' &&
  value !== null &&
  'type' in value &&
  typeof value.type === 'string' &&
  'room' in value &&
  hasId(value.room) &&
  'caller' in value &&
  hasId(value.caller);

/** A page needs one id for each room it joins: a socket asking for more is flooding the others with peers. */
const MAX_IDS = 16;

/**
 * A signaling server for peer-cdn, and any peer-data peers, on socket.io 4. CONNECT and DISCONNECT go to the
 * others in the room, and OFFER, ANSWER and CANDIDATE to the callee alone. A socket speaks only for the ids it
 * joined rooms with, 16 at most, and when it drops, the others in its rooms get a DISCONNECT for each. A CONNECT
 * for an id another socket holds waits until that socket leaves: a page that reconnects asks with its id before
 * the server notices that its old socket is gone.
 */
export function attachSignaling(
  httpServer: HttpServer | Http2SecureServer,
  options: Partial<ServerOptions> = {},
): Server {
  const io = new Server(httpServer, options);
  /** Every peer id in use, so no socket can claim another's. */
  const claimed = new Set<string>();
  /** For an id in use, the socket that asked for it last: the ids it waits for, and how it joins with this one. */
  const waiting = new Map<string, { pending: Map<string, string>; join: () => void }>();

  function release(id: string): void {
    claimed.delete(id);
    const waiter = waiting.get(id);
    waiting.delete(id);
    waiter?.join();
  }

  io.on('connection', (socket) => {
    /** The room of each peer id this socket joined with. */
    const own = new Map<string, string>();
    /** The room of each id this socket waits for, until it's free or another socket asks for it. */
    const pending = new Map<string, string>();

    function connect(event: Event): void {
      const { id } = event.caller;
      const room = event.room.id;
      pending.delete(id);
      claimed.add(id);
      own.set(id, room);
      void socket.join([`room:${room}`, `peer:${id}`]);
      socket.to(`room:${room}`).emit('message', event);
    }

    /** Waits for the event's id to be free, in place of the socket that asked for it before. */
    function wait(event: Event): void {
      const { id } = event.caller;
      waiting.get(id)?.pending.delete(id);
      pending.set(id, event.room.id);
      waiting.set(id, {
        pending,
        join: () => {
          connect(event);
        },
      });
    }

    socket.on('message', (event: unknown) => {
      if (!isEvent(event)) return;
      const { id } = event.caller;
      const room = event.room.id;

      switch (event.type) {
        case 'CONNECT':
          if (own.has(id) || (!pending.has(id) && own.size + pending.size >= MAX_IDS)) return;
          if (claimed.has(id)) wait(event);
          else connect(event);
          return;
        case 'DISCONNECT':
          if (pending.get(id) === room) {
            pending.delete(id);
            waiting.delete(id);
            return;
          }
          if (own.get(id) !== room) return;
          // Before the id goes to a socket waiting for it, whose CONNECT must come after.
          socket.to(`room:${room}`).emit('message', event);
          leave(id, room);
          return;
        case 'OFFER':
        case 'ANSWER':
        case 'CANDIDATE':
          // Only into the room the id joined: the callee routes it by room.
          if (own.get(id) !== room || !hasId(event.callee)) return;
          socket.to(`peer:${event.callee.id}`).emit('message', event);
          return;
      }
    });

    socket.on('disconnect', () => {
      for (const id of pending.keys()) waiting.delete(id);
      for (const [id, room] of own) {
        io.to(`room:${room}`).emit('message', {
          type: 'DISCONNECT',
          room: { id: room },
          caller: { id },
          callee: null,
          payload: null,
        });
        release(id);
      }
    });

    function leave(id: string, room: string): void {
      own.delete(id);
      void socket.leave(`peer:${id}`);
      // The socket may be in the room with another id too.
      if (![...own.values()].includes(room)) void socket.leave(`room:${room}`);
      release(id);
    }
  });

  return io;
}
