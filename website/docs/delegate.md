---
id: delegate
title: Delegate Plugin
sidebar_label: Delegate Plugin
---

Plugins are factories for [middleware](middleware.md) allowing you to create more complicated logic used by **[peer-cdn](https://github.com/vardius/peer-cdn)**.

Allows you to delegate work meant to be done by plugin in this place to a service worker. This is done with the use of a `MessageChannel` allowing **service worker** and **client** to communicate. When using this plugin you are able to `addEventListener` on `message` where you an expect to get requested *url*.

```js
  // since sw does not support WebRTC yet
  // this is workaround to use it
  // we use PeerPlugin on client side
  const peerPlugin = new PeerPlugin({
    cacheName: CachePlugin.peerfetch + 1,
    timeoutAfter: 3000,
    servers: {
      iceServers: [
        {
          url: "stun:74.125.142.127:19302"
        }
      ]
    },
    constraints: {
      ordered: true
    },
  });

  // Set up a listener for messages posted from the service worker.
  // The service worker is set to post a message to specific client only
  // so you should see this message event fire once.
  // You can force it to fire again by visiting this page in an Incognito window.
  navigator.serviceWorker.addEventListener('message', function (event) {
    const request = new Request(event.data.url);
    // mock sw event wrapping request with object
    const middleware = peerPlugin.getMiddleware({ request });

    // run get method of a created middleware
    middleware.get()
      .then(function (response) {
        // return response to a service worker
        event.ports[0].postMessage(response);
      })
      .catch(function (error) {
        // return response to a service worker
        event.ports[0].postMessage(null);
      });
  });
```

## Source code

Please see source: [Delegate.js](https://github.com/vardius/peer-cdn/blob/master/src/plugins/Delegate.js)
