import { report } from './report.js';
import type { FetchEventLike, Handler, Middleware, MiddlewareFactory } from './types.js';

/**
 * Asks each middleware in turn, and stops at the first response. The middleware asked before it, which had
 * nothing, each receive a copy through put: a cache before the network keeps what the network returned.
 */
export function ordered(...factories: MiddlewareFactory[]): Handler {
  return async (event) => {
    const missed: Middleware[] = [];
    for (const factory of factories) {
      const middleware = create(factory, event);
      if (!middleware) continue;
      const response = await answer(middleware);
      if (response) {
        keep(event, missed, response);
        return response;
      }
      missed.push(middleware);
    }
    return null;
  };
}

/**
 * Asks every middleware at once, and answers with the first response. Every other middleware receives a copy
 * through put.
 */
export function fastest(...factories: MiddlewareFactory[]): Handler {
  return (event) => {
    const all: Middleware[] = [];
    for (const factory of factories) {
      const middleware = create(factory, event);
      if (middleware) all.push(middleware);
    }
    return new Promise((resolve) => {
      let pending = all.length;
      let answered = false;
      if (pending === 0) resolve(null);
      for (const middleware of all) {
        void answer(middleware).then((response) => {
          pending--;
          if (answered) return;
          if (response) {
            answered = true;
            keep(
              event,
              all.filter((other) => other !== middleware),
              response,
            );
            resolve(response);
          } else if (pending === 0) {
            resolve(null);
          }
        });
      }
    });
  };
}

function create(factory: MiddlewareFactory, event: FetchEventLike): Middleware | undefined {
  try {
    return factory(event);
  } catch (error) {
    report(error);
    return undefined;
  }
}

/** The middleware's response; a middleware that throws has none. */
async function answer(middleware: Middleware): Promise<Response | null> {
  try {
    return await middleware.get();
  } catch (error) {
    report(error);
    return null;
  }
}

/** Gives each middleware with a put its own copy of response, while the event keeps the worker alive. */
function keep(event: FetchEventLike, middleware: readonly Middleware[], response: Response): void {
  const puts: Promise<void>[] = [];
  for (const keeper of middleware) {
    if (!keeper.put) continue;
    // Copied now: the browser reads the original as soon as the handler returns it.
    let copy: Response;
    try {
      copy = response.clone();
    } catch (error) {
      // The body was already read, so no later copy can succeed either.
      report(error);
      break;
    }
    puts.push(store(keeper, copy));
  }
  if (puts.length > 0) event.waitUntil(Promise.all(puts));
}

async function store(keeper: Middleware, response: Response): Promise<void> {
  try {
    await keeper.put?.(response);
  } catch (error) {
    report(error);
  }
}
