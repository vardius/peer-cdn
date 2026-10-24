# Migrating from v1 to v2

v2 keeps the shape of v1: a `PeerCDN` router in the service worker, strategies that combine middleware, and the
same four plugins. What changes is how you load it, how the page side is wired, and many fixes to how requests
are routed and answered. Behaviour that changed is listed at the end.

## 1. Install

```sh
npm install peer-cdn@2 socket.io-client
```

peer-cdn 2 depends on peer-data 4, which npm installs with it, and passes on its `SocketChannel`: pages import
everything from peer-cdn. Pages signal through socket.io-client 4, which needs a socket.io 3 or 4 server, such
as `peer-cdn/server` (see [Signaling server](#4-signaling-server)).

v2 is an ES module only, with types; there is no UMD build and no `PeerCDN` global any more. Bundle the service
worker into one script with your bundler instead of loading it with `importScripts`. Only the worker classes end
up in the bundle. With Vite, `peer-cdn/vite` bundles, serves and builds it: see the
[Vite guide](https://vardius.github.io/peer-cdn/vite/).

## 2. Before and after

The service worker:

```js
// v1
self.importScripts('/peer-cdn/index.js');

const {
  CachePlugin,
  DelegatePlugin,
  NetworkPlugin,
  strategies: { ordered },
} = PeerCDN;

const cachePlugin = new CachePlugin({ version: 1 });
const delegatePlugin = new DelegatePlugin({ timeoutAfter: 5000 });
const networkPlugin = new NetworkPlugin();

const cdn = new PeerCDN();
cdn.GET('/css/main.css', ordered, cachePlugin.getMiddleware, delegatePlugin.getMiddleware, networkPlugin.getMiddleware);
cdn.register();
```

```ts
// v2
import { CachePlugin, DelegatePlugin, NetworkPlugin, PeerCDN, ordered } from 'peer-cdn';

const cache = new CachePlugin();
const peers = new DelegatePlugin({ timeout: 5000 });
const network = new NetworkPlugin();

new PeerCDN().GET('/css', ordered, cache.getMiddleware, peers.getMiddleware, network.getMiddleware).register();
```

The page:

```js
// v1
const peerPlugin = new PeerPlugin({ cacheName: CachePlugin.peerFetch + 1, timeoutAfter: 3000, servers, constraints });

navigator.serviceWorker.addEventListener('message', (event) => {
  const middleware = peerPlugin.getMiddleware({ request: new Request(event.data.url) });
  middleware
    .get()
    .then((response) => event.ports[0].postMessage(response))
    .catch(() => event.ports[0].postMessage(null));
});

navigator.serviceWorker.register('sw.js');
```

```ts
// v2
import { io } from 'socket.io-client';
import { PeerPlugin, SocketChannel } from 'peer-cdn';

new PeerPlugin({
  signaling: new SocketChannel(io('https://signaling.example.com')),
  timeout: 3000,
  configuration: servers,
});

navigator.serviceWorker.register('/sw.js');
```

PeerPlugin answers the worker by itself: remove your `message` listener.

## 3. Every call

| v1                                                                          | v2                                                                                   |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `self.importScripts(...)` and the `PeerCDN` global                          | `import { ... } from 'peer-cdn'`, bundled                                            |
| `PeerCDN.strategies.ordered`, `PeerCDN.strategies.fastest`                  | `import { ordered, fastest } from 'peer-cdn'`                                        |
| `cdn.GET(path, strategy, ...middleware)`                                    | the same, and it returns the `PeerCDN`, so calls chain                               |
| `cdn.register()`                                                            | the same                                                                             |
| `new CachePlugin({ version, names })`                                       | `new CachePlugin({ cacheName })`, which defaults to `"peer-cdn"`                     |
| `CachePlugin.peerFetch`, `cachePlugin.names`                                | `cachePlugin.cacheName`                                                              |
| `cachePlugin.clearOldCaches()`                                              | gone: delete old caches in your own `activate` listener                              |
| `new DelegatePlugin({ timeoutAfter })`                                      | `new DelegatePlugin({ timeout })`                                                    |
| `new NetworkPlugin()`                                                       | the same                                                                             |
| `new PeerPlugin({ cacheName, servers, constraints, socket, timeoutAfter })` | `new PeerPlugin({ signaling, cacheName, configuration, timeout, room, maxSize })`    |
| `peerPlugin.getMiddleware(event).get()`, your page's `message` listener     | gone: PeerPlugin answers the worker; `peerPlugin.fetch(url)` asks the peers yourself |
| —                                                                           | `peerPlugin.close()`, `peerPlugin.peers`, and the `onPeers` option                   |
| `require('peer-cdn/dist/server.index.js')(server, callback)`                | `import { attachSignaling } from 'peer-cdn/server'`, then `attachSignaling(server)`  |

The options that moved:

- **`servers`** is now **`configuration`**: the `RTCConfiguration`, ICE servers included. Use `urls` in each
  ICE server; the `url` field v1's defaults used is long gone from browsers.
- **`socket`**, socket.io client options, is now the socket itself: create it with `io(url, options)` and pass
  `new SocketChannel(socket)` as `signaling`.
- **`constraints`**, the data channel options, is gone: PeerPlugin's channel is ordered and reliable.
- **`cacheName`** is optional, and must match the worker's CachePlugin. Both default to `"peer-cdn"`.

To delete v1's caches once, list them in an `activate` listener of your own:

```ts
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.delete('peerfetch-cache-v1'));
});
```

## 4. Signaling server

v1's server ran socket.io 2, which socket.io-client 4 can't talk to. Replace it with `peer-cdn/server`, on
socket.io 4:

```ts
import { createServer } from 'node:http';
import { attachSignaling } from 'peer-cdn/server';

const server = createServer(app);
attachSignaling(server, { cors: { origin: 'https://www.example.com' } });
server.listen(8080);
```

It routes peer-data 4's messages, so any peer-data peers can use it too, and checks that each socket only speaks
for the ids it joined with, 16 at most. Its second argument is socket.io's server options; v1's `callback` for
other events is gone. It is an ES module: CommonJS servers can `require()` it on Node.js 20.19 and later 20
releases, or 22.12 and later.

Upgrade every page together: v1 and v2 pages can't share responses.

## 5. Behaviour changes

- **Peers share responses.** v1 sent `Response` objects over the data channel and through `postMessage`, neither
  of which can carry one, so no response ever came from a peer. v2 sends the status, headers and body, the body
  in 16 KiB pieces, one body at a time per peer and four at most in all, up to `maxSize` (2 MiB by default).
- **What peers share is limited.** A page shares only same-origin 200 responses from its own cache that aren't
  marked `private` or `no-store`, and accepts only 200 responses. DelegatePlugin asks the peers for images,
  fonts, audio, video and text tracks, and for scripts, stylesheets and other files only when the request has
  Subresource Integrity metadata. It drops a response that doesn't match it, and CachePlugin deletes a cached one
  that doesn't, and gives what a peer sent for an image or the like to no other request. Give scripts and
  stylesheets an `integrity` attribute to share them.
- **One room for every request.** v1 joined a new room for each request; v2 joins one room when PeerPlugin is
  created and asks the peers already connected.
- **A route covers the paths below it**, and a `:` segment matches any one segment. v1 matched a route's own
  path only, and tested segments against a `:` segment as a regular expression. Of the routes that match, the
  most specific wins. Regular expressions in routes are gone.
- **Requests no middleware answers go to the network.** v1 answered them with `null`, which fails the request.
- **Requests off the routes are left to the browser**, as are requests to other origins and requests other than
  GET. v1 fetched every request itself. Page loads, frames, embedded objects, workers, worklets and XSLT
  stylesheets are left to the browser on any route: what a visitor sent for them would run on your site.
- **`fastest` answers with the first response.** v1 answered with whichever middleware settled first, a miss
  included.
- **Middleware that missed get a copy.** With `ordered`, each middleware asked before the one that answered gets
  its own copy of the response through `put`; with `fastest`, every other middleware does. The worker answers
  first and keeps running until the copies are stored; v1 waited for `put` before answering.
- **CachePlugin answers from its own cache only.** v1 matched every cache of the origin. It keeps only whole 200
  responses not marked `no-store`, and options without a `version` no longer name its cache
  `peerfetch-cache-vundefined`.
- **Range requests are answered correctly.** A range past the end is cut at the end, a suffix longer than the
  body gets the whole body, and a range that starts past the end gets 416. v1 failed the first two and served an
  empty part for the last.
- **DelegatePlugin asks another open page** when the request's own page has closed. A page that doesn't
  acknowledge within half a second is passed over.
- **Errors are reported as uncaught** in the worker, instead of logged to the console in development builds
  only. A middleware that throws counts as a miss.
