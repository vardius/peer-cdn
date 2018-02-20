"use strict";

if ("serviceWorker" in navigator) {
  // since sw does not support webrtc yet
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
    console.log('onMessage', event.data);
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

  navigator.serviceWorker.register("sw.js")
    .then(function (registration) {
      // Registration was successful
      console.log("ServiceWorker registration successful with scope: ", registration.scope);
    })
    .catch(function (error) {
      console.error("Service Worker Error", error);
    });
}
