import { compose } from "./middleware";

function applyMiddleware(...middlewares) {
  return event => async response => {
    const chain = middlewares.map(middleware => middleware(event));
    return await compose(...chain)(response);
  };
}

async function fetchResponse(event, middlewares) {
  try {
    return await applyMiddleware(...middlewares)(event)(null);
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
  };
}
