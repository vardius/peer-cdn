export default class Peers {
  constructor() {
    this.match = this.match.bind(this);
  }

  match(request) {
    console.log("Peers handle request match: ", request);
    return new Promise(() => null);
  }
}
