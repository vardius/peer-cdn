/** The parts of a service worker's FetchEvent that peer-cdn uses. */
export interface FetchEventLike {
  readonly request: Request;
  /** The page that made the request, or "" when there is none yet, as for a navigation. */
  readonly clientId: string;
  respondWith(response: Promise<Response>): void;
  waitUntil(promise: Promise<unknown>): void;
}

/** The parts of a service worker's install and activate events that peer-cdn uses. */
export interface ExtendableEventLike {
  waitUntil(promise: Promise<unknown>): void;
}

/**
 * One source of responses, for one request. get returns the response, or null to pass the request on; put, if
 * present, receives a copy of the response another middleware returned, to keep it.
 */
export interface Middleware {
  get(): Promise<Response | null> | Response | null;
  put?(response: Response): Promise<void> | void;
}

/** Makes the middleware for a request: what a plugin's getMiddleware is. */
export type MiddlewareFactory = (event: FetchEventLike) => Middleware;

/** Answers a request, or resolves with null when no middleware could. */
export type Handler = (event: FetchEventLike) => Promise<Response | null>;

/** Combines middleware into a handler: ordered or fastest. */
export type Strategy = (...middleware: MiddlewareFactory[]) => Handler;
