import { BroadcastChannelSignaling } from 'peer-data';
import { PeerPlugin } from 'peer-cdn';

// The page the service worker test's worker controls, set up as examples/main.ts sets up the example site's,
// but signaling between this page and the test.
const room = new URLSearchParams(location.search).get('room') ?? 'sw-test';
const signaling = new BroadcastChannelSignaling(room);
const plugin = new PeerPlugin({ signaling, room });
// For the test, to see when this page has connected.
Object.assign(window, { peerPlugin: plugin });
window.addEventListener('pagehide', () => {
  plugin.close();
  signaling.close();
});
