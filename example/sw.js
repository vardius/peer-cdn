(function() {
  "use strict";
  self.importScripts("./peer-cdn.js");

  function run() {
    const cdn = new PeerCDN(1);
    cdn.register(self);
  }

  run();
})();
