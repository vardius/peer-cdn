export default function getInstall() {
  return function install(event) {
    event.waitUntil(self.skipWaiting());
  };
}
