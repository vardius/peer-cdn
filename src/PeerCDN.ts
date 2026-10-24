import { report } from './report.js';
import { Router } from './router.js';
import type { ExtendableEventLike, FetchEventLike, Handler, MiddlewareFactory, Strategy } from './types.js';

/** The parts of a service worker's global scope that PeerCDN.register uses. */
export interface WorkerScope {
  addEventListener(type: 'install' | 'activate', listener: (event: ExtendableEventLike) => void): void;
  addEventListener(type: 'fetch', listener: (event: FetchEventLike) => void): void;
  skipWaiting(): Promise<void>;
  readonly clients: { claim(): Promise<unknown> };
  readonly location: { readonly origin: string };
}

/**
 * Where a response runs or renders as code on the site's origin with no Subresource Integrity to check it, as
 * page loads also do: embedded objects, workers, worklets and XSLT stylesheets. A visitor could send anything.
 */
const UNCHECKED_CODE = new Set<RequestDestination>([
  'object',
  'embed',
  'worker',
  'sharedworker',
  'audioworklet',
  'paintworklet',
  'xslt',
]);

/** The service worker side of peer-cdn: routes requests for your site's assets through middleware. */
export class PeerCDN {
  readonly #router = new Router<Handler>();

  /**
   * Answers GET requests for path, and every path below it, with middleware combined by strategy. A segment
   * starting with ":" matches any one segment; the most specific route wins.
   */
  GET(path: string, strategy: Strategy, ...middleware: MiddlewareFactory[]): this {
    this.#router.add(path, strategy(...middleware));
    return this;
  }

  /**
   * Listens for the worker's events. A new worker takes over at once, and requests that match a route go
   * through it; when no middleware answers, the request goes to the network. Other requests, including those
   * to other origins, are left to the browser, and so are page loads, frames and what UNCHECKED_CODE lists,
   * whatever their path: the cache may hold a visitor's bytes.
   */
  register(scope: WorkerScope = globalThis as unknown as WorkerScope): void {
    scope.addEventListener('install', (event) => {
      event.waitUntil(scope.skipWaiting());
    });
    scope.addEventListener('activate', (event) => {
      event.waitUntil(scope.clients.claim());
    });
    scope.addEventListener('fetch', (event) => {
      const { request } = event;
      if (request.method !== 'GET' || request.mode === 'navigate' || UNCHECKED_CODE.has(request.destination)) return;
      const url = new URL(request.url);
      if (url.origin !== scope.location.origin) return;
      const handler = this.#router.match(url.pathname);
      if (!handler) return;
      event.respondWith(
        handler(event).then(
          (response) => response ?? fetch(request),
          (error: unknown) => {
            report(error);
            return fetch(request);
          },
        ),
      );
    });
  }
}
