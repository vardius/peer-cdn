const express = require("express");
const fspath = require("path");
const cookieParser = require("cookie-parser");
const http = require("http");
const fs = require("fs");
const PeerDataServer = require("peer-data-server");

const PeerEventType = { PEER: "PEER" };
const port = process.env.PORT || 3000;
const index = fspath.join(__dirname, "index.html");
const sw = fspath.join(__dirname, "sw.js");

const app = express();
app.get("/sw.js", (req, res) => res.sendFile(sw));
app.use("/css", express.static(fspath.join(__dirname, "css")));
app.use("/fonts", express.static(fspath.join(__dirname, "fonts")));
app.use("/images", express.static(fspath.join(__dirname, "images")));
app.use("/js", express.static(fspath.join(__dirname, "js")));
app.use("/vendor", express.static(fspath.join(__dirname, "./node_modules/peer-cdn/dist")));
app.use(cookieParser());
app.get("/favicon.ico", (req, res) => res.sendStatus(404));
app.get("*", (req, res) => res.sendFile(index));

app.get("/movie.mp4", (req, res) => {
  const file = fspath.resolve(__dirname, "movie.mp4");
  fs.stat(file, function (err, stats) {
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

    let end = positions[1] ? parseInt(positions[1], 10) : total - 1;
    let chunksize = end - start + 1;
    const maxChunk = 1024 * 1024; // 1MB at a time
    if (chunksize > maxChunk) {
      end = start + maxChunk - 1;
      chunksize = end - start + 1;
    }

    res.writeHead(206, {
      "Content-Range": "bytes " + start + "-" + end + "/" + total,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4"
    });

    const stream = fs
      .createReadStream(file, { start: start, end: end, autoClose: true })
      .on("open", function () {
        stream.pipe(res);
      })
      .on("error", function (err) {
        res.end(err);
      });
  });
});

const server = http.createServer(app);

const createPeerDataServer = PeerDataServer.default || PeerDataServer;
createPeerDataServer(server, function (socket, event) {
  switch (event.type) {
    case PeerEventType.PEER:
      // we should pick best peer and ask only one socket to connect
      socket.broadcast.emit("message", event);
      break;
    default:
      socket.broadcast.to(event.room.id).emit("message", event);
  }
});

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server started at port ${port}`);
});
