// Apply fetch middleware
function applyMiddleware(...middlewares) {
  return async event => {
    const composed = await compose(middlewares)(event);
    return await composed.get();
  };
}

// Composes middleware into single object
// Automatically skips next calls when response is not null
// Call put method for previous middlewares with given response
function compose(funcs) {
  if (funcs.length === 0) {
    return arg => ({ get: () => arg });
  }

  return funcs.reduce((a, b) => async event => {
    const x = await a(event);
    let response = await x.get();
    if (response !== null) {
      return {
        get: () => response,
        put: () => {}
      };
    }

    const y = await b(event);
    response = await y.get();
    if (response !== null) {
      x.put(response);
    }

    return {
      get: () => response,
      put: composePut(x.put, y.put)
    };
  });
}

// Composes put methods for previous middlewares into single one
function composePut(...funcs) {
  // If middleware has no put method, mock it
  funcs = funcs.map(func => (...args) => {
    if (typeof response === "function") {
      func(...args);
    }
  });

  return funcs.reduce((a, b) => (...args) => {
    a(...args);
    b(...args);
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

    // const handler = router.match(event.request);

    // if (handler) {
    //   event.respondWith(handler(event.request));
    // } else if (router.default &&
    //   event.request.method === 'GET' &&
    //   // Ensure that chrome-extension:// requests don't trigger the default route.
    //   event.request.url.indexOf('http') === 0) {
    //   event.respondWith(router.default(event.request));
    // }
  };
}
