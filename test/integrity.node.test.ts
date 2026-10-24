import { expect, test } from 'vitest';
import { matchesIntegrity } from '../src/integrity.js';

const hello = new TextEncoder().encode('hello').buffer;
// Digests of "hello" from openssl dgst -binary | base64.
const SHA256 = 'sha256-LPJNul+wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ=';
const SHA384 = 'sha384-WeF0h3dEjGnea4ANejO7+5/xtGPkQ1TDVTvNucZm+pASWjx5+QOXvfX2oT3oKGhP';
const SHA512 = 'sha512-m3HSJL1i83hdltRq0+o9czGb+8KJDKra4t/3JRlnPKcjI8PZm6XBHXx6zG4UuMXaDEZjR1wuXDre9G9zvN7AQw==';
// The digest of "other".
const OTHER256 = 'sha256-2SmKENGwc1g33EvYXaxkGw887yekfl1TpU8vP1svz/o=';

test('a body matches the hash of its bytes', async () => {
  expect(await matchesIntegrity(SHA256, hello)).toBe(true);
  expect(await matchesIntegrity(SHA384, hello)).toBe(true);
  expect(await matchesIntegrity(SHA512, hello)).toBe(true);
});

test('a body does not match the hash of other bytes', async () => {
  expect(await matchesIntegrity(OTHER256, hello)).toBe(false);
});

test('any hash of the strongest algorithm listed may match', async () => {
  expect(await matchesIntegrity(`${OTHER256} ${SHA256}`, hello)).toBe(true);
});

test('only the strongest algorithm listed counts', async () => {
  const wrong384 = 'sha384-' + 'A'.repeat(64);
  expect(await matchesIntegrity(`${SHA256} ${wrong384}`, hello)).toBe(false);
  expect(await matchesIntegrity(`${OTHER256} ${SHA512}`, hello)).toBe(true);
});

test('options after a hash are ignored', async () => {
  expect(await matchesIntegrity(`${SHA256}?ct=text/plain`, hello)).toBe(true);
});

test('metadata with no hash it knows matches any body', async () => {
  expect(await matchesIntegrity('md5-XUFAKrxLKna5cZ2REBfFkg==', hello)).toBe(true);
  expect(await matchesIntegrity('  ', hello)).toBe(true);
});
