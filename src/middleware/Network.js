export default class Network {
  constructor() {}

  // Middleware factory function for fetch event
  getMiddleware(event) {
    return {
      get: async () => {
        // event.request will always have the proper mode set ('cors, 'no-cors', etc.) so we don't
        // have to hardcode 'no-cors' like we do when fetch()ing in the install handler.
        const fetchRequest = event.request.clone();
        const response = await fetch(fetchRequest);

        if (!response.ok) {
          return response;
        }

        return response;
      }
    };
  }

  async getPartialResponse(request, response) {
    if (request.headers.get("range")) {
      const ab = await response.arrayBuffer();

      var pos = Number(
        /^bytes\=(\d+)\-$/g.exec(request.headers.get("range"))[1]
      );

      return new Response(ab.slice(pos), {
        status: 206,
        statusText: "Partial Content",
        headers: [
          // ['Content-Type', 'video/webm'],
          [
            "Content-Range",
            "bytes " + pos + "-" + (ab.byteLength - 1) + "/" + ab.byteLength
          ]
        ]
      });
    }

    return response;
  }
}
