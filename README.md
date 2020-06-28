# peer-cdn

[![Build Status](https://travis-ci.org/vardius/peer-cdn.svg?branch=master)](https://travis-ci.org/vardius/peer-cdn)
[![codecov](https://codecov.io/gh/vardius/peer-cdn/branch/master/graph/badge.svg)](https://codecov.io/gh/vardius/peer-cdn)
[![npm version](https://img.shields.io/npm/v/peer-cdn.svg)](https://www.npmjs.com/package/peer-cdn)
[![npm downloads](https://img.shields.io/npm/dm/peer-cdn.svg)](https://www.npmjs.com/package/peer-cdn)
[![license](https://img.shields.io/github/license/vardius/peer-cdn.svg)](LICENSE.md)

Lightweight library providing peer to peer CDN functionality

📖 ABOUT
==================================================
Contributors:

* [Rafał Lorenz](https://rafallorenz.com)

Want to contribute ? Feel free to send pull requests!

Have problems, bugs, feature ideas?
We are using the github [issue tracker](https://github.com/vardius/peer-cdn/issues) to manage them.

## 📚 Documentation

For **documentation** (_including examples_), **visit [rafallorenz.com/peer-cdn](https://rafallorenz.com/peer-cdn)**

🚏 HOW TO USE
==================================================

## Installation
```bash
$ npm install peer-cdn
```

## Basic example

### main.js

```js
"use strict";

import { PeerPlugin } from "peer-cdn";

if ("serviceWorker" in navigator) {
  // since sw does not support WebRTC yet
  // this is workaround to use it
  // we use PeerPlugin on client side
  const peerPlugin = new PeerPlugin({
    cacheName: CachePlugin.peerFetch + 1,
    timeoutAfter: 3000,
    servers: {
      iceServers: [
        {
          url: "stun:74.125.142.127:19302",
        },
      ],
    },
    constraints: {
      ordered: true,
    },
  });

  // Set up a listener for messages posted from the service worker.
  // The service worker is set to post a message to specific client only
  // so you should see this message event fire once.
  // You can force it to fire again by visiting this page in an Incognito window.
  navigator.serviceWorker.addEventListener("message", function (event) {
    const request = new Request(event.data.url);
    // mock sw event wrapping request with object
    const middleware = peerPlugin.getMiddleware({ request });

    // run get method of a created middleware
    middleware
      .get()
      .then(function (response) {
        // return response to a service worker
        event.ports[0].postMessage(response);
      })
      .catch(function (error) {
        // return response to a service worker
        event.ports[0].postMessage(null);
      });
  });

  navigator.serviceWorker
    .register("sw.js")
    .then(function (registration) {
      // Registration was successful
      console.log(
        "ServiceWorker registration successful with scope: ",
        registration.scope
      );
    })
    .catch(function (error) {
      console.error("Service Worker Error", error);
    });
}
```

### sw.js

```js
// import peer-cdn into service worker
self.importScripts("https://github.com/vardius/peer-cdn/blob/v1.0.5-beta/dist/index.js");

const { CachePlugin, DelegatePlugin, NetworkPlugin, strategies: { ordered }} = PeerCDN;

const cachePlugin = new CachePlugin({ version: 1 });
// since sw does not support WebRTC yet we use PeerPlugin on client side 
// and we delegate request to it with DelegatePlugin
const delegatePlugin = new DelegatePlugin({ timeoutAfter: 5000 });
const networkPlugin = new NetworkPlugin();

const cdn = new PeerCDN();

cdn.GET("/css/main.css", ordered,
    cachePlugin.getMiddleware,
    delegatePlugin.getMiddleware,
    networkPlugin.getMiddleware
);

// We need to register service worker events
// cdn.register() will add listeners for install, activate and fetch
// gaining required control
cdn.register();
```

📜 [License](LICENSE.md)
-------

This package is released under the MIT license. See the complete license in the package
