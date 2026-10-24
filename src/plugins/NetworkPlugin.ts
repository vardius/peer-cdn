import type { FetchEventLike, Middleware } from '../types.js';

/** Fetches from the network: the last middleware, for what no peer or cache has. */
export class NetworkPlugin {
  readonly getMiddleware = (event: FetchEventLike): Middleware => ({
    get: async () => {
      try {
        return await fetch(event.request);
      } catch {
        // Offline: nothing to answer with, which isn't a bug to report.
        return null;
      }
    },
  });
}
