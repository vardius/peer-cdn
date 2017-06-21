// Middleware used for install and activate
export function applyMiddleware(...middlewares) {
  return async event => {
    return await compose(middlewares)(event);
  };
}

// Compose used for install and activate
export function compose(funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((a, b) => async (...args) => await b(await a(...args)));
}

// Apply fetch middleware fastest win
export function fetchFastest(...middlewares) {
  return async event => {
    const puts = [];
    const response = await Promise.race(
      middlewares.map(factory => {
        const middleware = factory(event);
        puts.push(middleware.put);

        return middleware.get();
      })
    );

    composePut(...puts)(response);

    return response;
  };
}

// Apply fetch middleware in order
export function fetchOrdered(...middlewares) {
  return async event => {
    const composed = await composeGet(middlewares)(event);
    return await composed.get();
  };
}

// Composes middleware into single object
// Automatically skips next calls when response is not null
// Call put method for previous middlewares with given response
function composeGet(funcs) {
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
    if (typeof func === "function") {
      func(...args);
    }
  });

  return funcs.reduce((a, b) => (...args) => {
    a(...args);
    b(...args);
  });
}
