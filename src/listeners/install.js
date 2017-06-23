export default function getInstall() {
  return function install() {
    self.skipWaiting();
  };
}
