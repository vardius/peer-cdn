import { expect, test } from 'vitest';
import { Router } from '../src/router.js';

function router(...patterns: string[]): Router<string> {
  const created = new Router<string>();
  for (const pattern of patterns) created.add(pattern, pattern);
  return created;
}

// peer-cdn 1.0.5 matched a route's own path only.
test('a route matches the paths below it', () => {
  expect(router('/js').match('/js/main.js')).toBe('/js');
  expect(router('/js').match('/js/vendor/lib.js')).toBe('/js');
  expect(router('/js').match('/js')).toBe('/js');
});

test('a route does not match a path that only starts with the same letters', () => {
  expect(router('/js').match('/jsx/main.js')).toBeUndefined();
  expect(router('/js').match('/')).toBeUndefined();
});

test('"/" matches every path', () => {
  expect(router('/').match('/')).toBe('/');
  expect(router('/').match('/images/logo.png')).toBe('/');
});

// peer-cdn 1.0.5 tested segments against ":file" as a regular expression, which matched only segments
// containing ":file".
test('a ":" segment matches any one segment', () => {
  expect(router('/static/:file').match('/static/logo.png')).toBe('/static/:file');
  expect(router('/static/:file').match('/static')).toBeUndefined();
  expect(router('/:lang/docs').match('/en/docs/intro')).toBe('/:lang/docs');
  expect(router('/:lang/docs').match('/en/blog')).toBeUndefined();
});

test('the longest matching route wins, whatever order they were added in', () => {
  expect(router('/', '/images', '/images/icons').match('/images/icons/a.svg')).toBe('/images/icons');
  expect(router('/images/icons', '/images', '/').match('/images/icons/a.svg')).toBe('/images/icons');
  expect(router('/images/icons', '/images', '/').match('/images/a.png')).toBe('/images');
  expect(router('/images/icons', '/images', '/').match('/fonts/a.woff2')).toBe('/');
});

test('of routes as long, the one with a fixed segment first wins over a ":" one', () => {
  expect(router('/:dir/logo.png', '/images/:file').match('/images/logo.png')).toBe('/images/:file');
  expect(router('/images/:file', '/:dir/logo.png').match('/images/logo.png')).toBe('/images/:file');
});

test('a route with the same shape replaces the one before', () => {
  const created = new Router<string>();
  created.add('/static/:file', 'first');
  created.add('/static/:name', 'second');
  expect(created.match('/static/a.css')).toBe('second');
});

test('empty segments are ignored', () => {
  expect(router('/js/').match('//js//main.js')).toBe('/js/');
});
