import PeerData, { SocketChannel, EventDispatcher } from "peer-data";

const PeerEventType = { SEED: "SEED", PEER: "PEER", DROP: "DROP" };

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
    this.promises = [];

    this.getMiddleware = this.getMiddleware.bind(this);

    this.peerData.onConnection(this._onConnection.bind(this));
    EventDispatcher.register(PeerEventType.PEER, this._onPeer.bind(this));
    EventDispatcher.register(PeerEventType.SEED, this._onSeed.bind(this));
    EventDispatcher.register(PeerEventType.DROP, this._onDrop.bind(this));
  }

  // Middleware factory function for fetch event
  getMiddleware(request) {
    return {
      get: () => {
        return this.match(request);
      },
      put: response => {
        // eslint-disable-next-line
        console.log(response);
      }
    };
  }

  match(request) {
    return new Promise((resolve, reject) => {
      // do something asynchronous which eventually calls either:
      //
      //   resolve(someValue); // fulfilled
      // or
      //   reject("failure reason"); // rejected
      this.promises[request.url] = { resolve, reject };

      this.dispatchEvent({
        type: PeerEventType.PEER,
        caller: null,
        callee: null,
        room: null,
        data: request.url
      });
    });
  }

  // some peer needs seeders
  // lets offer us if we have a resource
  _onPeer(e) {
    //check if i can seed
    const canSeed = true;
    if (canSeed) {
      const roomId = "a";
      this.peerData.connect(roomId); //todo generate random hash
      this.dispatchEvent({
        type: PeerEventType.SEED,
        caller: null,
        callee: e.caller,
        room: { id: roomId },
        data: e.data
      });
    }
  }

  // we got seeder offer
  // pick him or drop him
  _onSeed(e) {
    this.peerData.connect(e.room.id);
    // this.dispatchEvent({
    //   type: PeerEventType.DROP,
    //   caller: e.callee,
    //   callee: e.caller,
    //   room: e.room,
    //   data: e.data
    // });
  }

  // peer doesn't want us to seed for him
  _onDrop(e) {
    this.peerData.disconnect(e.room.id);
  }

  // on RTCPeerConnection || RTCDataChannel
  _onConnection(promise) {
    // eslint-disable-next-line
    console.log(promise);

    promise.then(({ channel, room, caller, peer }) => {
      // get data from seeder
      channel.onmessage = event => {
        const data = JSON.parse(event.data);
        // eslint-disable-next-line
        console.log("Recieved chunk:", url, data.chunk);
      };

      // // send message
      // if (channel.readyState === "open") {
      //   channel.send(data);
      // }
    });
  }

  // dispatch event to socket channel
  dispatchEvent(event) {
    EventDispatcher.dispatch("send", event);
  }
}
