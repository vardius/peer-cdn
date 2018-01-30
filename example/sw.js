(function () {
  "use strict";

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
    cdn.register();
  }

  run();
})();
