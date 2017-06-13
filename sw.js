(function() {
  "use strict";
  self.importScripts("./dist/peer-cdn.js");

  const config = {
    regex: null,
    peer: {
      servers: {
        iceServers: [
          {
            // url: "stun:stun.1.google.com:19302"
            url: "stun:74.125.142.127:19302"
          }
        ]
      },
      constraints: {
        ordered: true
      }
    },
    cache: {
      version: 1
    }
  };

  function run() {
    const cdn = new PeerCDN(config);
    cdn.register(self);
  }

  run();
})();
