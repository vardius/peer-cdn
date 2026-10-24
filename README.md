# 🌐 peer-cdn

[![CI](https://github.com/vardius/peer-cdn/actions/workflows/ci.yml/badge.svg)](https://github.com/vardius/peer-cdn/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/peer-cdn.svg)](https://www.npmjs.com/package/peer-cdn)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE.md)

A peer-to-peer CDN for your site: a service worker serves your assets from other visitors' browsers over WebRTC
before asking your server.

- **Routes in your service worker.** Send requests for a path through middleware, asked in order or all at once:
  the cache, the other visitors, the network, or your own.
- **Visitors share their cache.** Each open page shares the responses its worker cached and finds responses among
  the other visitors for its worker, over [peer-data](https://github.com/vardius/peer-data) data channels.
- **Careful with what it shares.** Peers share only same-origin 200 responses not marked `private` or `no-store`.
  The worker takes images, fonts and media from them, and scripts, stylesheets and other files only when they
  match the request's Subresource Integrity metadata. Page loads, frames and workers always come from your server.
- **The network as a fallback.** What no cache or peer has comes from your server, and requests you don't route
  are left to the browser.
- **Small.** ES modules with types, written in strict TypeScript. The worker side has no dependencies.
- **A Vite plugin.** `peer-cdn/vite` serves and builds the worker as one script, and runs the signaling server on
  Vite's dev and preview servers.

📖 **[Documentation](https://vardius.github.io/peer-cdn/)** · [Live demo](https://vardius.github.io/peer-cdn/demo/) · [Examples](examples) · [Migrating from v1](MIGRATION.md)

## Install

```sh
npm install peer-cdn socket.io-client
```

The signaling server needs socket.io on Node.js: `npm install socket.io` where it runs.

## Quick start

A site with peer-cdn has three parts. The **service worker** routes requests for your assets:

```ts
// sw.ts
import { CachePlugin, DelegatePlugin, NetworkPlugin, PeerCDN, ordered } from 'peer-cdn';

const cache = new CachePlugin();
const peers = new DelegatePlugin();
const network = new NetworkPlugin();

// From this browser's cache, then from other visitors, then from the server, caching what comes back.
new PeerCDN().GET('/assets', ordered, cache.getMiddleware, peers.getMiddleware, network.getMiddleware).register();
```

Bundle it into one script with your bundler. Only the worker classes end up in it: PeerPlugin and peer-data stay
out. With Vite, `peer-cdn/vite` does it for you, and runs the signaling server while you develop:

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import { peerCDN } from 'peer-cdn/vite';

export default defineConfig({ plugins: [peerCDN({ worker: 'src/sw.ts' })] });
```

**Each page** registers the worker and joins the other visitors:

```ts
// main.ts
import { io } from 'socket.io-client';
import { PeerPlugin, SocketChannel } from 'peer-cdn';

new PeerPlugin({ signaling: new SocketChannel(io('https://signaling.example.com')) });
await navigator.serviceWorker.register('/sw.js');
```

A **signaling server** introduces the pages to each other:

```ts
// server.ts
import { createServer } from 'node:http';
import { attachSignaling } from 'peer-cdn/server';

const server = createServer();
attachSignaling(server, { cors: { origin: 'https://www.example.com' } });
server.listen(8080);
```

[examples](examples) is this site, runnable with `npm run examples`.

## How it works

1. The worker gets a request on a route and asks its middleware: here the cache, then the peers, then the network.
2. Service workers can't use WebRTC, so DelegatePlugin asks the page that made the request. Its PeerPlugin asks the
   connected visitors whether they have the URL, and gets it from the first that does.
3. The worker answers with what came back and keeps it in its cache, from where this visitor shares it in turn.

## Only route public assets

A peer can send any bytes for a URL it says it has. Route assets that are the same for every visitor.
DelegatePlugin asks the peers for images, fonts, audio, video and text tracks, and CachePlugin gives what they
sent to those requests alone. For anything else, DelegatePlugin asks only when the request carries Subresource
Integrity metadata, such as a script's `integrity` attribute: it drops a peer's response that doesn't match, and
CachePlugin a cached one. The worker never answers page loads, frames, embedded
objects, workers or worklets, which can't carry one.

## Upgrading from v1

v2 is a rewrite: import `ordered` and `fastest` instead of `PeerCDN.strategies`, bundle the worker instead of
`importScripts`, and let PeerPlugin answer the worker by itself.
[MIGRATION.md](MIGRATION.md) maps every v1 call to its v2 form and lists the behaviour changes.

## Contributing

Bug reports and pull requests are welcome: see [CONTRIBUTING.md](.github/CONTRIBUTING.md).

## License

MIT, see [LICENSE.md](LICENSE.md).
