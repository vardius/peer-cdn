---
id: router
title: Router
sidebar_label: Router
---

**[peer-cdn](https://github.com/vardius/peer-cdn)** allows you to register all assets or pick only specific one.
Currently only available methods are `GET`, other request will not be handled.

```js
    cdn.GET("/css/main.css", ordered,
      cachePlugin.getMiddleware,
      delegatePlugin.getMiddleware,
      networkPlugin.getMiddleware
    );
```

**[peer-cdn](https://github.com/vardius/peer-cdn)** creates nodes tree for request paths. All middleware will be applied to the children nodes for a given path as well. Meaning: Router will automatically handle all children routes. For example if you register `/js` route and browser will try to fetch `/js/main.js` this will match its parent route's handler.

```js
const middleware = []; // array of your middleware

// invoked for any requests passed to this router
PeerCDN.GET("/", ordered, ...middleware);

// will handle any request that match pattern
PeerCDN.get("/static/:wildcard", ordered, ...);
```

You can use regexp as path value. For more details please see source code on [GitHub](https://github.com/vardius/peer-cdn/tree/master/src/router)
