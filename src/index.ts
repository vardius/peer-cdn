export { PeerCDN, type WorkerScope } from './PeerCDN.js';
export { ordered, fastest } from './strategies.js';
export { CachePlugin, type CachePluginOptions } from './plugins/CachePlugin.js';
export { NetworkPlugin } from './plugins/NetworkPlugin.js';
export {
  DelegatePlugin,
  type DelegatePluginOptions,
  type ClientLike,
  type ClientsLike,
} from './plugins/DelegatePlugin.js';
export { PeerPlugin, type PeerPluginOptions } from './PeerPlugin.js';
// PeerPlugin's signaling, from peer-data, so pages import everything from peer-cdn.
export { BroadcastChannelSignaling, SocketChannel, type Signaling } from 'peer-data';
export type { ExtendableEventLike, FetchEventLike, Handler, Middleware, MiddlewareFactory, Strategy } from './types.js';
