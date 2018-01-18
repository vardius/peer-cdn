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

    EventDispatcher.register(PeerEventType.PEER, this._onPeerRequest.bind(this));
  }

  // Middleware factory function for fetch event
  getMiddleware(request) {
    return {
      get: async () => {
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

      room.on("participant", promise => {
        promise.then(peer => {
          peer.on("message", payload => {
            if (!payload) {
              return;
            }

            // todo: handle chunk request
            // https://github.com/vardius/peer-cdn/issues/7
            room.disconnect();
            resolve(payload);
          });

          // renegotiate if there was an error
          peer.on("error", () => peer.renegotiate());
        });
      });

      EventDispatcher.dispatch("send", {
        type: PeerEventType.PEER,
        caller: null,
        callee: null,
        room: { id: roomId },
        data: request.clone(),
      });

      // Set up the timeout
      setTimeout(function () {
        room.disconnect();
        reject('Promise timed out after ' + this.timeoutAfter + ' ms');
      }, this.timeoutAfter);
    });
  }

  _onPeerRequest(e) {
    // caches.match() will look for a cache entry in all of the caches available to the service worker.
    caches.match(e.data).then(response => {
      if (response) {
        // signaling server needs us to seed
        // we will connected to a given room
        const room = this.peerData.connect(e.room.id);
        room.on("participant", promise => promise.then(peer => {
          //this peer disconnected from room
          peer.on("disconnected", () => room.disconnect());
          // send the response
          peer.send(response);
        }));
      }
    });
  }
}
