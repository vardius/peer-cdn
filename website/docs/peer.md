---
id: cache
title: Peer Plugin
sidebar_label: Peer Plugin
---

Plugins are factories for [middleware](middleware.md) allowing you to create more complicated logic used by **[peer-cdn](https://github.com/vardius/peer-cdn)**.

This is where main logic of **[peer-cdn](https://github.com/vardius/peer-cdn)** is handled. Currently due to lack of support for **WebRTC** in the service workers is used with [DelegatePlugin](delegate.md) to be handled on client side.
Creates middleware which asks other connected peer for a given resource and if found downloads it from other peers instead of server.

## Source code

Please see source: [Peer.js](https://github.com/vardius/peer-cdn/blob/master/src/plugins/Peer.js)
