const ALGORITHMS = { sha256: 'SHA-256', sha384: 'SHA-384', sha512: 'SHA-512' } as const;
type Algorithm = keyof typeof ALGORITHMS;
/** Weakest first. */
const STRENGTH: readonly Algorithm[] = ['sha256', 'sha384', 'sha512'];

const HASH = /^(sha256|sha384|sha512)-([A-Za-z0-9+/]+={0,2})(?:\?.*)?$/;

/**
 * Reports whether integrity, Subresource Integrity metadata such as a script's integrity attribute, has a hash
 * to check a body against. Browsers check nothing for metadata without one, as for an unknown algorithm.
 */
export function hasHash(integrity: string): boolean {
  return hashesOf(integrity).length > 0;
}

/**
 * Reports whether body matches integrity. Like browsers, it checks the strongest algorithm listed, and metadata
 * without a hash it knows matches any body.
 */
export async function matchesIntegrity(integrity: string, body: ArrayBuffer): Promise<boolean> {
  const hashes = hashesOf(integrity);
  if (hashes.length === 0) return true;

  const strongest = hashes.reduce((a, b) => (STRENGTH.indexOf(b.algorithm) > STRENGTH.indexOf(a.algorithm) ? b : a));
  const digest = base64(await crypto.subtle.digest(ALGORITHMS[strongest.algorithm], body));
  return hashes.some((hash) => hash.algorithm === strongest.algorithm && hash.digest === digest);
}

function hashesOf(integrity: string): { algorithm: Algorithm; digest: string }[] {
  const hashes: { algorithm: Algorithm; digest: string }[] = [];
  for (const token of integrity.split(/\s+/)) {
    const match = HASH.exec(token);
    if (match) hashes.push({ algorithm: match[1] as Algorithm, digest: match[2] ?? '' });
  }
  return hashes;
}

function base64(bytes: ArrayBuffer): string {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary);
}
