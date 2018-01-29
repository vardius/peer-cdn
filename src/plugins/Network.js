export default class Network {
  constructor() {
    this.getMiddleware = this.getMiddleware.bind(this);
  }

  // Middleware factory function for fetch event
  getMiddleware(event) {
    const request = event.request.clone();

    return {
      get: async function () { return await fetch(request); }
    };
  }
}
