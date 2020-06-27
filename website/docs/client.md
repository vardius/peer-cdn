---
id: client
title: Browser Client
sidebar_label: Browser Client
---

## Example

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
