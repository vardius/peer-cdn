import PeerData, { SocketChannel, AppEventType } from "peer-data";

export default class Peers {
  constructor(options) {
    this.peerData = new PeerData(options.servers, options.constraints);
    this.signaling = new SocketChannel();

    this.peerData.on(AppEventType.CHANNEL, this._onChannel.bind(this));
    this.peerData.on(AppEventType.PEER, event => console.log(event));
    this.peerData.on(AppEventType.ERROR, event => console.log(event));
    this.peerData.on(AppEventType.LOG, event => console.log(event));

    this.match = this.match.bind(this);
    this.getFromPeer = this.getFromPeer.bind(this);
  }

  async match(request) {
    this.connect(request.url);
  }

  getFromPeer(event) {
    return async res => {
      if (res) {
        return res;
      }

      const response = await this.match(event.request);
      if (response) {
        return response;
      }

      return null;
    };
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
      console.log("Recieved chunk:", url, data.chunk);
    };
  }
}
