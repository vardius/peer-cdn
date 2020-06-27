(function () {
  "use strict";

  // import peer-cdn into service worker
  // this path is exposed with server
  self.importScripts("/peer-cdn/index.js"); // self.importScripts("https://github.com/vardius/peer-cdn/blob/v1.0.4-beta/dist/index.js");

  const { CachePlugin, DelegatePlugin, NetworkPlugin, strategies: { ordered }} = PeerCDN;

  const cachePlugin = new CachePlugin({ version: 1 });
  // since sw does not support WebRTC yet we use PeerPlugin on client side 
  // and we delegate request to it with DelegatePlugin
  const delegatePlugin = new DelegatePlugin({ timeoutAfter: 5000 });
  const networkPlugin = new NetworkPlugin();

  function run() {
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
  }

  run();
})();
