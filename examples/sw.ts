import { CachePlugin, DelegatePlugin, NetworkPlugin, PeerCDN, ordered } from 'peer-cdn';

// The folder this worker is served from, which is its scope: the site's pages and assets are below it.
const base = new URL('./', location.href).pathname;

const cache = new CachePlugin();
const peers = new DelegatePlugin();
const network = new NetworkPlugin();

// Pictures come from this browser's cache, then from other visitors, then from the server. What the peers or
// the server send is cached on the way, for this visitor and for the peers it shares with.
new PeerCDN().GET(`${base}assets`, ordered, cache.getMiddleware, peers.getMiddleware, network.getMiddleware).register();
