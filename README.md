# peer-cdn

[![Build Status](https://travis-ci.org/vardius/peer-cdn.svg?branch=master)](https://travis-ci.org/vardius/peer-cdn)
[![codecov](https://codecov.io/gh/vardius/peer-cdn/branch/master/graph/badge.svg)](https://codecov.io/gh/vardius/peer-cdn)
[![npm version](https://img.shields.io/npm/v/peer-cdn.svg)](https://www.npmjs.com/package/peer-cdn)
[![license](https://img.shields.io/github/license/vardius/peer-cdn.svg)](LICENSE.md)

Lightweight library providing peer to peer CDN functionality

### Bundle size
```bash
┌───────────────────────────────────┐
│                                   │
│   Destination: dist/index.es.js   │
│   Bundle Size:  232.06 KB         │
│   Minified Size:  103.46 KB       │
│   Gzipped Size:  28.94 KB         │
│                                   │
└───────────────────────────────────┘
┌────────────────────────────────┐
│                                │
│   Destination: dist/index.js   │
│   Bundle Size:  247.91 KB      │
│   Minified Size:  95.23 KB     │
│   Gzipped Size:  27.78 KB      │
│                                │
└────────────────────────────────┘
```

# **This is work in progress!**

You can speed up the process of development. Check [help wanted](https://github.com/vardius/peer-cdn/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) issues and [contribute](https://github.com/vardius/peer-cdn/blob/master/CONTRIBUTING.md#development)

### Things to consider:
- peer matching algorithms (ways of improving - pick best direction to go from here, beta version keeps it simple - pick first)
- browser support [WebRTC](https://webrtc.org)
- browser support [`client.postMessage()`](https://developer.mozilla.org/en-US/docs/Web/API/Client/postMessage#Browser_compatibility)
- media supported (there might be issues with range request)

For now I know there might be some issues with:
- [`client.postMessage()`](https://developer.mozilla.org/en-US/docs/Web/API/Client/postMessage#Browser_compatibility) problems on **Google Chrome Version 64.0.3282.167 (Official Build) (64-bit)** however works on **Mozilla Firefox Quantum 58.0.2 (64-bit)**
- [range requests](https://github.com/vardius/peer-cdn/issues/7)

### Next steps:
- [ ] add more tests
- [ ] resolve browser support
- [ ] create web pack plugin
- [ ] improve signalling server

## Contribution

Is *peer-cdn* library missing something ?

No problem! Simply [fork](https://github.com/vardius/peer-cdn/network#fork-destination-box) this repository and create pull request.

## Installation

```bash
npm install --save peer-cdn
```

## [Documentation](https://github.com/vardius/peer-cdn/wiki)

## License

The code is available under the [MIT license](LICENSE.md).
