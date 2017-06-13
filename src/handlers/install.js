import applyMiddleware from "./middleware";

export default function getInstall(middlewares) {
  return function install(event) {
    console.log(applyMiddleware);
    event.waitUntil(applyMiddleware(...middlewares)(event));
  };
}
