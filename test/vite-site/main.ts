/// <reference types="vite/client" />
await navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`);
