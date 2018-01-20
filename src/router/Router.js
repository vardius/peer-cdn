import Route from "./Route";
import Tree from "./Tree";

export default class Router {
  constructor() {
    this.tree = new Tree();

    this.use = this.use.bind(this);
    this.getHandler = this.getHandler.bind(this);
    this._trimSlash = this._trimSlash.bind(this);
  }

  use(method, pattern, strategy, ...middleware) {
    const path = this._trimSlash(method.toUpperCase() + "/" + this._trimSlash(pattern));
    const node = this.tree.insert(path);

    node.route = new Route(strategy);
    node.route.addMiddleware(middleware);
  }

  getHandler(method, path) {
    let node = this.tree.find(this._trimSlash(method.toUpperCase() + "/" + this._trimSlash(path)));
    if (!node) {
      node = this.tree.find(this._trimSlash(method.toUpperCase()));
    }

    if (!node || !node.route) {
      return null;
    }

    return node.route.strategy(...node.getMiddleware());
  }

  _trimSlash(path) {
    return path.replace(/^\/+|\/+$/g, "");
  }
}
