import express from "express";
import fspath from "path";
import cookieParser from "cookie-parser";
import http from "http";
import os from "os";
import socketIO from "socket.io";

const port = process.env.PORT || 3000;
const index = fspath.join(__dirname, "index.html");
const SocketEventType = {
  CONNECT: "CONNECT",
  DISCONNECT: "DISCONNECT",
  CANDIDATE: "CANDIDATE",
  OFFER: "OFFER",
  ANSWER: "ANSWER"
};

const app = express();
app.get("/favicon.ico", (req, res) => {
  res.sendStatus(404);
});
app.use("/css", express.static(fspath.join(__dirname, "css")));
app.use("/js", express.static(fspath.join(__dirname, "js")));
app.use("/vendor", express.static(fspath.join(__dirname, "./../dist")));
app.use(cookieParser());
app.get("*", (req, res) => {
  res.sendFile(index);
});

const server = http.createServer(app);
const io = socketIO.listen(server);
io.on("connection", function(socket) {
  function log() {
    socket.emit("log", ...arguments);
  }

  function onConnect(id) {
    // eslint-disable-next-line no-console
    console.log(`Client ${socket.id} connected to room: ${id}`);
    socket.join(id);
  }

  function onDisconnect(id) {
    // eslint-disable-next-line no-console
    console.log(`Client ${socket.id} disconnected from room: ${id}`);
    socket.leave(id);
  }

  socket.on("message", function(event) {
    event.caller = {
      id: socket.id
    };

    log("SERVER_LOG", event);

    switch (event.type) {
      case SocketEventType.CONNECT:
        onConnect(event.room.id);
        socket.broadcast.to(event.room.id).emit("message", event);
        break;
      case SocketEventType.DISCONNECT:
        onDisconnect(event.room.id);
        socket.broadcast.to(event.room.id).emit("message", event);
        break;
      case SocketEventType.OFFER:
      case SocketEventType.ANSWER:
      case SocketEventType.CANDIDATE:
        socket.broadcast.to(event.callee.id).emit("message", event);
        break;
      default:
        socket.broadcast.to(event.room.id).emit("message", event);
    }
  });

  socket.on("ipaddr", function() {
    var ifaces = os.networkInterfaces();
    for (var dev in ifaces) {
      ifaces[dev].forEach(function(details) {
        if (details.family === "IPv4" && details.address !== "127.0.0.1") {
          socket.emit("ipaddr", details.address);
        }
      });
    }
  });
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server started at port ${port}`);
});
