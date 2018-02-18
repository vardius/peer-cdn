"use strict";

if ("serviceWorker" in navigator) {
  // If we would have used navigator.serviceWorker.addEventListener('message', ···)
  // We would need to explicitly call port.start() before we could receive messages
  // Unfortunately, the setter is more magical here than the method
  // and we do not have to do it
  // navigator.serviceWorker.onmessage = function (event) {
  //   console.log("Broadcasted from SW : ", event.data);
  // };

  // navigator.serviceWorker.ready can be used from anywhere in your
  // page's JavaScript, at any time.
  // It will wait until there's an active service worker, and then resolve.
  // navigator.serviceWorker.ready.then(function (registration) {
  // });

  // // since sw does not support webrtc yet
  // // this is workaround to use it
  // // we use PeerPlugin on client side
  // const peerPlugin = new PeerPlugin({
  //   cacheName: CachePlugin.peerfetch + 1,
  //   timeoutAfter: 3000,
  //   servers: {
  //     iceServers: [
  //       {
  //         url: "stun:74.125.142.127:19302"
  //       }
  //     ]
  //   },
  //   constraints: {
  //     ordered: true
  //   },
  // });

  // // Set up a listener for messages posted from the service worker.
  // // The service worker is set to post a message to specific client only
  // // so you should see this message event fire once.
  // // You can force it to fire again by visiting this page in an Incognito window.
  // navigator.serviceWorker.addEventListener('message', function (event) {
  //   console.log('onMessage', event.data);
  //   const request = new Request(event.data.url);
  //   // mock sw event wrapping request with object
  //   const middleware = peerPlugin.getMiddleware({ request });

  //   // run get method of a created middleware
  //   middleware.get()
  //     .then(function (response) {
  //       // return response to a service worker
  //       event.ports[0].postMessage(response);
  //     })
  //     .catch(function (error) {
  //       // return response to a service worker
  //       event.ports[0].postMessage(null);
  //     });
  // });


  window.addEventListener('message', function (event) { console.log('window.addEventListener', event.data) });
  window.onmessage = function (event) { console.log('window.onmessage', event.data) };
  window.onmessageerror = function (event) { console.log('window.onmessageerror', event) };
  navigator.serviceWorker.addEventListener('message', function (event) { console.log('navigator.serviceWorker.addEventListener', event.data) });
  navigator.serviceWorker.onmessage = function (event) { console.log('navigator.serviceWorker.onmessage', event.data) };
  navigator.serviceWorker.onmessageerror = function (event) { console.log('navigator.serviceWorker.onmessageerror', event) };
  // navigator.serviceWorker.controller.addEventListener('message', function (event) { console.log('navigator.serviceWorker.contoller.addEventListener', event.data) });
  // navigator.serviceWorker.controller.onmessage = function (event) { console.log('navigator.serviceWorker.contoller.onmessage', event.data) };
  // navigator.serviceWorker.controller.onmessageerror = function (event) { console.log('navigator.serviceWorker.contoller.onmessageerror', event) };
  navigator.serviceWorker.ready.then(function (registration) {
    console.log('navigator.serviceWorker.ready');
    registration.active.addEventListener('message', function (event) { console.log('registration.active.addEventListener', event.data) });
    registration.active.onmessage = function (event) { console.log('registration.active.onmessage', event.data) };
    registration.active.onmessageerror = function (event) { console.log('registration.active.onmessageerror', event) };
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
