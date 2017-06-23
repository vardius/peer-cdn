import PeerData, { SocketChannel, AppEventType } from "peer-data";

export default class Peer {
  constructor(options) {
    const servers = options.servers || {
      iceServers: [
        {
          // url: "stun:stun.1.google.com:19302"
          url: "stun:74.125.142.127:19302"
        }
      ]
    };
    const constraints = options.constraints || {
      ordered: true
    };

    this.peerData = new PeerData(servers, constraints);
    this.signaling = new SocketChannel({ jsonp: false });

    this.peerData.on(AppEventType.CHANNEL, this._onChannel.bind(this));
    // eslint-disable-next-line
    this.peerData.on(AppEventType.PEER, event => console.log(event));
    // eslint-disable-next-line
    this.peerData.on(AppEventType.ERROR, event => console.log(event));
    // eslint-disable-next-line
    this.peerData.on(AppEventType.LOG, event => console.log(event));

    this.getFetchMiddleware = this.getFetchMiddleware.bind(this);
  }

  // Middleware factory function for fetch event
  getFetchMiddleware(request) {
    return {
      get: async () => {
        return null;
      },
      put: response => {
        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have two streams.

        // const responseToSeed = response.clone();

        // eslint-disable-next-line
        console.log(request, response);

        //todo: seed response
      }
    };
  }

  async match(request) {
    this._connect(request.url);
    //on connected ge

    return null;

    // const stream = new ReadableStream(
    //   {
    //     // start(controller) {
    //     //   /* there's more data */
    //     //   if (true) {
    //     //     controller.enqueue(/* your data here */);
    //     //   } else {
    //     //     controller.close();
    //     //   }
    //     // }
    //   }
    // );

    // return new Response(stream, {
    //   /* your content-type here */
    //   headers: { "content-type": "" }
    // });
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
