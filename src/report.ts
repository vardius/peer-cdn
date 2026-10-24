/**
 * Rethrows error in a microtask, where the host reports it as uncaught: for a middleware's error, which mustn't
 * fail the request but shouldn't be lost either.
 */
export function report(error: unknown): void {
  queueMicrotask(() => {
    throw error;
  });
}
