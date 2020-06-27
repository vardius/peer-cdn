---
id: strategies
title: Strategies
sidebar_label: Strategies
---

PeerCDN has two strategies of executing plugins middleware:

- fastest
- ordered

# Ordered

will execute plugins in ordered they were passed to router

```js
  const { strategies: { ordered }} = PeerCDN;

  cdn.GET("/css/main.css", ordered,
    cachePlugin.getMiddleware,
    delegatePlugin.getMiddleware,
    networkPlugin.getMiddleware
  );
```

# Fastest

will execute all plugins fastest to finish will win

```js
  const { strategies: { fastest }} = PeerCDN;

  cdn.GET("/css/main.css", fastest,
    cachePlugin.getMiddleware,
    delegatePlugin.getMiddleware,
    networkPlugin.getMiddleware
  );
```
