export default function getFetch(router) {
  return event => {
    try {
      const request = event.request;
      const url = new URL(request.url);
      const handler = router.getHandler(request.method, url.pathname);
      if (handler) {
        event.respondWith(handler(request));
      }

      // find out if other request are being handlet by noetwork not sw
      // return event.respondWith(fetch(request));
    } catch (error) {
      // This catch() will handle exceptions thrown from the fetch() operation.
      // Note that a HTTP error response (e.g. 404) will NOT trigger an exception.
      // It will return a normal response object that has the appropriate error code set.
      throw error;
    }
  };
}
