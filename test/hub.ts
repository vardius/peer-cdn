import type { Signaling, SignalingEvent } from 'peer-data';

interface Client {
  id: string;
  rooms: Set<string>;
  listeners: Set<(message: unknown) => void>;
}

/**
 * Routes signaling events between its peers the way a signaling server does: CONNECT and DISCONNECT to the
 * others in the room, everything else to the callee, each delivered later and as a copy, like a message over
 * a network. With rewriteIds it replaces each caller id with one of its own, as peer-data-server does.
 *
 * Its own ids start with "-", so they sort before the hex ids peers make up: a peer that compared its own id
 * with a participant's server-given one, instead of the id the server gave it, would get the roles of
 * perfect negotiation wrong on both sides.
 */
export class Hub {
  readonly #rewriteIds: boolean;
  readonly #clients = new Set<Client>();
  /** Clients by the ids peers address them with. */
  readonly #byId = new Map<string, Client>();
  #nextId = 0;

  constructor({ rewriteIds = false } = {}) {
    this.#rewriteIds = rewriteIds;
  }

  /** Signaling for one more peer. */
  connect(): Signaling {
    const client: Client = { id: `-${String(this.#nextId++)}`, rooms: new Set(), listeners: new Set() };
    this.#clients.add(client);
    this.#byId.set(client.id, client);
    return {
      send: (event) => {
        this.#route(client, event);
      },
      subscribe: (listener) => {
        client.listeners.add(listener);
        return () => client.listeners.delete(listener);
      },
    };
  }

  #route(from: Client, sent: SignalingEvent): void {
    const event = this.#rewriteIds ? { ...sent, caller: { id: from.id } } : sent;
    if (!this.#rewriteIds) this.#byId.set(sent.caller.id, from);

    switch (event.type) {
      case 'CONNECT':
        from.rooms.add(event.room.id);
        this.#broadcast(from, event);
        break;
      case 'DISCONNECT':
        this.#broadcast(from, event);
        from.rooms.delete(event.room.id);
        break;
      default: {
        const to = this.#byId.get(event.callee.id);
        if (to) deliver(to, event);
      }
    }
  }

  #broadcast(from: Client, event: SignalingEvent): void {
    for (const client of this.#clients) {
      if (client !== from && client.rooms.has(event.room.id)) deliver(client, event);
    }
  }
}

function deliver(client: Client, message: unknown): void {
  const copy = structuredClone(message);
  setTimeout(() => {
    for (const listener of client.listeners) listener(copy);
  });
}
