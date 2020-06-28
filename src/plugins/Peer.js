import PeerClient, { Dispatcher, PeerEventType } from "../clients/PeerClient";

export default class Peer {
  constructor(options) {
    if (!options) {
      throw new Error("cacheName option is required");
    }

    const { cacheName, servers, constraints, socket, timeoutAfter } = options;

    // cache name to get the response from
    this.cacheName = cacheName;
    this.client = new PeerClient(servers, constraints, socket, timeoutAfter);

    this.getMiddleware = this.getMiddleware.bind(this);

    Dispatcher.register(PeerEventType.PEER, this._onPeerRequest.bind(this));
  }

  // Middleware factory function for fetch event
  getMiddleware(event) {
    const request = event.request.clone();

    return {
      get: async () => {
        try {
          // this.match() will look for an entry in all of the peers available to the service worker.
          const response = await this.client.match(request);
          if (response) {
            return response;
          }

          return null;
        } catch (e) {
          if (process.env.NODE_ENV !== "production") {
            // eslint-disable-next-line no-console
            console.error("PeerPlugin: get error: ", e);
          }
          return null;
        }
      },
    };
  }

  async _onPeerRequest(e) {
    // caches.match() will look for a cache entry in all of the caches available to the service worker.
    const cache = await caches.open(this.cacheName);
    const response = await cache.match(e.data);
    if (response) {
      this.client.sendToRoom(e.room.id, response);
    }
  }
}
