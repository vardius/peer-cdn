import PeerCDN from "./PeerCDN";
import Middleware from "./router/Middleware";
import { Cache, Peer, Network, Delegate } from "./plugins";

const middleware = new Middleware();
const exportObj = {
  CachePlugin: Cache,
  PeerPlugin: Peer,
  DelegatePlugin: Delegate,
  NetworkPlugin: Network,
  strategies: {
    fastest: middleware.applyFastest,
    ordered: middleware.applyOrdered,
  },
};

// Merge object for easy access
Object.assign(PeerCDN, exportObj);

self.PeerCDN = PeerCDN;

export {
  Cache as CachePlugin,
  Peer as PeerPlugin,
  Delegate as DelegatePlugin,
  Network as NetworkPlugin,
};
