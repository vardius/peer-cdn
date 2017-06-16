import applyMiddleware from "./middleware";

export default function getActivate(middlewares) {
  middlewares = middlewares.concat([self.clients.claim()]);

  return function activate(event) {
    event.waitUntil(applyMiddleware(...middlewares)(event));
  };
}
