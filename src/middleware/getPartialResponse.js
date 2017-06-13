export default function getPartialResponse(event) {
  return async response => {
    if (event.request.headers.get("range")) {
      const ab = await response.arrayBuffer();

      var pos = Number(
        /^bytes\=(\d+)\-$/g.exec(event.request.headers.get("range"))[1]
      );

      console.log(
        "Range request for",
        event.request.url,
        ", starting position:",
        pos,
        "Array buffer:",
        ab
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

    console.log("Non-range request for", event.request.url);

    return response;
  };
}
