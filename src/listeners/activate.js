export default function getActivate() {
  return function activate(event) {
    event.waitUntil(self.clients.claim());
  };
}
