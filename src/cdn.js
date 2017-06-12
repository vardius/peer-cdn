import { install, getActivate, getFetch } from "./handlers";
import Peers from "./peers";

export default class PeerCDN {
  // If at any point you want to force pages that use this service worker to start using a fresh
  // cache, then increment the cacheVersion value. It will kick off the service worker update
  // flow and the old cache(s) will be purged as part of the activate event handler when the
  // updated service worker is activated.
  constructor(cacheVersion) {
    this.currentCaches = { peerfetch: "peerfetch-cache-v" + cacheVersion };
    this.regex = /https:\/\/www.googleapis.com\/youtube\/v3\/playlistItems/; //todo extract to config
    this.peers = new Peers();

    this.register = this.register.bind(this);
    this.install = this.install.bind(this);
    this.activate = this.activate.bind(this);
    this.fetch = this.fetch.bind(this);
  }

  install() {
    return install;
  }

  activate() {
    return getActivate(this.currentCaches);
  }

  fetch() {
    return getFetch(this.currentCaches, this.regex, this.peers);
  }

  register(sw) {
    [this.install()].forEach(handler =>
      sw.addEventListener("install", handler)
    );

    [this.activate()].forEach(handler =>
      sw.addEventListener("activate", handler)
    );

    // fetch register events from array.
    // When an event occurs, they're invoked one at a time, in the order that they're registered.
    // As soon as one handler calls event.respondWith(), none of the other registered handlers will be run.
    [this.fetch()].forEach(handler => sw.addEventListener("fetch", handler));
  }
}
