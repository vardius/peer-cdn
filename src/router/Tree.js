export default class Tree {
  constructor() {
    this.root = new Node("", null);

    this.find = this.find.bind(this);
    this.insert = this.insert.bind(this);
    this.insert = this.insert.bind(this);
  }

  find(path) {
    return this.root.getChild(path);
  }

  insert(path) {
    return this.root.addChild(path);
  }
}
