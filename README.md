# peer-cdn

[![Build Status](https://travis-ci.org/vardius/peer-cdn.svg?branch=master)](https://travis-ci.org/vardius/peer-cdn)
[![codecov](https://codecov.io/gh/vardius/peer-cdn/branch/master/graph/badge.svg)](https://codecov.io/gh/vardius/peer-cdn)
[![npm version](https://img.shields.io/npm/v/peer-cdn.svg)](https://www.npmjs.com/package/peer-cdn)
[![license](https://img.shields.io/github/license/vardius/peer-cdn.svg)](LICENSE.md)
[![Beerpay](https://beerpay.io/vardius/peer-cdn/badge.svg?style=beer-square)](https://beerpay.io/vardius/peer-cdn) [![Beerpay](https://beerpay.io/vardius/peer-cdn/make-wish.svg?style=flat-square)](https://beerpay.io/vardius/peer-cdn?focus=wish)

Lightweight library providing peer to peer CDN functionality

### Bundle size
```bash
┌────────────────────────────────────────────────────┐
│                                                    │
│   Destination: lib/index.js                        │
│   Bundle size: 247.07 KB, Gzipped size: 72.45 KB   │
│                                                    │
└────────────────────────────────────────────────────┘
┌────────────────────────────────────────────────────┐
│                                                    │
│   Destination: es/index.js                         │
│   Bundle size: 256.63 KB, Gzipped size: 73.71 KB   │
│                                                    │
└────────────────────────────────────────────────────┘
```

# **This is work in progress!**

You can speed up the process of development. Check [help wanted](https://github.com/vardius/peer-cdn/issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) issues and [contribute](https://github.com/vardius/peer-cdn/blob/master/CONTRIBUTING.md#development)

### Things got consider:
- peer matching algorithms (ways of improving - pick best direction to go from here, beta version keeps it simple - pick first)
- browser support [WebRTC](https://webrtc.org)
- browser support [`client.postMessage()`](https://developer.mozilla.org/en-US/docs/Web/API/Client/postMessage#Browser_compatibility)
- media supported (there might be issues with range request)

For now I know there might be some issues with:
- [`client.postMessage()`](https://developer.mozilla.org/en-US/docs/Web/API/Client/postMessage#Browser_compatibility) problems on **Google Chrome Version 64.0.3282.167 (Official Build) (64-bit)** however works on **Mozilla Firefox Quantum 58.0.2 (64-bit)**
- [range requests](https://github.com/vardius/peer-cdn/issues/7)

## Contribution

Is *peer-cdn* library missing something ?

No problem! Simply [fork](https://github.com/vardius/peer-cdn/network#fork-destination-box) this repository and create pull request.

## Instaliation

```bash
npm install --save peer-cdn
```

## [Documentation](https://github.com/vardius/peer-cdn/wiki)

## License

The code is available under the [MIT license](LICENSE.md).
