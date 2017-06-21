import { fetchOrdered } from "../scripts/middleware";

async function fetchResponse(event, middlewares) {
  try {
    return await fetchOrdered(...middlewares)(event);
    // return await fetchFastest(...middlewares)(event);
  } catch (error) {
    // This catch() will handle exceptions thrown from the fetch() operation.
    // Note that a HTTP error response (e.g. 404) will NOT trigger an exception.
    // It will return a normal response object that has the appropriate error code set.
    throw error;
  }
}

export default function getFetch(regex) {
  return middlewares => event => {
    // If regex !== null - only call event.respondWith() if request.url matches regex.
    // Because we don't call event.respondWith() for other requests, they will not be
    // handled by the service worker, and the default network behavior will apply.

    if (event.request.url.match(regex) || regex === null) {
      event.respondWith(fetchResponse(event, middlewares));
    }

    // const handler = router.match(event.request);

    // if (handler) {
    //   event.respondWith(handler(event.request));
    // } else if (router.default &&
    //   event.request.method === 'GET' &&
    //   // Ensure that chrome-extension:// requests don't trigger the default route.
    //   event.request.url.indexOf('http') === 0) {
    //   event.respondWith(router.default(event.request));
    // }
  };
}
