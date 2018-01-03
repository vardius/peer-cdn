import Middleware from "./Middleware";

export default class Route {
  constructor(strategy) {
    this.strategy = strategy || (new Middleware()).applyOrdered;
    this.middleware = [];

    this.addMiddleware = this.addMiddleware.bind(this);
  }

  addMiddleware(...middleware) {
    this.middleware.concat(middleware);
  }
}
