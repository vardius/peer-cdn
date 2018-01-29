const Router = require('../src/router/Router').default;
const Middleware = require('../src/router/Middleware').default;

describe("Router", () => {
  it("should call global handler", () => {
    let calledPut = false;
    const requestMock = {};
    const mockPluginFactory = () => ({
      get: () => 'world',
      put: () => calledPut = true,
    })

    const router = new Router();
    const middleware = new Middleware();

    router.use('GET', '/', middleware.applyFastest, mockPluginFactory);

    const handler = router.getHandler('GET', '/x');

    const promise = handler(requestMock);
    promise.then(
      function (response) {
        expect(response).toEqual('world');
        expect(calledPut).toEqual(true);
      },
      function (e) {
        expect('Promise failed').toEqual(e);
      }
    );
  });

  it("should call handler", () => {
    let calledPut = false;
    const requestMock = {};
    const mockPluginFactory = () => ({
      get: () => 'world',
      put: () => calledPut = true,
    })

    const router = new Router();
    const middleware = new Middleware();

    router.use('GET', '/x', middleware.applyFastest, mockPluginFactory);

    const handler = router.getHandler('GET', '/x');

    const promise = handler(requestMock);
    promise.then(
      function (response) {
        expect(response).toEqual('world');
        expect(calledPut).toEqual(true);
      },
      function (e) {
        expect('Promise failed').toEqual(e);
      }
    );
  });

  it("should not call global handler", () => {
    const mockPluginFactory = () => ({
      get: () => 'world',
      put: () => null,
    })

    const router = new Router();
    const middleware = new Middleware();

    router.use('GET', '/x', middleware.applyFastest, mockPluginFactory);

    const handler = router.getHandler('GET', '/y');
    expect(handler).toEqual(null);
  });
});
