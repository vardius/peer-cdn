import { CachePlugin, NetworkPlugin, PeerCDN, ordered } from 'peer-cdn';

// The folder the worker is served from, which is the site's base, absolute even when Vite's base is relative.
const base = new URL('./', location.href).pathname;

const cache = new CachePlugin();
const network = new NetworkPlugin();

new PeerCDN().GET(`${base}assets`, ordered, cache.getMiddleware, network.getMiddleware).register();
