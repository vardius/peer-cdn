(function () {
  "use strict";

  self.importScripts("/vendor/peer-cdn.js");

  const cachePlugin = new CachePlugin({ version: 1 });
  // since sw does not support webrtc yet we use PeerPlugin on client side 
  // and we delegate request to it with DelegatePlugin
  const delegatePlugin = new DelegatePlugin({ timeoutAfter: 5000 });
  const networkPlugin = new NetworkPlugin();

  function run() {
    const cdn = new PeerCDN();
    cdn.GET("/", STRATEGIES.ordered,
      // cdn.GET("/js/main.js", STRATEGIES.ordered,
      // all of the following plugins are required
      cachePlugin.getMiddleware,
      delegatePlugin.getMiddleware,
      networkPlugin.getMiddleware
    );
    cdn.register();
  }

  run();
})();
