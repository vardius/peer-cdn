/// <reference types="vite/client" />
import { io } from 'socket.io-client';
import { PeerPlugin, SocketChannel } from 'peer-cdn';

const PICTURES = ['dunes', 'tide', 'orbit', 'mosaic', 'bloom', 'peaks'];

const status = document.querySelector('#status');
const gallery = document.querySelector('#gallery');
const served = document.querySelector('#served');

let foundPeer: () => void = () => undefined;
const firstPeer = new Promise<void>((resolve) => (foundPeer = resolve));

// The page side: it finds pictures among the other visitors for the worker, and shares this browser's cache.
new PeerPlugin({
  signaling: new SocketChannel(io()),
  onPeers: (count) => {
    if (status) status.textContent = `Connected to ${String(count)} other ${count === 1 ? 'visitor' : 'visitors'}.`;
    if (count > 0) foundPeer();
  },
});

// The Vite plugin serves sw.ts, bundled, as sw.js.
await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
if (!navigator.serviceWorker.controller) {
  await new Promise((resolve) => {
    navigator.serviceWorker.addEventListener('controllerchange', resolve, { once: true });
  });
}

// A peer can only send pictures once it's connected: wait a moment for one, as a page that loads its pictures
// later would.
await Promise.race([firstPeer, new Promise((resolve) => setTimeout(resolve, 3000))]);
const loaded = PICTURES.map((name) => {
  const picture = new Image(480, 320);
  picture.alt = name;
  picture.src = `/assets/${name}.svg`;
  gallery?.append(picture);
  return picture.decode().catch(() => undefined);
});
await Promise.all(loaded);

const counts = (await (await fetch('/served')).json()) as { served: number };
if (served) served.textContent = `The server has sent ${String(counts.served)} pictures since it started.`;
