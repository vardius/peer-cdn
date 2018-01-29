import "babel-polyfill/dist/polyfill";
import "webrtc-adapter";

import PeerCDN from "./PeerCDN";
import Middleware from "./router/Middleware";
import { Cache, Peer, Network, Delegate } from "./plugins";

const middleware = new Middleware();
const STRATEGIES = {
  fastest: middleware.applyFastest,
  ordered: middleware.applyOrdered
};

self.PeerCDN = PeerCDN;
self.STRATEGIES = STRATEGIES;
self.CachePlugin = Cache;
self.PeerPlugin = Peer;
self.DelegatePlugin = Delegate;
self.NetworkPlugin = Network;

export default PeerCDN;
export {
  STRATEGIES,
  Cache as CachePlugin,
  Peer as PeerPlugin,
  Delegate as DelegatePlugin,
  Network as NetworkPlugin
};
