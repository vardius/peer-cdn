import MessageClient from '../clients/MessageClient';

// Delegates request to a client with send message
export default class Delegate {
  constructor(options) {
    this.timeoutAfter = undefined;

    if (options) {
      const { timeoutAfter } = options;
      this.timeoutAfter = timeoutAfter;
    }

    this.getMiddleware = this.getMiddleware.bind(this);
  }

  // Middleware factory function for fetch event
  getMiddleware(event) {
    const request = event.request.clone();

    return {
      get: async () => {
        // do not cache ranged responses
        // https://github.com/vardius/peer-cdn/issues/7
        if (request.headers.has("range")) {
          return null;
        }

        // Exit early if we don't have access to the client.
        // Eg, if it's cross-origin.
        if (!event.clientId) return null;

        // eslint-disable-next-line
        const client = await clients.get(event.clientId);
        const msgClient = new MessageClient(this.timeoutAfter);
        try {
          // we can not send request to a client so we do have to mock it
          // the way it is enough for peer plugin
          const response = await msgClient.sendMessageToClient(client, { url: request.url });
          if (response) {
            return response;
          }

          return null;
        } catch (e) {
          return null;
        }
      }
    };
  }
}
