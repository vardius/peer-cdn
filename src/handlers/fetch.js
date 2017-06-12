export function getFetch(CURRENT_CACHES, regex, peers) {
  const cacheResponse = function(request, response) {
    // IMPORTANT: Clone the response. A response is a stream
    // and because we want the browser to consume the response
    // as well as the cache consuming the response, we need
    // to clone it so we have two streams.
    var responseToCache = response.clone();

    caches.open(CURRENT_CACHES.peerfetch).then(function(cache) {
      cache.put(request, responseToCache);
    });
  };

  const getFromCache = function(request) {
    // caches.match() will look for a cache entry in all of the caches available to the service worker.
    // It's an alternative to first opening a specific named cache and then matching on that.
    return caches.match(request).then(function(response) {
      if (response) {
        console.log("Found response in cache:", response);

        return response;
      }
      console.log("No response found in cache");

      return null;
    });
  };

  const getFromPeer = function(request, response) {
    if (response) {
      return response;
    }

    return peers.match(request).then(function(response) {
      if (response) {
        console.log("Found response in peer:", response);

        return response;
      }
      console.log("No response found in peer");

      return null;
    });
  };

  const getFromNetwork = function(request, response) {
    if (response) {
      return response;
    }

    // request will always have the proper mode set ('cors, 'no-cors', etc.) so we don't
    // have to hardcode 'no-cors' like we do when fetch()ing in the install handler.
    const fetchRequest = request.clone();
    return fetch(fetchRequest).then(function(response) {
      console.log("Response from network is:", response);
      if (!response.ok) {
        return response;
      }

      cacheResponse(request, response);

      return response;
    });
  };

  const getArrayBufferResponse = function(request, response) {
    if (event.request.headers.get("range")) {
      const ab = response.arrayBuffer();
      var pos = Number(
        /^bytes\=(\d+)\-$/g.exec(request.headers.get("range"))[1]
      );

      console.log(
        "Range request for",
        event.request.url,
        ", starting position:",
        pos
      );

      return new Response(ab.slice(pos), {
        status: 206,
        statusText: "Partial Content",
        headers: [
          // ['Content-Type', 'video/webm'],
          [
            "Content-Range",
            "bytes " + pos + "-" + (ab.byteLength - 1) + "/" + ab.byteLength
          ]
        ]
      });
    }

    console.log("Non-range request for", event.request.url);

    return response;
  };

  const fetchResponse = async function(request) {
    try {
      let cachedResponse = await getFromCache(request);
      let peerResponse = await getFromPeer(request, cachedResponse);
      let networkResponse = await getFromNetwork(request, peerResponse);
      let finalResponse = await getArrayBufferResponse(
        request,
        networkResponse
      );
      console.log(`Got the final result: ${finalResponse}`);
    } catch (error) {
      // This catch() will handle exceptions thrown from the fetch() operation.
      // Note that a HTTP error response (e.g. 404) will NOT trigger an exception.
      // It will return a normal response object that has the appropriate error code set.
      console.error("Fetching failed:", error);

      throw error;
    }
  };

  return function fetch(event) {
    console.log("Handling fetch event for", event.request.url);
    // Only call event.respondWith() if this looks like a YouTube API request.
    // Because we don't call event.respondWith() for non-YouTube API requests, they will not be
    // handled by the service worker, and the default network behavior will apply.
    if (event.request.url.match(regex)) {
      event.respondWith(fetchResponse(event.request));
    }
  };
}
