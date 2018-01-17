import { getInstall, getActivate, getFetch } from "./listeners";
import Router from "./router";
import * as methods from "methods";

export default class PeerCDN {
  // If at any point you want to force pages that use this service worker to start using a fresh
  // cache, then increment the cacheVersion value. It will kick off the service worker update
  // flow and the old cache(s) will be purged as part of the activate event handler when the
  // updated service worker is activated.
  constructor() {
    this.router = new Router();
    this.register = this.register.bind(this);
    this.all = this.all.bind(this);

    // Will generate functions per HTTP method
    methods.forEach(method => {
      PeerCDN.prototype[method] = (...args) => {
        this.router.use(method, ...args);
      };
    });
  }

  // Register middlewares for a all methods and given route path with one of stategies
  all(...args) {
    methods.forEach(method => this.router.use(method, ...args));
  }

  // Register handlers for given service worker instance
  register() {
    [getInstall()].forEach(h => self.addEventListener("install", h));
    [getActivate()].forEach(h => self.addEventListener("activate", h));
    // Register fetch events from array.
    // When an event occurs, they're invoked one at a time, in the order that they're registered.
    // As soon as one handler calls event.respondWith(), none of the other registered handlers will be run.
    [getFetch(this.router)].forEach(h => self.addEventListener("fetch", h));
  }
}
