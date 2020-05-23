import PeerData, { SocketChannel, EventDispatcher } from "peer-data";

const dispatcher = new EventDispatcher();
const defaults = {
  servers: {
    iceServers: [
      {
        // url: "stun:stun.1.google.com:19302"
        url: "stun:74.125.142.127:19302",
      },
    ],
  },
  constraints: {
    ordered: true,
  },
  socket: {
    jsonp: false,
  },
};

export const PeerEventType = { PEER: "PEER" };
export const EventDispatcher = dispatcher;

export default class PeerClient {
  constructor(
    servers = defaults.servers,
    constraints = defaults.constraints,
    socket = defaults.socket,
    timeoutAfter = 1500
  ) {
    // Timeout after 1500 ms by default
    this.timeoutAfter = timeoutAfter;
    this.match = this.match.bind(this);
    this.sendToRoom = this.sendToRoom.bind(this);
    this.createRoomId = this.createRoomId.bind(this);

    // setup peer client
    this.peerData = new PeerData(dispatcher, servers, constraints);
    // setup signaling channel
    this.signaling = new SocketChannel(dispatcher, socket);
  }

  match(request) {
    return new Promise((resolve, reject) => {
      const roomId = this.createRoomId();
      const room = this.peerData.connect(roomId);

      room.on("participant", function (peer) {
        peer.on("message", function (message) {
          if (!message) {
            return;
          }

          // todo: handle chunk request
          // https://github.com/vardius/peer-cdn/issues/7
          room.disconnect();
          resolve(message);
        });

        // renegotiate if there was an error
        peer.on("error", function () {
          peer.renegotiate();
        });
      });

      const url = new URL(request.url);
      dispatcher.dispatch("send", {
        type: PeerEventType.PEER,
        caller: null,
        callee: null,
        room: { id: roomId },
        data: url.pathname,
      });

      // Set up the timeout
      setTimeout(() => {
        room.disconnect();
        reject("Promise timed out after " + this.timeoutAfter + " ms");
      }, this.timeoutAfter);
    });
  }

  sendToRoom(roomId, response) {
    // signaling server needs us to seed
    // we will connected to a given room
    const room = this.peerData.connect(roomId);
    room.on("participant", (participant) =>
      participant.then(function (peer) {
        //this peer disconnected from room
        peer.on("disconnected", function () {
          room.disconnect();
        });
        // send the response
        peer.send(response);
      })
    );
  }

  createRoomId() {
    let dt = new Date().getTime();
    let uuid = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        let r = (dt + Math.random() * 16) % 16 | 0;
        dt = Math.floor(dt / 16);
        return (c == "x" ? r : (r & 0x3) | 0x8).toString(16);
      }
    );

    return uuid;
  }
}
