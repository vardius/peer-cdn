export default class Peers {
  constructor() {
    this.match = this.match.bind(this);
  }

  async match(request) {
    return null;
  }

  static getFromPeer = event => response => {
    if (response) {
      return response;
    }

    return this.match(event.request).then(function(response) {
      if (response) {
        return response;
      }

      return null;
    });
  };
}
