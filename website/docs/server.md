---
id: server
title: Server
sidebar_label: Server
---

To make **[peer-cdn](https://github.com/vardius/peer-cdn)** work you need **signaling server**.

## [What is signaling](https://www.html5rocks.com/en/tutorials/webrtc/infrastructure/)?

Signaling is the process of coordinating communication. In order for a WebRTC application to set up a 'call', its clients need to exchange information:

- Session control messages used to open or close communication.
- Error messages.
- Media metadata such as codecs and codec settings, bandwidth and media types.
- Key data, used to establish secure connections.
- Network data, such as a host's IP address and port as seen by the outside world.

This signaling process needs a way for clients to pass messages back and forth. That mechanism is not implemented by the WebRTC APIs: we need to build it yourself.

## Setting up singling server

There is an easy setup, simply import server from **[peer-cdn](https://github.com/vardius/peer-cdn)**  package and use it with your node API.
```js
const http = require("http");
const express = require("express");
const PeerCdnServer = require("peer-cdn/server");

const app = express();

// setup your API...

const server = http.createServer(app);

// Setup peer-cdn signaling server
const appendPeerCdnServer = PeerCdnServer.default || PeerCdnServer;
appendPeerCdnServer(server);

server.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server started at port ${port}`);
});

```
