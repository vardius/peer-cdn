import Route from "./Route";
import Tree from "./Tree";

export default class Router {
  constructor() {
    this.tree = new Tree();

    this.use = this.use.bind(this);
    this.fetch = this.fetch.bind(this);
  }

  use(method, pattern, strategy, ...middleware) {
    const path = method + "/" + this._trimSlash(pattern);
    const node = this.tree.insert(path);
    node.route = new Route(strategy);
    node.route.addMiddleware(middleware);
  }

  getHandler(url) {
    const node = this.tree.find(this._trimSlash(url));
    if (!node) {
      return null;
    }

    return node.route.strategy(...node.getMiddleware());
  }

  _trimSlash(path) {
    return path.replace(/^\/+|\/+$/g, "");
  }
}
