import applyMiddleware from "./middleware";

export default function getActivate(middlewares) {
  return function activate(event) {
    event.waitUntil(applyMiddleware(...middlewares)(event));
  };
}
