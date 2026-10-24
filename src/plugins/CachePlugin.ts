import { hasHash, matchesIntegrity } from '../integrity.js';
import { cacheControl } from '../protocol.js';
import { partialResponse } from '../range.js';
import type { FetchEventLike, Middleware } from '../types.js';
import { UNCHECKED_HEADER, takesUnchecked } from '../unchecked.js';

export interface CachePluginOptions {
  /** The cache to keep responses in. PeerPlugin must use the same name to share them. Defaults to "peer-cdn". */
  cacheName?: string;
}

/**
 * Answers from a cache, and keeps the responses other middleware find. A Range request gets its part of the
 * cached response. Only whole 200 responses are kept, and none marked no-store. A cached body that doesn't match
 * the request's Subresource Integrity metadata is deleted, and the request passed on. A peer's response that
 * DelegatePlugin couldn't check, for an image or the like, answers only requests for images, fonts and media.
 */
export class CachePlugin {
  readonly cacheName: string;

  constructor({ cacheName = 'peer-cdn' }: CachePluginOptions = {}) {
    this.cacheName = cacheName;
  }

  readonly getMiddleware = (event: FetchEventLike): Middleware => ({
    get: async () => {
      const cache = await caches.open(this.cacheName);
      const cached = await cache.match(event.request);
      if (!cached) return null;
      // A body that fails the request's integrity, such as a visitor's that nothing checked when it was kept, or
      // an older file at the same URL, would fail the request on every visit: drop it, for the next middleware.
      const { integrity } = event.request;
      if (hasHash(integrity)) {
        if (!(await matchesIntegrity(integrity, await cached.clone().arrayBuffer()))) {
          await cache.delete(event.request);
          return null;
        }
      } else if (cached.headers.has(UNCHECKED_HEADER) && !takesUnchecked(event.request)) {
        // A script or a fetch of the same URL would run or use what a peer sent: it goes to the next middleware.
        return null;
      }
      const range = event.request.headers.get('Range');
      if (range === null) return cached;
      return (await partialResponse(range, cached)) ?? cached;
    },
    put: async (response) => {
      if (response.status !== 200 || cacheControl(response).has('no-store')) return;
      const cache = await caches.open(this.cacheName);
      await cache.put(event.request, response);
    },
  });
}
