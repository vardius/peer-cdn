(function() {
  "use strict";
  //todo: use min
  self.importScripts("/vendor/peer-cdn.js");

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
    cdn.all("/", STRATEGIES.ordered, cachePlugin, peerPlugin, networkPlugin);
    cdn.register(self);
  }

  run();
})();
