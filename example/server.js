const express = require("express");
const fspath = require("path");
const cookieParser = require("cookie-parser");
const http = require("http");
const os = require("os");
const fs = require("fs");
const socketIO = require("socket.io");
const peerData = require("peer-data");

const SignalingEventType = peerData.SignalingEventType;
const port = process.env.PORT || 3000;
const index = fspath.join(__dirname, "index.html");
const sw = fspath.join(__dirname, "sw.js");

const app = express();
app.get("/favicon.ico", (req, res) => { res.sendStatus(404); });
app.get("/sw.js", (req, res) => { res.sendFile(sw); });
app.get("/movie.mp4", (req, res) => {
  const file = fspath.resolve(__dirname, "movie.mp4");
  fs.stat(file, function(err, stats) {
    if (err) {
      if (err.code === "ENOENT") {
        // 404 Error if file not found
        return res.sendStatus(404);
      }
      res.end(err);
    }
    const range = req.headers.range;
    if (!range) {
      // 416 Wrong range
      return res.sendStatus(416);
    }
    const positions = range.replace(/bytes=/, "").split("-");
    const start = parseInt(positions[0], 10);
    const total = stats.size;
    const end = positions[1] ? parseInt(positions[1], 10) : total - 1;
    const chunksize = end - start + 1;

    res.writeHead(206, {
      "Content-Range": "bytes " + start + "-" + end + "/" + total,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4"
    });

    const stream = fs
      .createReadStream(file, { start: start, end: end })
      .on("open", function() {
        stream.pipe(res);
      })
      .on("error", function(err) {
        res.end(err);
      });
  });
});
app.use("/css", express.static(fspath.join(__dirname, "css")));
app.use("/js", express.static(fspath.join(__dirname, "js")));
app.use("/vendor", express.static(fspath.join(__dirname, "./../dist")));
app.use(cookieParser());
app.get("*", (req, res) => { res.sendFile(index); });

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
