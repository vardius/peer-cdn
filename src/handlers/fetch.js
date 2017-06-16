function applyMiddleware(...middlewares) {
  return async event => {
    const composed = await compose(middlewares)(event);
    return await composed.get();
  };
}

function compose(funcs) {
  if (funcs.length === 0) {
    return arg => ({ get: () => arg });
  }

  return funcs.reduce((a, b) => async event => {
    const x = await a(event);
    let response = x.get();
    if (response !== null) {
      return {
        get: () => response,
        put: () => {}
      };
    }

    const y = await b(event);
    response = y.get();
    if (response !== null) {
      x.put(response);
    }

    return {
      get: () => response,
      put: r => {
        y.put(r);
        x.put(r);
      }
    };
  });
}

async function fetchResponse(event, middlewares) {
  try {
    return await applyMiddleware(...middlewares)(event);
  } catch (error) {
    // This catch() will handle exceptions thrown from the fetch() operation.
    // Note that a HTTP error response (e.g. 404) will NOT trigger an exception.
    // It will return a normal response object that has the appropriate error code set.
    throw error;
  }
}

export default function getFetch(regex) {
  return middlewares => event => {
    // If regex !== null - only call event.respondWith() if request.url matches regex.
    // Because we don't call event.respondWith() for other requests, they will not be
    // handled by the service worker, and the default network behavior will apply.

    if (event.request.url.match(regex) || regex === null) {
      event.respondWith(fetchResponse(event, middlewares));
    }
  };
}
