export default class Network {
  constructor() {
    this.getFetchMiddleware = this.getFetchMiddleware.bind(this);
  }

  // Middleware factory function for fetch event
  getFetchMiddleware(event) {
    return {
      get: async () => {
        if (event.request.headers.get("range")) {
          const response = await fetch(event.request.clone());

          return await this.getPartialResponse(event.request, response)
        }

        return await fetch(event.request);
      }
    };
  }

  // Return the response, obeying the range header if given
  // NOTE: Does not support 'if-range' or multiple ranges!
  // TODO: Temporary implementation, waiting on official fix:
  // https://github.com/whatwg/fetch/issues/144
  // https://github.com/slightlyoff/ServiceWorker/issues/703
  async getPartialResponse(req, res) {
    const pos = Number(/^bytes\=(\d+)\-$/g.exec(req.headers.get("range"))[1]);
    console.log(req);
    const ab = await res.arrayBuffer();
    const headers = new Headers(res.headers);

    headers.append("Content-Range", `bytes ${pos}-${ab.byteLength - 1}/${ab.byteLength}`);
    headers.append("Content-Length", ab.byteLength - pos + 1);

    return new Response(ab.slice(pos), {
      status: 206,
      statusText: "Partial Content",
      headers
    });
  }
}
