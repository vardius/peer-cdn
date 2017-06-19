import applyMiddleware from "./middleware";

export default function getInstall(middlewares) {
  return function install(event) {
    self.skipWaiting();
    event.waitUntil(applyMiddleware(...middlewares)(event));
  };
}
