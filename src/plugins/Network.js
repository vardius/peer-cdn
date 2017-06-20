export default class Network {
  constructor(options) {
    this.chunkSize = options.chunkSize || 204800;
    this.getFetchMiddleware = this.getFetchMiddleware.bind(this);
  }

  // Middleware factory function for fetch event
  getFetchMiddleware(event) {
    return {
      get: async () => {
        // if (event.request.headers.get("range")) {
        //   const response = await fetch(event.request.clone());

        //   return await this.getPartialResponse(event.request, response);
        // }

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
    // eslint-disable-next-line
    const pos = Number(/^bytes\=(\d+)\-$/g.exec(req.headers.get("range"))[1]);
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

  onHeadResponse(req, res) {
    const contentLength = res.headers.get("content-length");
    const promises = Array.from({
      length: Math.ceil(contentLength / this.chunkSize)
    }).map((_, i) => {
      const headers = new Headers(req.headers);
      headers.append(
        "Range",
        `bytes=${i * this.chunkSize}-${i * this.chunkSize + this.chunkSize - 1}/${contentLength}`
      );

      return fetch(new Request(req, { headers }));
    });

    return Promise.all(promises)
      .then(responses => Promise.all(responses.map(res => res.arrayBuffer())))
      .then(buffers => new Response(buffers.reduce(this.concatArrayBuffer), { headers: res.headers }));
  }
  
  concatArrayBuffer(ab1, ab2) {
    const ab = new Uint8Array(ab1.byteLength + ab2.byteLength);
    ab.set(new Uint8Array(ab1), 0);
    ab.set(new Uint8Array(ab2), ab1.byteLength);

    return ab.buffer;
  }
}
