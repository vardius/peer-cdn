(function () {
  "use strict";

  self.importScripts("/vendor/peer-cdn.js");

  const cachePlugin = new CachePlugin({ version: 1 });
  const peerPlugin = new PeerPlugin({
    // we pass the cache name to peer plugin
    // otherwise it will not get a cached response
    cacheName: cachePlugin.cacheName.peerfetch,
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
  const networkPlugin = new NetworkPlugin();

  function run() {
    const cdn = new PeerCDN();
    cdn.all("/", STRATEGIES.ordered,
      // all of the following plugins are required
      cachePlugin.getMiddleware,
      peerPlugin.getMiddleware,
      networkPlugin.getMiddleware
    );
    cdn.register();
  }

  run();
})();
