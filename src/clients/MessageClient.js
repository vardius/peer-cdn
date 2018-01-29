export default class MessageClient {
  constructor(id, timeoutAfter = 1500) {
    this.id = id;
    this.timeoutAfter = timeoutAfter;

    this.sendMessage = this.sendMessage.bind(this);
  }

  async sendMessage(message) {
    // Get the client.
    // eslint-disable-next-line
    const client = await clients.get(this.id);
    // Exit early if we don't get the client.
    // Eg, if it closed.
    if (!client) return null;

    // This wraps the message posting/response in a promise, which will resolve if the response doesn't
    // contain an error, and reject with the error if it does. If you'd prefer, it's possible to call
    // controller.postMessage() and set up the onmessage handler independently of a promise, but this is
    // a convenient wrapper.
    return await new Promise((resolve, reject) => {
      let messageChannel = new MessageChannel();
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
}
