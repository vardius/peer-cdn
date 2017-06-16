export default class Cache {
  constructor(options) {
    // Overkill for this single cache example but this is a best practise
    this.names = { peerfetch: "peerfetch-cache-v" + options.version };

    this.getMiddleware = this.getMiddleware.bind(this);
    this.clearOldCaches = this.clearOldCaches.bind(this);
  }

  // Middleware factory function for fetch event
  getMiddleware(event) {
    return {
      get: () => {
        // caches.match() will look for a cache entry in all of the caches available to the service worker.
        // It's an alternative to first opening a specific named cache and then matching on that.
        return caches.match(event.request).then(function(response) {
          if (response) {
            return response;
          }

          return null;
        });
      },
      put: response => {
        //do not chace ranged responses
        if (event.request.headers.has("range")) {
          return;
        }

        // IMPORTANT: Clone the response. A response is a stream
        // and because we want the browser to consume the response
        // as well as the cache consuming the response, we need
        // to clone it so we have two streams.
        const responseToCache = response.clone();

        caches.open(this.name).then(function(cache) {
          const cacheRequest = event.request.clone();
          cache.put(cacheRequest, responseToCache);
        });
      }
    };
  }

  // Clears old cache, function used in activate event handler
  clearOldCaches() {
    // Delete all caches that aren't named in CURRENT_CACHES.
    // While there is only one cache in this example, the same logic will handle the case where
    // there are multiple versioned caches.
    const expectedNames = Object.keys(this.names).map(key => this.names[key]);

    return caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (expectedNames.indexOf(cacheName) === -1) {
            // If this cache name isn't present in the array of "expected" cache names, then delete it.
            return caches.delete(cacheName);
          }
        })
      );
    });
  }
}
