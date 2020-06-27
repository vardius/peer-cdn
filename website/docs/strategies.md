---
id: strategies
title: Strategies
sidebar_label: Strategies
---

By importing **[peer-cdn](https://github.com/vardius/peer-cdn)** into your service worker you get the access to exported `PeerCDN` class, **Plugins** and **Strategies**.

PeerCDN has two strategies of executing plugins middleware:

- fastest
- ordered

# Ordered

Ordered strategy calls middleware in order up until the first one returns response.

```js
  const { strategies: { ordered }} = PeerCDN;

  cdn.GET("/css/main.css", ordered,
    cachePlugin.getMiddleware,
    delegatePlugin.getMiddleware,
    networkPlugin.getMiddleware
  );
```

# Fastest

Ordered strategy calls every middleware and the fastest response will be used.

```js
  const { strategies: { fastest }} = PeerCDN;

  cdn.GET("/css/main.css", fastest,
    cachePlugin.getMiddleware,
    delegatePlugin.getMiddleware,
    networkPlugin.getMiddleware
  );
```
