import PeerData, { SocketChannel } from "peer-data";

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
    this.rooms = {};
    this.peers = {};
    // Timeout after 1500 ms by default
    this.timeoutAfter = options.timeoutAfter || 1500;
    this.getMiddleware = this.getMiddleware.bind(this);
    this.connect = this.connect.bind(this);

    // setup peer client 
    this.peerData = new PeerData(
      options.servers || defaults.servers,
      options.constraints || defaults.constraints
    );
    // setup signaling channel
    this.signaling = new SocketChannel(
      options.socket || defaults.socket
    );
  }

  // Middleware factory function for fetch event
  getMiddleware(request) {
    return {
      get: async () => {
        try {
          // this.match() will look for an entry in all of the peers available to the service worker.
          const response = await this.match(request);
          if (response) {
            return response;
          }

          return null;
        } catch (e) {
          return null;
        }
      },
      put: response => { // todo: response -> ()
        // do not seed ranged responses
        // https://github.com/vardius/peer-cdn/issues/7
        if (request.headers.has("range")) {
          return;
        }

        // this.seed() will w8 for an response request
        // by other peers available to the service worker
        // and share response (taken from cache)
        this.seed(request.url, response); // todo: find response in cache, we do not want to store it in memory

        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the peer client consuming the response, we need
        // to clone it so we have two streams.
        return response.clone();
      }
    };
  }

  match(request) {
    return new Promise((resolve, reject) => {
      this.rooms[request.url].send({ isSeedRequest: true });
      this.peers[request.url].forEach(peer => peer.on("message", payload => {
        if (!payload.isChunk) {
          return;
        }

        resolve(payload);
      }));

      // Set up the timeout
      setTimeout(function () {
        reject('Promise timed out after ' + this.timeoutAfter + ' ms');
      }, this.timeoutAfter);
    });
  }

  seed(request, response) {
    this.peers[request.url].forEach(peer => peer.on("message", payload => {
      if (!payload.isSeedRequest) {
        return;
      }

      // find response in cache and seed it
      peer.send({ isChunk: true, response });
    }));
  }

  connect(request) {
    this.peers[request.url] = this.peers[request.url] || [];
    this.rooms[request.url] = this.rooms[request.url] || this.peerData.connect(request.url);

    this.rooms[request.url].on("participant", promise => {
      promise.then(peer => {
        this.peers[request.url].push(peer);

        // this peer disconnected from room
        peer.on("disconnected", () => {
          const index = this.peers[request.url].indexOf(peer);
          if (index > -1) {
            this.peers[request.url].splice(index, 1);
          }
        });

        // renegotiate if there was an error
        peer.on("error", () => peer.renegotiate());
      });
    });
  }
}
