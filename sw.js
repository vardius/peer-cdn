(function() {
  "use strict";
  self.importScripts("./dist/peer-cdn.js");

  function run() {
    const cdn = new PeerCDN(1);
    cdn.register(self);
  }

  run();
})();
