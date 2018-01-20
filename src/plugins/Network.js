export default class Network {
  constructor() {
    this.getMiddleware = this.getMiddleware.bind(this);
  }

  // Middleware factory function for fetch event
  getMiddleware(request) {
    return {
      get: async () => await fetch(request)
    };
  }
}
