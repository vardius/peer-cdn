export default class Cache {
  constructor(version) {
    this.names = { peerfetch: "peerfetch-cache-v" + version };

    this.getFromCache = this.getFromCache.bind(this);
    this.saveToCache = this.saveToCache.bind(this);
    this.clearOldCaches = this.clearOldCaches.bind(this);
  }

  getFromCache(event) {
    return response => {
      if (response) {
        return response;
      }

      // caches.match() will look for a cache entry in all of the caches available to the service worker.
      // It's an alternative to first opening a specific named cache and then matching on that.
      return caches.match(event.request).then(function(response) {
        if (response) {
          return response;
        }

        return null;
      });
    };
  }

  saveToCache(event) {
    return response => {
      if (response) {
        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have two streams.
        var responseToCache = response.clone();

        caches.open(this.name).then(function(cache) {
          cache.put(event.request, responseToCache);
        });
      }

      return response;
    };
  }

  clearOldCaches() {
    // Delete all caches that aren't named in CURRENT_CACHES.
    // While there is only one cache in this example, the same logic will handle the case where
    // there are multiple versioned caches.
    var expectedNames = Object.keys(this.names).map(key => this.names[key]);

    return caches.keys().then(function(cacheNames) {
      const promises = cacheNames.map(function(cacheName) {
        if (expectedNames.indexOf(cacheName) === -1) {
          // If this cache name isn't present in the array of "expected" cache names, then delete it.
          return caches.delete(cacheName);
        }
      });

      return Promise.all(promises);
    });
  }
}
