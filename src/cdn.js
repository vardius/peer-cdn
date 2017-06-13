import { getInstall, getActivate, getFetch } from "./handlers";
import { getFromNetwork, getPartialResponse, Cache, Peers } from "./middleware";

export default class PeerCDN {
  // If at any point you want to force pages that use this service worker to start using a fresh
  // cache, then increment the cacheVersion value. It will kick off the service worker update
  // flow and the old cache(s) will be purged as part of the activate event handler when the
  // updated service worker is activated.
  constructor(cacheVersion) {
    this.regex = null; //todo extract to config
    this.peers = new Peers();
    this.cache = new Cache(cacheVersion);

    this.register = this.register.bind(this);
    this.install = this.install.bind(this);
    this.activate = this.activate.bind(this);
    this.fetch = this.fetch.bind(this);
  }

  install(...middlewares) {
    return getInstall(middlewares);
  }

  activate(...middlewares) {
    return getActivate(middlewares);
  }

  fetch(...middlewares) {
    return getFetch(this.regex)(middlewares);
  }

  register(sw) {
    [this.install()].forEach(handler =>
      sw.addEventListener("install", handler)
    );

    [this.activate(this.cache.clearOldCaches)].forEach(handler =>
      sw.addEventListener("activate", handler)
    );

    // fetch register events from array.
    // When an event occurs, they're invoked one at a time, in the order that they're registered.
    // As soon as one handler calls event.respondWith(), none of the other registered handlers will be run.
    [
      this.fetch(
        this.cache.getFromCache,
        this.peers.getFromPeer,
        getFromNetwork,
        getPartialResponse,
        this.cache.saveToCache
      )
    ].forEach(handler => sw.addEventListener("fetch", handler));
  }
}
