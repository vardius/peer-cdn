export default class Network {
  constructor(options) {
    this.chunkSize = options.chunkSize || 204800;

    this.getFetchMiddleware = this.getFetchMiddleware.bind(this);
  }

  // Middleware factory function for fetch event
  getFetchMiddleware(event) {
    return {
      get: async () => {
        const url = new URL(event.request.url);

        if (event.request.mode === "navigate")
          return event.respondWith(fetch(event.request));
        if (event.request.mode === "no-cors" && url.origin !== location.origin)
          return event.respondWith(fetch(event.request));

        const mode = url.origin === location.origin ? "same-origin" : "cors";

        // event.request will always have the proper mode set ('cors, 'no-cors', etc.) so we don't
        // have to hardcode 'no-cors' like we do when fetch()ing in the install handler.
        const request = new Request(event.request.clone(), { mode });
        const response = await fetch(new Request(request, { method: "HEAD" }));

        return await this.onHeadResponse(request, response);
      }
    };
  }

  concatArrayBuffer(ab1, ab2) {
    const ua = new Uint8Array(ab1.byteLength + ab2.byteLength);
    ua.set(new Uint8Array(ab1), 0);
    ua.set(new Uint8Array(ab2), ab1.byteLength);

    return ua.buffer;
  }

  onHeadResponse(request, response) {
    const contentLength = response.headers.get("content-length");
    const promises = Array.from({
      length: Math.ceil(contentLength / this.chunkSize)
    }).map((_, i) => {
      const headers = new Headers(request.headers);
      headers.append(
        "Range",
        `bytes=${i * this.chunkSize}-${i * this.chunkSize + this.chunkSize - 1}/${contentLength}`
      );

      return fetch(new Request(request, { headers }));
    });

    return Promise.all(promises)
      .then(responses => Promise.all(responses.map(res => res.arrayBuffer())))
      .then(buffers => new Response(buffers.reduce(this.concatArrayBuffer)));
  }
}
