export default class Network {
  constructor() {
    this.getFetchMiddleware = this.getFetchMiddleware.bind(this);
  }

  // Middleware factory function for fetch event
  getFetchMiddleware(request) {
    return {
      get: async () => {
        return await fetch(request);
      }
    };
  }
}
