import PeerData, {
  SocketChannel,
  AppEventType,
  EventDispatcher
} from "peer-data";

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

    this.peerData.on(AppEventType.CHANNEL, this._onChannel.bind(this));
    this.peerData.on(AppEventType.PEER, this._onPeer.bind(this));
    this.peerData.on(AppEventType.ERROR, this._onError.bind(this));
    this.peerData.on(AppEventType.LOG, this._onLog.bind(this));

    EventDispatcher.register(
      PeerEventType.PEER,
      this._onPeerRequest.bind(this)
    );
    EventDispatcher.register(PeerEventType.SEED, this._onSeed.bind(this));

    this.getMiddleware = this.getMiddleware.bind(this);
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
      this._requestPeer(request.url);
    });
  }

  _requestPeer(url) {
    this.dispatchEvent({
      type: PeerEventType.PEER,
      caller: null,
      callee: null,
      room: null,
      data: url
    });
  }

  // connect to room
  _connect(room) {
    this.peerData.connect(room);
  }

  // disconnec from room
  _disconnect(room) {
    this.peerData.disconnect(room);
  }

  // send data to peer
  _send(url, chunk) {
    this.peerData.send(JSON.stringify({ url, chunk }));
  }

  // start connection with seeder
  // or drop it
  _onSeed(e) {
    this._connect(e.room.id);
    // this.dispatchEvent({
    //   type: PeerEventType.DROP,
    //   caller: e.callee,
    //   callee: e.caller,
    //   room: e.room,
    //   data: e.data
    // });
  }

  // start connection with peer
  _onPeerRequest(e) {
    //check if i can seed
    const canSeed = true;
    if (canSeed) {
      const roomId = "a";
      this._connect(roomId); //todo generate random hash
      this.dispatchEvent({
        type: PeerEventType.SEED,
        caller: null,
        callee: e.caller,
        room: { id: roomId },
        data: e.data
      });
    }
  }

  // on RTCPeerConnection
  _onPeer(e) {
    // eslint-disable-next-line
    console.log(e);
  }

  //on RTCDataChannel
  _onChannel(e) {
    const url = e.room.id;
    const channel = e.data;

    // get data from seeder
    channel.onmessage = event => {
      const data = JSON.parse(event.data);
      // eslint-disable-next-line
      console.log("Recieved chunk:", url, data.chunk);
    };
  }

  // get logs from signaling server
  _onLog(e) {
    // eslint-disable-next-line
    console.log(e);
  }

  // get all errors
  _onError(e) {
    // eslint-disable-next-line
    console.log(e);
  }

  // dispatch event to socket channel
  dispatchEvent(event) {
    EventDispatcher.dispatch("send", event);
  }
}
