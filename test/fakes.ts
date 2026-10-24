import { vi } from 'vitest';
import type { FetchEventLike, Middleware } from '../src/types.js';

/** A fetch event for url, and what the worker did with it. */
export function fetchEvent(
  url = 'https://example.com/app.js',
  { clientId = '', destination, ...init }: RequestInit & { clientId?: string; destination?: RequestDestination } = {},
) {
  const kept: Promise<unknown>[] = [];
  let response: Promise<Response> | undefined;
  const request = new Request(url, init);
  // Node's requests have none: a browser's says what will use the response.
  if (destination !== undefined) Object.defineProperty(request, 'destination', { value: destination });
  const event: FetchEventLike = {
    request,
    clientId,
    respondWith: (answer) => {
      response = answer;
    },
    waitUntil: (promise) => {
      kept.push(promise);
    },
  };
  return {
    event,
    /** What the worker answered with, if it answered. */
    get response() {
      return response;
    },
    /** Resolves once everything the event was told to wait for has. */
    settled: () => Promise.all(kept),
  };
}

/** A promise with its resolve function, to settle it when a test says so. */
export function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  const promise = new Promise<T>((done) => (resolve = done));
  return { promise, resolve };
}

/** A middleware that answers with get, and remembers what it was given to keep. */
export function middleware(get: () => Promise<Response | null> | Response | null, withPut = true) {
  const kept: string[] = [];
  let asked = 0;
  const created: Middleware = {
    get: () => {
      asked++;
      return get();
    },
  };
  if (withPut) {
    created.put = async (response) => {
      kept.push(await response.text());
    };
  }
  return {
    factory: () => created,
    /** The bodies it was given to keep. */
    kept,
    get asked() {
      return asked;
    },
  };
}

/** Collects the errors peer-cdn reports as uncaught, instead of failing the test run with them. */
export function captureReports(): unknown[] {
  const reported: unknown[] = [];
  vi.stubGlobal('queueMicrotask', (callback: () => void) => {
    try {
      callback();
    } catch (error) {
      reported.push(error);
    }
  });
  return reported;
}
