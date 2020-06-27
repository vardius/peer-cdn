---
id: middleware
title: Middleware
sidebar_label: Middleware
---

**[peer-cdn](https://github.com/vardius/peer-cdn)** allows you to hook middleware for fetch event. Middleware can be object, class or anything that expose `get` property which is a `function`. It can also expose `put` property also as a `function`.

## How does it work ?

Middleware will be called with a given [strategy](strategies.md) up until one of them returns response different then `null`, allowing *service worker* to return a response to a browser.

## Example:
```javascript
function (request)
{
   get: () => {
      // get response from cache etc

      // If this method returns response or anything
      // different then null next middleware will not be called
      // and response will be returned . by service worker
      return null;
   },
   put: response => {
      // cache response or something else with it
   }
}
```

### Register middleware
To add middleware simply pass them when registering asset's route for **[peer-cdn](https://github.com/vardius/peer-cdn)** to take care of.

```javascript
const middleware = []; // array of your middleware
PeerCDN.GET("/", ordered, ...middleware);
```

You can use spread operator or pass each middleware as arguments following strategy.
