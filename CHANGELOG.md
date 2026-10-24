# Changelog

## v2.0.0 (2026-10-25)

A rewrite in strict TypeScript, on peer-data 4. The [migration guide](https://vardius.github.io/peer-cdn/migrating-from-v1/)
maps every v1 call to its v2 form.

### Added

- `peer-cdn/vite`, a Vite plugin. It serves and builds the service worker as one classic script, and runs the
  signaling server on Vite's dev and preview servers.
- `SocketChannel` and `BroadcastChannelSignaling`, peer-data's signaling, are exports of peer-cdn, so pages
  import everything from it.
- `peerPlugin.fetch(url)` asks the connected visitors for a URL yourself. `peerPlugin.peers` and the `onPeers`
  option tell how many are connected, and `peerPlugin.close()` leaves them.
- The `maxSize` option: the largest body PeerPlugin sends to or takes from a peer, 2 MiB by default. A page tells
  a peer it lacks a larger one.
- `peer-cdn/server` checks that each socket speaks only for the peer ids it joined with, 16 at most, and routes an
  offer only into the room its id joined. A page that reconnects gets its id back once the server notices its
  old socket is gone. It takes an HTTP or HTTPS server.
- Types for the whole API, including `Strategy`, `Middleware` and `MiddlewareFactory` for writing your own.
- A runnable example site in `examples/`, and a documentation site with a live demo.

### Changed

- peer-cdn is an ES module with types. The UMD build and the `PeerCDN` global are gone: bundle the worker.
- `ordered` and `fastest` are imports instead of `PeerCDN.strategies`, and `cdn.GET` returns the router, so calls
  chain.
- `new CachePlugin({ cacheName })` replaces `version` and `names`. The cache is called `peer-cdn` by default.
- `new DelegatePlugin({ timeout })` replaces `timeoutAfter`.
- `new PeerPlugin({ signaling })` takes peer-data signaling, such as a `SocketChannel` over your own socket.io
  client, instead of creating one. `configuration` replaces `servers`, and `constraints` is gone.
- PeerPlugin answers the worker by itself, and joins one room for every request instead of one per request.
- The signaling server is `attachSignaling` from `peer-cdn/server`, on socket.io 4.
- A route covers the paths below it, and a `:` segment matches any one segment. Of the routes that match, the
  most specific answers.
- Requests that no middleware answers go to the network. Requests off the routes, to other origins, or other
  than GET are left to the browser, and so are page loads, frames, embedded objects, workers, worklets and XSLT
  stylesheets on any route: nothing could check what a visitor sent for them.
- Errors in the worker are reported as uncaught, and a middleware that throws counts as a miss.

### Fixed

- Peers share responses. v1 sent `Response` objects over the data channel and through `postMessage`, neither of
  which can carry one. A page sends each peer one body at a time, and four at most in all, and asks a peer for
  the next only once the last has arrived.
- Peers share only same-origin 200 responses not marked `private` or `no-store`. DelegatePlugin asks them for
  images, fonts, audio, video and text tracks, and for scripts, stylesheets and other files only when the request
  has Subresource Integrity metadata. It drops a response that doesn't match it, and CachePlugin deletes a cached
  one that doesn't, and gives what a peer sent for an image or the like to no other request.
- `fastest` answers with the first response instead of the first middleware to settle, a miss included.
- Middleware that missed get their own copy of the response, and the worker answers before they finish storing
  it.
- CachePlugin answers from its own cache only, and keeps only whole 200 responses not marked `no-store`. Options
  without a `version` no longer name its cache `peerfetch-cache-vundefined`.
- Range requests: a range past the end is cut at the end, a suffix longer than the body gets the whole body, and a
  range that starts past the end gets 416.
- DelegatePlugin asks another open page when the request's own page has closed.

### Removed

- `cachePlugin.clearOldCaches()`, `CachePlugin.peerFetch` and `cachePlugin.names`.
- Regular expressions in routes.
- `peerPlugin.getMiddleware()`.
- The signaling server's `callback` argument.
