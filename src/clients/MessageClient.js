export default class MessageClient {
  constructor(timeoutAfter = 1500) {
    this.timeoutAfter = timeoutAfter;

    this.sendMessageToClient = this.sendMessageToClient.bind(this);
    this.sendMessageToAllClients = this.sendMessageToAllClients.bind(this);
  }

  async sendMessageToClient(client, message) {
    // Exit early if we don't get the client.
    // Eg, if it closed.
    if (!client) return null;

    // This wraps the message posting/response in a promise, which will resolve if the response doesn't
    // contain an error, and reject with the error if it does.
    return await new Promise((resolve, reject) => {
      const messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = function (event) {
        if (event.data && event.data.error) {
          reject(event.data.error);
        } else {
          resolve(event.data);
        }
      };

      // This sends the message data as well as transferring messageChannel.port2 to the client.
      // The client can then use the transferred port to reply via postMessage(), which
      // will in turn trigger the onmessage handler on messageChannel.port1.
      // See https://html.spec.whatwg.org/multipage/workers.html#dom-worker-postmessage
      client.postMessage(message, [messageChannel.port2]);

      // Set up the timeout
      setTimeout(() => {
        messageChannel.port1.close();
        messageChannel.port2.close();

        reject('Promise timed out after ' + this.timeoutAfter + ' ms');

      }, this.timeoutAfter);
    });
  }

  async sendMessageToAllClients(message) {
    // eslint-disable-next-line
    const cs = clients.matchAll();

    return Promise.all(cs.forEach(client => this.sendMessageToclient(client, message)))
  }
}
