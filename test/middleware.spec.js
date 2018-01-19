const Middleware = require('../src/router/Middleware').default;

describe("Middleware", () => {
  it("applyOrdered should call plugins in order", () => {
    const calledPut = [];
    const middleware = new Middleware();

    // should have been called in order
    const plugins = [
      // will not fetch response
      // should have put called
      () => ({
        get: () => null,
        put: () => calledPut.push(1)
      }),
      // will fetch response
      // should have put called
      () => ({
        get: () => 'world',
        put: () => calledPut.push(2)
      }),
      // will fetch response
      // should have not been called at all
      () => ({
        get: () => 'universe',
        put: () => calledPut.push(3)
      }),
    ];

    const compiled = middleware.applyOrdered(...plugins);

    compiled('request').then(
      function (response) {
        expect(response).toEqual('world');
        expect(calledPut).toEqual([2, 1]);
      },
      function (e) {
        expect('Compiled order middleware promise failed').toEqual(e);
      }
    );
  });

  it("applyFastest should return the fastest one", () => {
    const calledPut = [];
    const middleware = new Middleware();

    // fastest one should return response
    const plugins = [
      // will not fetch response
      // should have put called
      () => ({
        get: async () => await new Promise(resolve => setTimeout(() => resolve(null)), 100),
        put: () => calledPut.push(1)
      }),
      // will fetch response
      // should have put called
      () => ({
        get: async () => await new Promise(resolve => setTimeout(() => resolve('world')), 200),
        put: () => calledPut.push(2)
      }),
      // will fetch response
      // should have put called
      () => ({
        get: async () => await new Promise(resolve => setTimeout(() => resolve('universe')), 300),
        put: () => calledPut.push(3)
      }),
    ];

    const compiled = middleware.applyFastest(...plugins);

    compiled('request').then(
      function (response) {
        expect(response).toEqual('world');
        expect(calledPut.length).toEqual(3);
      },
      function (e) {
        expect('Compiled fastest middleware promise failed').toEqual(e);
      }
    );
  });
});
