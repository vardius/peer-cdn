(function() {
  "use strict";
  self.importScripts("vendor/peer-cdn.min.js");

  const cachePlugin = new CachePlugin({ version: 1 });

  const config = {
    regex: null,
    peer: {
      servers: {
        iceServers: [
          {
            url: "stun:74.125.142.127:19302"
          }
        ]
      },
      constraints: {
        ordered: true
      }
    },
    network: {
      chunkSize: 102400
    },
    activateMiddleware: [cachePlugin.clearOldCaches],
    fetchMiddleware: [cachePlugin.getFetchMiddleware]
  };

  function run() {
    const cdn = new PeerCDN(config);
    cdn.register(self);
  }

  run();
})();
