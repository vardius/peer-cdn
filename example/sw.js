(function () {
  "use strict";

  // import peer-cdn into service worker
  // this path is exposed with server
  self.importScripts("/peer-cdn/index.js");

  const cachePlugin = new CachePlugin({ version: 1 });
  // since sw does not support webrtc yet we use PeerPlugin on client side 
  // and we delegate request to it with DelegatePlugin
  const delegatePlugin = new DelegatePlugin({ timeoutAfter: 5000 });
  const networkPlugin = new NetworkPlugin();

  function run() {
    const cdn = new PeerCDN();
    cdn.GET("/css/main.css", STRATEGIES.ordered,
      cachePlugin.getMiddleware,
      delegatePlugin.getMiddleware,
      networkPlugin.getMiddleware
    );

    // We need to register service worker events
    // cdn.register() will add listeners for install, activate and fetch
    // gaining required control
    cdn.register();
  }

  run();
})();
