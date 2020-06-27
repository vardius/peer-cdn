---
id: router
title: Router
sidebar_label: Router
---

PeerCDN come with router to allow you for selection of assets which you want to decentralized.

```js
    cdn.GET("/css/main.css", ordered,
      cachePlugin.getMiddleware,
      delegatePlugin.getMiddleware,
      networkPlugin.getMiddleware
    );
```

You can use regexp as path value. For more details please see source code on [GitHub](https://github.com/vardius/peer-cdn/tree/master/src/router)
