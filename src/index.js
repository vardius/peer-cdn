import "babel-polyfill/dist/polyfill";
import PeerCDN from "./PeerCDN";
import { Cache as CachePlugin } from "./plugins";

self.PeerCDN = PeerCDN;
self.CachePlugin = CachePlugin;

export default PeerCDN;
export { CachePlugin };
