(function () {
  "use strict";

  self.importScripts("/vendor/peer-cdn.min.js");

  const cachePlugin = new CachePlugin({ version: 1 });
  const peerPlugin = new PeerPlugin({
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
  });
  const networkPlugin = new NetworkPlugin();

  function run() {
    const cdn = new PeerCDN();
    cdn.all(
      "/",
      STRATEGIES.ordered,
      cachePlugin.getMiddleware(),
      peerPlugin.getMiddleware(),
      networkPlugin.getMiddleware()
    );
    cdn.register();
  }

  run();
})();
