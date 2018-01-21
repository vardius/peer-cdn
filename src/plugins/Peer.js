import PeerData, { SocketChannel, EventDispatcher } from "peer-data";

const PeerEventType = { PEER: "PEER" };
const defaults = {
  servers: {
    iceServers: [
      {
        // url: "stun:stun.1.google.com:19302"
        url: "stun:74.125.142.127:19302"
      }
    ]
  },
  constraints: {
    ordered: true
  },
  socket: {
    jsonp: false
  }
};

export default class Peer {
  constructor(options) {
    // cahce name to get the response from
    this.cacheName = options.cacheName;
    // Timeout after 1500 ms by default
    this.timeoutAfter = options.timeoutAfter || 1500;
    this.getMiddleware = this.getMiddleware.bind(this);
    this._match = this._match.bind(this);

    // setup peer client 
    this.peerData = new PeerData(
      options.servers || defaults.servers,
      options.constraints || defaults.constraints
    );
    // setup signaling channel
    this.signaling = new SocketChannel(
      options.socket || defaults.socket
    );

    EventDispatcher.getInstance().register(PeerEventType.PEER, this._onPeerRequest.bind(this));
  }

  // Middleware factory function for fetch event
  getMiddleware(request) {
    return {
      get: async () => {
        // do not cache ranged responses
        // https://github.com/vardius/peer-cdn/issues/7
        if (request.headers.has("range")) {
          return null;
        }

        try {
          // this._match() will look for an entry in all of the peers available to the service worker.
          const response = await this._match(request);
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

  _match(request) {
    return new Promise((resolve, reject) => {
      const roomId = '';
      const room = this.peerData.connect(roomId);

      room.on("participant", function (participant) {
        participant.then(peer => {
          peer.on("message", function (payload) {
            if (!payload) {
              return;
            }

            // todo: handle chunk request
            // https://github.com/vardius/peer-cdn/issues/7
            room.disconnect();
            resolve(payload);
          });

          // renegotiate if there was an error
          peer.on("error", function () { peer.renegotiate(); });
        });
      });

      const url = new URL(request.url);
      EventDispatcher.getInstance().dispatch("send", {
        type: PeerEventType.PEER,
        caller: null,
        callee: null,
        room: { id: roomId },
        data: url.pathname,
      });

      // Set up the timeout
      setTimeout(() => {
        room.disconnect();
        reject('Promise timed out after ' + this.timeoutAfter + ' ms');
      }, this.timeoutAfter);
    });
  }

  _onPeerRequest(e) {
    // caches.match() will look for a cache entry in all of the caches available to the service worker.
    caches.open(this.cacheName).then(cache => {
      cache.match(e.data).then(response => {
        if (response) {
          // signaling server needs us to seed
          // we will connected to a given room
          const room = this.peerData.connect(e.room.id);
          room.on("participant", participant => participant.then(function (peer) {
            //this peer disconnected from room
            peer.on("disconnected", function () { room.disconnect() });
            // send the response
            peer.send(response);
          }));
        }
      });
    });
  }
}
