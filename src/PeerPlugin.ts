import { PeerData, type Participant, type Room, type Signaling } from 'peer-data';
import {
  cacheControl,
  isFetchRequest,
  metaOf,
  parsePeerMessage,
  toResponse,
  type FetchReply,
  type PeerMessage,
  type ResponseMeta,
} from './protocol.js';

/** Bodies go to peers in pieces this big, which every browser's data channel carries. */
const CHUNK = 16 * 1024;

/** How much a data channel may buffer before sending waits: Chromium refuses a send past 16 MiB. */
const BUFFER_LOW = 1024 * 1024;

/** How many bodies a page sends at once, to all its peers together: each is held whole while it goes. */
const MAX_SENDING = 4;

/** How long a peer may take no more of a body before the page stops sending it, in ms. */
const STALL = 10_000;

export interface PeerPluginOptions {
  /** How this page reaches the other visitors' pages: a SocketChannel to your signaling server, usually. */
  signaling: Signaling;
  /** The cache whose responses this page shares: the CachePlugin's. Defaults to "peer-cdn". */
  cacheName?: string;
  /** The room the peers meet in. Defaults to "peer-cdn". */
  room?: string;
  /** Passed to every RTCPeerConnection: ICE servers and the rest. */
  configuration?: RTCConfiguration;
  /** How long to look for a response among the peers before giving up, in ms. Defaults to 3000. */
  timeout?: number;
  /** The largest body to send or accept, in bytes. Defaults to 2 MiB. */
  maxSize?: number;
  /** Called with the number of connected peers whenever it changes. */
  onPeers?: (count: number) => void;
}

/** A search for one URL among the peers. */
interface Lookup {
  readonly url: string;
  /** Peers asked whether they have it that haven't answered yet. */
  readonly waiting: Set<Participant>;
  /** Peers that have it, not yet asked to send it. */
  readonly holders: Participant[];
  /** The peer asked to send it, or waiting its turn to be asked. */
  source: Participant | undefined;
  readonly timer: ReturnType<typeof setTimeout>;
  readonly resolve: (response: Response | null) => void;
}

/** A body arriving from a peer: the binary messages after its response message. */
interface Incoming {
  readonly id: number;
  readonly meta: ResponseMeta;
  readonly size: number;
  /** False for a body nobody waits for any more, which is read only to keep the messages after it in line. */
  readonly keep: boolean;
  readonly chunks: ArrayBuffer[];
  received: number;
}

/**
 * The page side of peer-cdn. It joins the other visitors' pages over WebRTC, shares the responses in its cache
 * with them, and finds responses among them for the service worker's DelegatePlugin.
 *
 * It shares only same-origin 200 responses that aren't marked private or no-store.
 */
export class PeerPlugin {
  readonly #peer: PeerData;
  readonly #room: Room;
  readonly #cacheName: string;
  readonly #timeout: number;
  readonly #maxSize: number;
  readonly #onPeers: ((count: number) => void) | undefined;
  /** Peers whose data channel is open. */
  readonly #connected = new Set<Participant>();
  readonly #lookups = new Map<number, Lookup>();
  readonly #incoming = new Map<Participant, Incoming>();
  /**
   * The peers this page is getting bodies from: for each, the lookup whose body it's sending, then those waiting
   * their turn. A page asks each peer for one body at a time, so no data channel buffers more than one: the first
   * stays until its body has arrived, even once its lookup has settled or moved on to another peer.
   */
  readonly #getting = new Map<Participant, number[]>();
  /**
   * The peers this page is sending a body to now: each one at a time, as a page asks for them. A peer that left
   * stays until its body is let go, so it counts toward MAX_SENDING as long as the body is held.
   */
  readonly #sending = new Set<Participant>();
  #nextId = 0;
  #closed = false;

