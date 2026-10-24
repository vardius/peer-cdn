# Contributing

Thanks for helping improve **peer-cdn**. By contributing, you agree to abide by the [code of conduct](CODE_OF_CONDUCT.md).

## Issues and questions

Search the [issue tracker](https://github.com/vardius/peer-cdn/issues) first; if nothing matches, open an issue.
Bugs, ideas and usage questions are all welcome. For a bug, include the browser, your worker's routes, and the
request that went wrong.

## Development

You need Node.js 24 or newer.

```sh
git clone https://github.com/vardius/peer-cdn.git
cd peer-cdn
npm ci
npx playwright install chromium firefox webkit
npm test
```

Before sending a pull request, run what CI runs:

```sh
npm run typecheck
npx -y -p typescript@7.0.2 tsc --noEmit
npm run lint
npm run format:check
npm test
npm run build
npm pack --dry-run
```

`npm run format` fixes formatting.

On Linux, Firefox gathers no WebRTC candidates when IPv6 is on but has no route, so its tests time out. CI turns
IPv6 off first: `sudo sysctl -w net.ipv6.conf.all.disable_ipv6=1`.

### Layout

- `src/` holds the library: the `PeerCDN` router, the strategies and plugins for the worker, `PeerPlugin` for the
  page, the signaling server (`src/server.ts`) and the Vite plugin (`src/vite.ts`).
- `test/` holds the tests. The worker's parts run in Node.js; the cache and the peers run in Chromium, Firefox
  and WebKit, and a real service worker in Chromium and WebKit, with a signaling server started for the run.
  They need no network. To run one browser: `npx vitest run --project 'browser (chromium)'`.
- `examples/` holds the example site, and the two-visitor demo the website runs. `npm run examples` serves the
  site, with its worker and signaling server, at http://localhost:5173.
- `website/` is the documentation site.

### Website

```sh
cd website
npm ci
npm run dev
```

## Pull requests

- For a large change, open an issue first so we can agree on the approach.
- Branch from `master`, keep the change focused, and add a test that fails without it.
