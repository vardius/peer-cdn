import { getInstall, getActivate, getFetch } from "./handlers";
import { Network, Peer } from "./plugins";

export default class PeerCDN {
  // If at any point you want to force pages that use this service worker to start using a fresh
  // cache, then increment the cacheVersion value. It will kick off the service worker update
  // flow and the old cache(s) will be purged as part of the activate event handler when the
  // updated service worker is activated.
  constructor(options) {
    this.regex = options.regex || null;
    this.installMiddleware = options.install || [];
    this.activateMiddleware = options.activate || [];
    this.fetchMiddleware = options.fetch || [];

    this.peers = new Peer(options.peer);
    this.network = new Network(options.network);

    this.register = this.register.bind(this);
    this.install = this.install.bind(this);
    this.activate = this.activate.bind(this);
    this.fetch = this.fetch.bind(this);
  }

  // Returns install event handler
  install() {
    return getInstall(this.installMiddleware);
  }

  // Returns activate event handler
  activate() {
    return getActivate(this.activateMiddleware);
  }

  // Returns fetch event handler
  fetch() {
    const middlewares = this.fetchMiddleware.concat([
      this.peers.getFetchMiddleware,
      this.network.getFetchMiddleware
    ]);

    return getFetch(this.regex)(middlewares);
  }

  // Register handlers for give service worker instance
  register(sw) {
    [this.install()].forEach(h => sw.addEventListener("install", h));
    [this.activate()].forEach(h => sw.addEventListener("activate", h));
    // Register fetch events from array.
    // When an event occurs, they're invoked one at a time, in the order that they're registered.
    // As soon as one handler calls event.respondWith(), none of the other registered handlers will be run.
    [this.fetch()].forEach(h => sw.addEventListener("fetch", h));
  }
}