  constructor(options: PeerPluginOptions) {
    this.#cacheName = options.cacheName ?? 'peer-cdn';
    this.#timeout = options.timeout ?? 3000;
    this.#maxSize = options.maxSize ?? 2 * 1024 * 1024;
    this.#onPeers = options.onPeers;
    this.#peer = new PeerData(options.signaling, options.configuration ? { configuration: options.configuration } : {});
    this.#room = this.#peer.connect(options.room ?? 'peer-cdn');
    this.#room.on('participant', this.#onParticipant);

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', this.#onWorkerMessage);
      // Messages from the worker wait until a page starts them.
      navigator.serviceWorker.startMessages();
    }
  }

  /** The number of peers this page is connected to now. */
  get peers(): number {
    return this.#connected.size;
  }

  /**
   * Asks the connected peers for url, and resolves with the response of the first that has it, or with null
   * when none has it or the time runs out.
   */
  fetch(url: string): Promise<Response | null> {
    const asked = [...this.#connected];
    if (this.#closed || asked.length === 0) return Promise.resolve(null);

    const id = this.#nextId++;
    const href = new URL(url, location.href).href;
    return new Promise((resolve) => {
      this.#lookups.set(id, {
        url: href,
        waiting: new Set(asked),
        holders: [],
        source: undefined,
        resolve,
        timer: setTimeout(() => {
          this.#finish(id, null);
        }, this.#timeout),
      });
      for (const participant of asked) this.#send(participant, { type: 'has', id, url: href });
    });
  }

  /** Leaves the peers, and stops answering the worker. Lookups in progress resolve with null. */
  close(): void {
    if (this.#closed) return;
    this.#closed = true;
    if ('serviceWorker' in navigator) navigator.serviceWorker.removeEventListener('message', this.#onWorkerMessage);
    // Nothing more to ask any peer for.
    this.#getting.clear();
    for (const id of [...this.#lookups.keys()]) this.#finish(id, null);
    this.#peer.close();
  }

  readonly #onParticipant = (participant: Participant): void => {
    participant
      .on('connected', () => {
        this.#connected.add(participant);
        this.#onPeers?.(this.#connected.size);
      })
      .on('message', (data) => {
        if (typeof data === 'string') this.#receive(participant, data);
        else this.#receiveChunk(participant, data);
      })
      .on('disconnected', () => {
        this.#leave(participant);
      });
  };

  readonly #onWorkerMessage = (event: MessageEvent<unknown>): void => {
    const [port] = event.ports;
    if (!port || !isFetchRequest(event.data)) return;
    port.postMessage({ type: 'ack' } satisfies FetchReply);
    void this.#answerWorker(port, event.data.url);
  };

  async #answerWorker(port: MessagePort, url: string): Promise<void> {
    const response = await this.fetch(url);
    if (!response) {
      port.postMessage({ type: 'miss' } satisfies FetchReply);
      return;
    }
    const body = await response.arrayBuffer();
    port.postMessage({ type: 'response', body, ...metaOf(response) } satisfies FetchReply, [body]);
  }

  #receive(from: Participant, data: string): void {
    const message = parsePeerMessage(data);
    if (!message) return;
    switch (message.type) {
      case 'has':
        void this.#answerHas(from, message.id, message.url);
        return;
      case 'get':
        void this.#answerGet(from, message.id, message.url);
        return;
      case 'have':
        this.#onHave(from, message.id);
        return;
      case 'miss':
        this.#onMiss(from, message.id);
        return;
      case 'gone':
        this.#onGone(from, message.id);
        return;
      case 'response':
        this.#onResponse(from, message);
        return;
    }
  }

  // Answering other peers.

  async #answerHas(from: Participant, id: number, url: string): Promise<void> {
    const found = await this.#find(url);
    this.#send(from, { type: found ? 'have' : 'miss', id });
  }

  async #answerGet(from: Participant, id: number, url: string): Promise<void> {
    // A page asks a peer for its next body only once the last arrived: more at once would hold a body each.
    if (this.#sending.has(from) || this.#sending.size >= MAX_SENDING) {
      this.#send(from, { type: 'gone', id });
      return;
    }
    this.#sending.add(from);
    try {
      await this.#sendBody(from, id, url);
    } finally {
      this.#sending.delete(from);
    }
  }

  async #sendBody(to: Participant, id: number, url: string): Promise<void> {
    const found = await this.#find(url);
    const body = await found?.body.arrayBuffer().catch(() => undefined);
    if (!found || !body) {
      this.#send(to, { type: 'gone', id });
      return;
    }
    if (!this.#send(to, { type: 'response', id, size: body.byteLength, ...found.meta })) return;
    try {
      for (let offset = 0; offset < body.byteLength; offset += CHUNK) {
        if (!(await drained(to.channel))) {
          // It stopped reading, or left: the page asking moves on once the rest of what was sent reaches it.
          this.#send(to, { type: 'gone', id });
          return;
        }
        to.send(new Uint8Array(body, offset, Math.min(CHUNK, body.byteLength - offset)));
      }
    } catch {
      // It disconnected part-way: the page asking moves on when it sees the peer leave or its time runs out.
    }
  }

  /** The response this page shares for url, if it has one no larger than maxSize. */
  async #find(url: string): Promise<{ meta: ResponseMeta; body: Blob } | undefined> {
    try {
      if (new URL(url, location.href).origin !== location.origin) return undefined;
      const cache = await caches.open(this.#cacheName);
      const response = await cache.match(url);
      if (!response || response.status !== 200) return undefined;
      const directives = cacheControl(response);
      if (directives.has('private') || directives.has('no-store')) return undefined;
      // Sized before its bytes are copied out to send.
      const body = await response.blob();
      return body.size > this.#maxSize ? undefined : { meta: metaOf(response), body };
    } catch {
      // A URL that doesn't parse, or no cache storage, as in some private windows: nothing to share.
      return undefined;
    }
  }

  // Finding responses among the peers.

  #onHave(from: Participant, id: number): void {
    const lookup = this.#lookups.get(id);
    if (!lookup?.waiting.delete(from)) return;
    if (lookup.source) lookup.holders.push(from);
    else this.#request(id, lookup, from);
  }

  #onMiss(from: Participant, id: number): void {
    const lookup = this.#lookups.get(id);
    if (!lookup?.waiting.delete(from)) return;
    this.#settleIfDone(id, lookup);
  }

  #onGone(from: Participant, id: number): void {
    if (this.#getting.get(from)?.[0] !== id) return;
    // A body it stopped sending part-way.
    if (this.#incoming.get(from)?.id === id) this.#incoming.delete(from);
    this.#failed(from, id);
  }

  #onResponse(from: Participant, message: Extract<PeerMessage, { type: 'response' }>): void {
    const { id, size, status } = message;
    const lookup = this.#asking(from, id);
    // Peers share only 200 responses: anything else isn't one to pass on.
    const keep = lookup !== undefined && status === 200 && size <= this.#maxSize;
    this.#incoming.set(from, { id, meta: message, size, keep, chunks: [], received: 0 });
    // The lookup moves on, while the peer sends the rest.
    if (lookup && !keep) this.#next(id, lookup);
    if (size === 0) this.#complete(from);
  }

  #receiveChunk(from: Participant, data: ArrayBuffer): void {
    const incoming = this.#incoming.get(from);
    if (!incoming) return;
    incoming.received += data.byteLength;
    if (incoming.keep) incoming.chunks.push(data);
    if (incoming.received < incoming.size) return;
    if (incoming.received === incoming.size) {
      this.#complete(from);
      return;
    }
    // More than it announced: the body can't be trusted.
    this.#incoming.delete(from);
    this.#failed(from, incoming.id);
  }

  #complete(from: Participant): void {
    const incoming = this.#incoming.get(from);
    this.#incoming.delete(from);
    if (!incoming) return;
    const lookup = incoming.keep ? this.#asking(from, incoming.id) : undefined;
    this.#arrived(from, incoming.id);
    if (!lookup) return;
    const response = toResponse(new Blob(incoming.chunks), incoming.meta);
    if (response) this.#finish(incoming.id, response);
    else this.#next(incoming.id, lookup);
  }

  /** From sends no more of the body for id, which didn't come whole: its lookup moves on to the next peer. */
  #failed(from: Participant, id: number): void {
    const lookup = this.#asking(from, id);
    this.#arrived(from, id);
    if (lookup) this.#next(id, lookup);
  }

  /** The lookup id, if from is sending its body for it now. */
  #asking(from: Participant, id: number): Lookup | undefined {
    const lookup = this.#getting.get(from)?.[0] === id ? this.#lookups.get(id) : undefined;
    return lookup?.source === from ? lookup : undefined;
  }

  /** Asks from for the body, now or once from has sent the body it's sending. */
  #request(id: number, lookup: Lookup, from: Participant): void {
    lookup.source = from;
    const queue = this.#getting.get(from);
    if (queue) {
      queue.push(id);
      return;
    }
    this.#getting.set(from, [id]);
    this.#get(from, id, lookup);
  }

  #get(from: Participant, id: number, lookup: Lookup): void {
    if (!this.#send(from, { type: 'get', id, url: lookup.url })) this.#next(id, lookup);
  }

  /** From has sent all it will of the body for id: the next lookup in line asks it for its body. */
  #arrived(from: Participant, id: number): void {
    const queue = this.#getting.get(from);
    if (queue?.[0] !== id) return;
    queue.shift();
    // Not queue[0], which still reads as the id just shifted to the type checker.
    const next = queue.at(0);
    const lookup = next === undefined ? undefined : this.#lookups.get(next);
    if (next === undefined || !lookup) this.#getting.delete(from);
    else this.#get(from, next, lookup);
  }

  /** Lookup id stops waiting for its source, which it leaves the line for unless the source is sending its body. */
  #drop(id: number, lookup: Lookup): void {
    const queue = lookup.source && this.#getting.get(lookup.source);
    lookup.source = undefined;
    const index = queue ? queue.indexOf(id) : -1;
    if (queue && index > 0) queue.splice(index, 1);
  }

  /** Moves on to the next peer that has it, after the one sending it failed. */
  #next(id: number, lookup: Lookup): void {
    this.#drop(id, lookup);
    const holder = lookup.holders.shift();
    if (holder) this.#request(id, lookup, holder);
    else this.#settleIfDone(id, lookup);
  }

  #settleIfDone(id: number, lookup: Lookup): void {
    if (!lookup.source && lookup.holders.length === 0 && lookup.waiting.size === 0) this.#finish(id, null);
  }

  #finish(id: number, response: Response | null): void {
    const lookup = this.#lookups.get(id);
    if (!lookup) return;
    this.#lookups.delete(id);
    clearTimeout(lookup.timer);
    this.#drop(id, lookup);
    lookup.resolve(response);
  }

  #leave(participant: Participant): void {
    if (this.#connected.delete(participant)) this.#onPeers?.(this.#connected.size);
    this.#incoming.delete(participant);
    this.#getting.delete(participant);
    for (const [id, lookup] of this.#lookups) {
      lookup.waiting.delete(participant);
      const index = lookup.holders.indexOf(participant);
      if (index !== -1) lookup.holders.splice(index, 1);
      if (lookup.source === participant) this.#next(id, lookup);
      else this.#settleIfDone(id, lookup);
    }
  }

  /** Sends message to participant, and reports whether it could. */
  #send(participant: Participant, message: PeerMessage): boolean {
    try {
      participant.send(JSON.stringify(message));
      return true;
    } catch {
      // It disconnected: its disconnected event settles what waited for it.
      return false;
    }
  }
}

/**
 * Resolves with true once channel buffers little enough to take more, or with false once it closes or takes no
 * more for STALL ms.
 */
function drained(channel: RTCDataChannel): Promise<boolean> {
  if (channel.readyState !== 'open') return Promise.resolve(false);
  if (channel.bufferedAmount <= BUFFER_LOW) return Promise.resolve(true);
  channel.bufferedAmountLowThreshold = BUFFER_LOW;
  return new Promise((resolve) => {
    const done = (event?: Event): void => {
      clearTimeout(timer);
      channel.removeEventListener('bufferedamountlow', done);
      channel.removeEventListener('close', done);
      resolve(event?.type === 'bufferedamountlow');
    };
    const timer = setTimeout(done, STALL);
    channel.addEventListener('bufferedamountlow', done);
    channel.addEventListener('close', done);
  });
}
