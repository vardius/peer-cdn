interface Route<T> {
  segments: readonly string[];
  value: T;
}

/**
 * Finds the route for a path. A route matches its own path and every path below it, and a segment starting with
 * ":" matches any one segment. When several routes match, the most specific wins: the longest, then the one
 * with a fixed segment where the other has a ":" segment.
 */
export class Router<T> {
  readonly #routes: Route<T>[] = [];

  /** Adds a route, or replaces the one with the same pattern. */
  add(pattern: string, value: T): void {
    const segments = split(pattern);
    const key = shape(segments);
    const index = this.#routes.findIndex((route) => shape(route.segments) === key);
    if (index === -1) this.#routes.push({ segments, value });
    else this.#routes[index] = { segments, value };
  }

  match(path: string): T | undefined {
    const segments = split(path);
    let best: Route<T> | undefined;
    for (const route of this.#routes) {
      if (!matches(route.segments, segments)) continue;
      if (!best || moreSpecific(route.segments, best.segments)) best = route;
    }
    return best?.value;
  }
}

const split = (path: string): string[] => path.split('/').filter((segment) => segment !== '');

const isParam = (segment: string): boolean => segment.startsWith(':');

/** The pattern with its ":" segments' names left out: patterns of the same shape match the same paths. */
const shape = (segments: readonly string[]): string => segments.map((s) => (isParam(s) ? ':' : s)).join('/');

function matches(route: readonly string[], path: readonly string[]): boolean {
  if (route.length > path.length) return false;
  return route.every((segment, i) => isParam(segment) || segment === path[i]);
}

function moreSpecific(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return a.length > b.length;
  for (let i = 0; i < a.length; i++) {
    const fixedA = !isParam(a[i] ?? '');
    const fixedB = !isParam(b[i] ?? '');
    if (fixedA !== fixedB) return fixedA;
  }
  return false;
}
