import { getInstall, getActivate, getFetch } from "./handlers";
import { Network, Cache, Peer } from "./middleware";

export default class PeerCDN {
  // If at any point you want to force pages that use this service worker to start using a fresh
  // cache, then increment the cacheVersion value. It will kick off the service worker update
  // flow and the old cache(s) will be purged as part of the activate event handler when the
  // updated service worker is activated.
  constructor(options) {
    this.regex = options.regex;
    this.cache = new Cache(options.cache);
    this.peers = new Peer(options.peer);
    this.network = new Network();

    this.register = this.register.bind(this);
    this.install = this.install.bind(this);
    this.activate = this.activate.bind(this);
    this.fetch = this.fetch.bind(this);

    //todo: manage middlewares for each event
    //todo: manage event handlers for each event
  }

  // Returns install event handler
  install(...middlewares) {
    return getInstall(middlewares);
  }

  // Returns activate event handler
  activate(...middlewares) {
    return getActivate(middlewares);
  }

  // Returns fetch event handler
  fetch(...middlewares) {
    return getFetch(this.regex)(middlewares);
  }

  // Register handlers for give service worker instance
  register(sw) {
    [this.install()].forEach(handler =>
      sw.addEventListener("install", handler)
    );

    [this.activate(this.cache.clearOldCaches)].forEach(handler =>
      sw.addEventListener("activate", handler)
    );

    // Register fetch events from array.
    // When an event occurs, they're invoked one at a time, in the order that they're registered.
    // As soon as one handler calls event.respondWith(), none of the other registered handlers will be run.
    [
      this.fetch(
        this.cache.getMiddleware,
        this.peers.getMiddleware,
        this.network.getMiddleware
      )
    ].forEach(handler => sw.addEventListener("fetch", handler));
  }
}
