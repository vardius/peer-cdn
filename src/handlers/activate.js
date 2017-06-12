export function getActivate(CURRENT_CACHES) {
  return function activate(event) {
    // Delete all caches that aren't named in CURRENT_CACHES.
    // While there is only one cache in this example, the same logic will handle the case where
    // there are multiple versioned caches.
    var expectedCacheNames = Object.keys(CURRENT_CACHES).map(function(key) {
      return CURRENT_CACHES[key];
    });

    event.waitUntil(
      caches.keys().then(function(cacheNames) {
        const promises = cacheNames.map(function(cacheName) {
          if (expectedCacheNames.indexOf(cacheName) === -1) {
            // If this cache name isn't present in the array of "expected" cache names, then delete it.
            console.log("Deleting out of date cache:", cacheName);
            return caches.delete(cacheName);
          }
        });

        promises.push(self.clients.claim());

        // Remove caches and claim any clients immediately, so that the page will be under SW control without reloading.
        // return Promise.all(...removeCaches, self.clients.claim());
        return Promise.all(promises);
      })
    );
  };
}
