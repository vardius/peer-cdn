import { hasHash, matchesIntegrity } from '../integrity.js';
import { isFetchReply, toResponse, type FetchReply, type FetchRequest } from '../protocol.js';
import type { FetchEventLike, Middleware } from '../types.js';
import { UNCHECKED_HEADER, takesUnchecked } from '../unchecked.js';

/** How long a page has to acknowledge a request before the worker decides it doesn't run PeerPlugin. */
const ACK_TIMEOUT = 500;

/** The parts of a service worker's Client that DelegatePlugin uses. */
export interface ClientLike {
  postMessage(message: unknown, transfer: Transferable[]): void;
}

/** The parts of a service worker's clients that DelegatePlugin uses. */
export interface ClientsLike {
  get(id: string): Promise<ClientLike | undefined>;
  matchAll(options: { type: 'window' }): Promise<readonly ClientLike[]>;
}

export interface DelegatePluginOptions {
  /** How long to wait for the page's answer once it acknowledged the request, in ms. Defaults to 5000. */
  timeout?: number;
  /** The worker's clients. Defaults to the global clients. */
  clients?: ClientsLike;
}

/**
 * Asks a page to find the response among the peers, since service workers can't use WebRTC: the page that
 * made the request, or another open page of the site when it has none or that page has closed. The page runs
 * PeerPlugin, which answers. A page that doesn't acknowledge within half a second is passed over.
 *
 * It asks for any request that carries Subresource Integrity metadata, and drops a response that doesn't match
 * it. Without metadata, it asks for images, fonts, audio, video and text tracks only, and marks the response with
 * a Peer-CDN-Unchecked header, so CachePlugin gives it to no other request. It passes on every other request.
 */
export class DelegatePlugin {
  readonly #timeout: number;
  readonly #clients: ClientsLike | undefined;

  constructor({ timeout = 5000, clients }: DelegatePluginOptions = {}) {
    this.#timeout = timeout;
    this.#clients = clients;
  }

  readonly getMiddleware = (event: FetchEventLike): Middleware => ({
    get: () => this.#delegate(event),
  });

  async #delegate(event: FetchEventLike): Promise<Response | null> {
    const checked = hasHash(event.request.integrity);
    if (!checked && !takesUnchecked(event.request)) return null;

    const clients = this.#clients ?? (globalThis as unknown as { clients: ClientsLike }).clients;
    const client =
      (event.clientId === '' ? undefined : await clients.get(event.clientId)) ??
      (await clients.matchAll({ type: 'window' }))[0];
    if (!client) return null;

    const reply = await ask(client, event.request.url, this.#timeout);
    if (reply?.type !== 'response') return null;
    if (checked && !(await matchesIntegrity(event.request.integrity, reply.body))) return null;
    const headers: [string, string][] = checked ? reply.headers : [...reply.headers, [UNCHECKED_HEADER, '1']];
    return toResponse(reply.body, { ...reply, headers }) ?? null;
  }
}

/** Sends client a request for url, and resolves with its final reply, or undefined if none came in time. */
function ask(client: ClientLike, url: string, timeout: number): Promise<FetchReply | undefined> {
  const { port1, port2 } = new MessageChannel();
  return new Promise((resolve) => {
    const finish = (reply?: FetchReply): void => {
      clearTimeout(timer);
      port1.close();
      resolve(reply);
    };
    let timer = setTimeout(finish, ACK_TIMEOUT);
    port1.onmessage = ({ data }: MessageEvent<unknown>) => {
      if (!isFetchReply(data)) return;
      if (data.type !== 'ack') {
        finish(data);
        return;
      }
      clearTimeout(timer);
      timer = setTimeout(finish, timeout);
    };
    client.postMessage({ type: 'peer-cdn:fetch', url } satisfies FetchRequest, [port2]);
  });
}
