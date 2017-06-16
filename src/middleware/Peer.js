import PeerData, { SocketChannel, AppEventType } from "peer-data";

export default class Peer {
  constructor(options) {
    this.peerData = new PeerData(options.servers, options.constraints);
    this.signaling = new SocketChannel();

    this.peerData.on(AppEventType.CHANNEL, this._onChannel.bind(this));
    // eslint-disable-next-line
    this.peerData.on(AppEventType.PEER, event => console.log(event));
    // eslint-disable-next-line
    this.peerData.on(AppEventType.ERROR, event => console.log(event));
    // eslint-disable-next-line
    this.peerData.on(AppEventType.LOG, event => console.log(event));

    this.match = this.match.bind(this);
    this.getFromPeer = this.getFromPeer.bind(this);
  }

  // Middleware factory function for fetch event
  getMiddleware(event) {
    return {
      get: () => {
        // match() will look for an entry in all of the seeds available to the service worker.
        return this.match(event.request).then(function(response) {
          if (response) {
            return response;
          }

          //todo: dawnload and seed response

          return null;
        });
      },
      put: response => {
        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have two streams.

        // eslint-disable-next-line
        const responseToSeed = response.clone();

        //todo: seed response
      }
    };
  }

  async match(request) {
    this.connect(request.url);
  }

  _connect(url) {
    this.peerData.connect(url);
  }

  _disconnect(url) {
    this.peerData.disconnect(url);
  }

  _send(url, chunk) {
    this.peerData.send(JSON.stringify({ url, chunk }));
  }

  _onChannel(e) {
    const url = e.room.id;
    const channel = e.data;

    channel.onmessage = event => {
      const data = JSON.parse(event.data);
      // eslint-disable-next-line
      console.log("Recieved chunk:", url, data.chunk);
    };
  }
}
