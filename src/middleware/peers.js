export default class Peers {
  constructor() {
    this.match = this.match.bind(this);
    this.getFromPeer = this.getFromPeer.bind(this);
  }

  async match(request) {
    return null;
  }

  getFromPeer(event) {
    return async res => {
      if (res) {
        return res;
      }

      const response = await this.match(event.request);
      if (response) {
        return response;
      }

      return null;
    };
  }
}
