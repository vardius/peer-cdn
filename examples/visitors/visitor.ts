import { PeerPlugin, type PeerPluginOptions } from 'peer-cdn';

/** Where a visitor got a file from. */
export type Source = 'cache' | 'peers' | 'server';

export interface Loaded {
  response: Response;
  from: Source;
}

/**
 * A visitor of a site, in one page: it loads files as peer-cdn's worker would, from its cache, then from the
 * other visitors, then from the server, keeping what it loads, and shares its cache with the other visitors.
 * The site's demo runs two in one page, each with a cache of its own, where a real site has one per browser.
 */
export function visit(options: PeerPluginOptions & { cacheName: string }) {
  const { cacheName } = options;
  const plugin = new PeerPlugin(options);

  return {
    /** Loads url, and says where it came from. */
    load: async (url: string): Promise<Loaded> => {
      const cache = await caches.open(cacheName);
      const cached = await cache.match(url);
      if (cached) return { response: cached, from: 'cache' };
      const fromPeers = await plugin.fetch(url);
      const response = fromPeers ?? (await fetch(url));
      if (response.status === 200) await cache.put(url, response.clone());
      return { response, from: fromPeers ? 'peers' : 'server' };
    },
    /** Empties this visitor's cache, as clearing site data would. */
    forget: async (): Promise<void> => {
      await caches.delete(cacheName);
    },
    leave: (): void => {
      plugin.close();
    },
  };
}
