import { EventDispatcher } from "peer-data";
import PeerClient, { PeerEventType } from "../clients/PeerClient";

export default class Peer {
  constructor(options) {
    if (!options) {
      throw new Error('cacheName option is required');
    }

    const { cacheName, servers, constraints, socket, timeoutAfter } = options;

    // cahce name to get the response from
    this.cacheName = cacheName;
    this.client = new PeerClient(servers, constraints, socket, timeoutAfter);

    this.getMiddleware = this.getMiddleware.bind(this);

    EventDispatcher.getInstance().register(PeerEventType.PEER, this._onPeerRequest.bind(this));
  }

  // Middleware factory function for fetch event
  getMiddleware(event) {
    const request = event.request.clone();

    return {
      get: async () => {
        // do not cache ranged responses
        // https://github.com/vardius/peer-cdn/issues/7
        if (request.headers.has("range")) {
          return null;
        }

        try {
          // this.match() will look for an entry in all of the peers available to the service worker.
          const response = await this.client.match(request);
          if (response) {
            return response;
          }

          return null;
        } catch (e) {
          return null;
        }
      }
    };
  }

  _onPeerRequest(e) {
    // caches.match() will look for a cache entry in all of the caches available to the service worker.
    caches.open(this.cacheName).then(cache => {
      cache.match(e.data).then(response => {
        if (response) {
          this.client.sendToRoom(e.room.id, response);
        }
      });
    });
  }
}
