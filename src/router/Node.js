export default class Node {
  constructor(id, parent = null) {
    this.id = id;
    this.parent = parent;
    this.regexp = null;
    this.children = [];
    this.route = null;

    this.isRoot = this.isRoot.bind(this);
    this.isLeaf = this.isLeaf.bind(this);
    this.addChild = this.addChild.bind(this);
    this.getChild = this.getChild.bind(this);
  }

  isRoot() {
    return this.parent === null;
  }

  isLeaf() {
    return this.children.lenngth === 0;
  }

  addChild(path) {
    if (path === "") {
      return this;
    }

    const parts = path.split("/");
    for (let child in this.children) {
      if (child._isMatch(parts[0])) {
        return child.addChild(parts.slice(1).join("/"));
      }
    }

    const node = new Node(parts[0], this);
    return node.addChild(parts.slice(1).join("/"));
  }

  getChild(path) {
    if (path === "") {
      return this;
    }

    const parts = path.split("/");
    for (let child in this.children) {
      if (child._isMatch(parts[0])) {
        return child.getChild(parts.slice(1).join("/"));
      }
    }

    return null;
  }

  getMiddleware() {
    const middleware = this.route.middleware.slice();
    let parentMiddleware = [];
    if (!this.isRoot) {
      parentMiddleware = this.parent.getMiddleware();
    }

    return parentMiddleware.concat(middleware);
  }

  _isMatch(id) {
    if (this.id.startsWith(":")) {
      try {
        const regexp = new RegExp(this.id);

        return regexp.test(id);
      } catch (e) {
        return true;
      }
    }

    return this.id === id;
  }
}
