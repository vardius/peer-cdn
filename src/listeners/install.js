import { applyMiddleware } from "../scripts/middleware";

export default function getInstall(middlewares) {
  return function install(event) {
    self.skipWaiting();
    event.waitUntil(applyMiddleware(...middlewares)(event));
  };
}
