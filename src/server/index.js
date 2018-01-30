const os = require("os");
const SocketIO = require("socket.io");
const { SignalingEventType } = require("peer-data");

const PeerEventType = { PEER: "PEER" };

function PeerCdnServer(server, callback) {
  const io = SocketIO.listen(server);
  io.on("connection", function (socket) {
    function log() {
      socket.emit("log", ...arguments);
    }

    function onConnect(id) {
      socket.join(id);
    }

    function onDisconnect(id) {
      socket.leave(id);
    }

    socket.on("message", function (event) {
      event.caller = {
        id: socket.id
      };

      log("SERVER_LOG", event);

      switch (event.type) {
        case SignalingEventType.CONNECT:
          onConnect(event.room.id);
          socket.broadcast.to(event.room.id).emit("message", event);
          break;
        case SignalingEventType.DISCONNECT:
          onDisconnect(event.room.id);
          socket.broadcast.to(event.room.id).emit("message", event);
          break;
        case SignalingEventType.OFFER:
        case SignalingEventType.ANSWER:
        case SignalingEventType.CANDIDATE:
          socket.broadcast.to(event.callee.id).emit("message", event);
          break;
        case PeerEventType.PEER:
          // todo: we should pick best peer and ask only one socket to connect
          socket.broadcast.emit("message", event);
          break;
        default:
          if (callback) {
            callback(socket, event);
          } else {
            socket.broadcast.to(event.room.id).emit("message", event);
          }
      }
    });

    socket.on("ipaddr", function () {
      var ifaces = os.networkInterfaces();
      for (var dev in ifaces) {
        ifaces[dev].forEach(function (details) {
          if (details.family === "IPv4" && details.address !== "127.0.0.1") {
            socket.emit("ipaddr", details.address);
          }
        });
      }
    });

    socket.on("disconnect", function () {
      socket.broadcast.emit({
        type: SignalingEventType.DISCONNECT,
        caller: { id: socket.id },
        callee: null,
        room: null,
        data: null
      });
    });
  });
}

module.exports = PeerCdnServer;
