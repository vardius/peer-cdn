export default class Middleware {
  // Apply middleware fastest win
  applyFastest(...middleware) {
    return async request => {
      const puts = [];
      const response = await Promise.race(
        middleware.map(factory => {
          const middleware = factory(request);
          puts.push(middleware.put);

          return middleware.get();
        })
      );

      this._composeHandlers(...puts)(response);

      return response;
    };
  }

  // Apply middleware in order
  applyOrdered(...middleware) {
    return async request => {
      const composed = await this._composePlugins(middleware)(request);
      return await composed.get();
    };
  }

  // Composes middleware into single object
  // Automatically skips next calls when response is not null
  // Call put method for previous middleware with given response
  _composePlugins(funcs) {
    if (funcs.length === 0) {
      return () => ({ get: () => null });
    }

    return funcs.reduce((a, b) => async request => {
      const x = await a(request);
      let response = await x.get();
      if (response !== null) {
        // pass response to put method
        x.put && x.put(response);

        return {
          get: () => response,
        };
      }

      const y = await b(request);
      response = await y.get();

      return {
        get: () => response,
        put: this._composeHandlers(y.put, x.put)
      };
    });
  }

  // Composes handler methods for previous middleware into single one
  _composeHandlers(...funcs) {
    // If handler is not a function, mock it
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
}
