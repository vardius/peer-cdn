export default class Cache {
  static peerFetch = "peerfetch-cache-v";

  constructor(options) {
    // Overkill for this single cache example but this is a best practice
    this.names = { peerFetch: Cache.peerFetch };

    if (options) {
      const { version, names } = options;
      this.names = { peerFetch: Cache.peerFetch + version || "", ...(names || {}) };
    }

    this.getMiddleware = this.getMiddleware.bind(this);
    this.clearOldCaches = this.clearOldCaches.bind(this);
    this._createPartialResponse = this._createPartialResponse.bind(this);
    this._parseRangeHeader = this._parseRangeHeader.bind(this);
    this._calculateEffectiveBoundaries = this._calculateEffectiveBoundaries.bind(this);
  }

  // Middleware factory function for fetch event
  getMiddleware(event) {
    const request = event.request.clone();

    return {
      get: async () => {
        try {
          // caches.match() will look for a cache entry in all of the caches available to the service worker.
          // It's an alternative to first opening a specific named cache and then matching on that.
          let response = await caches.match(request);
          if (!response) {
            // fallback to cache for other requests
            response = await caches.match(request.url);
          }
          if (response) {
            if (request.headers.has("range")) {
              return this._createPartialResponse(request, response);
            }

            return response;
          }

          return null;
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.error("CachePlugin: get error: ", e)
          }

          return null;
        }
      },
      put: async response => {
        try {
          const cache = await caches.open(this.names.peerFetch)
  
          // IMPORTANT: Clone the response. A response is a stream
          // and because we want the browser to consume the response
          // as well as the cache consuming the response, we need
          // to clone it so we have two streams.
          const responseToCache = response.clone();
          cache.put(request, responseToCache);
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') {
            // eslint-disable-next-line no-console
            console.error("CachePlugin: put error: ", e)
          }
        }
      }
    };
  }

  // Clears old cache, function used in activate event handler
  clearOldCaches() {
    // Delete all caches that aren't named in CURRENT_CACHES.
    // While there is only one cache in this example, the same logic will handle the case where
    // there are multiple versioned caches.
    const expectedNames = Object.keys(this.names).map(key => this.names[key]);

    return caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if (expectedNames.indexOf(cacheName) === -1) {
            // If this cache name isn't present in the array of "expected" cache names, then delete it.
            return caches.delete(cacheName);
          }
        })
      );
    });
  }

  async _createPartialResponse(request, originalResponse) {
    if (originalResponse.status === 206) {
      return originalResponse;
    }

    const rangeHeader = request.headers.get('range');
    if (!rangeHeader) {
      throw new Error('no-range-header');
    }

    const boundaries = this._parseRangeHeader(rangeHeader);
    const originalBlob = await originalResponse.blob();

    const effectiveBoundaries = this._calculateEffectiveBoundaries(
        originalBlob, boundaries.start, boundaries.end);

    const slicedBlob = originalBlob.slice(effectiveBoundaries.start,
        effectiveBoundaries.end);
    const slicedBlobSize = slicedBlob.size;

    const slicedResponse = new Response(slicedBlob, {
      // Status code 206 is for a Partial Content response.
      // See https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/206
      status: 206,
      statusText: 'Partial Content',
      headers: originalResponse.headers,
    });

    slicedResponse.headers.set('Content-Length', String(slicedBlobSize));
    slicedResponse.headers.set('Content-Range',
        `bytes ${effectiveBoundaries.start}-${effectiveBoundaries.end - 1}/` +
        originalBlob.size);

    return slicedResponse;
  }

  _parseRangeHeader(rangeHeader) {
    const normalizedRangeHeader = rangeHeader.trim().toLowerCase();
    if (!normalizedRangeHeader.startsWith('bytes=')) {
      throw new Error('unit-must-be-bytes', {normalizedRangeHeader});
    }

    // Specifying multiple ranges separate by commas is valid syntax, but this
    // library only attempts to handle a single, contiguous sequence of bytes.
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range#Syntax
    if (normalizedRangeHeader.includes(',')) {
      throw new Error('single-range-only', {normalizedRangeHeader});
    }

    const rangeParts = /(\d*)-(\d*)/.exec(normalizedRangeHeader);
    // We need either at least one of the start or end values.
    if (!rangeParts || !(rangeParts[1] || rangeParts[2])) {
      throw new Error('invalid-range-values', {normalizedRangeHeader});
    }

    return {
      start: rangeParts[1] === '' ? undefined : Number(rangeParts[1]),
      end: rangeParts[2] === '' ? undefined : Number(rangeParts[2]),
    };
  }

  _calculateEffectiveBoundaries(blob, start, end) {
    const blobSize = blob.size;

    if ((end && end > blobSize) || (start && start < 0)) {
      throw new Error('range-not-satisfiable', {
        size: blobSize,
        end,
        start,
      });
    }

    let effectiveStart;
    let effectiveEnd;

    if (start !== undefined && end !== undefined) {
      effectiveStart = start;
      // Range values are inclusive, so add 1 to the value.
      effectiveEnd = end + 1;
    } else if (start !== undefined && end === undefined) {
      effectiveStart = start;
      effectiveEnd = blobSize;
    } else if (end !== undefined && start === undefined) {
      effectiveStart = blobSize - end;
      effectiveEnd = blobSize;
    }

    return {
      start: effectiveStart,
      end: effectiveEnd,
    };
  }
}
