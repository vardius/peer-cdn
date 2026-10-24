/** A single byte range from a Range header: first to last, first to the end, or the last suffix bytes. */
export type ByteRange = { first: number; last: number | undefined } | { suffix: number };

/**
 * The single byte range a Range header asks for, or undefined when it asks for something else (several ranges,
 * another unit) or is invalid: HTTP says to ignore such a header and send the whole body.
 */
export function parseRange(header: string): ByteRange | undefined {
  const match = /^bytes=(\d*)-(\d*)$/i.exec(header.trim());
  if (!match) return undefined;
  const [, first = '', last = ''] = match;
  if (first === '') return last === '' ? undefined : { suffix: Number(last) };
  const range = { first: Number(first), last: last === '' ? undefined : Number(last) };
  return range.last !== undefined && range.last < range.first ? undefined : range;
}

/** The first and last byte of a body of size that range covers, or undefined when it covers none of it. */
export function resolveRange(range: ByteRange, size: number): [first: number, last: number] | undefined {
  if (size === 0) return undefined;
  if ('suffix' in range) return range.suffix === 0 ? undefined : [Math.max(0, size - range.suffix), size - 1];
  if (range.first >= size) return undefined;
  return [range.first, Math.min(range.last ?? size - 1, size - 1)];
}

/**
 * The part of response a Range header asks for: a 206 response with that part, a 416 response when the range
 * lies outside the body, or undefined when the header should be ignored, leaving response unread.
 */
export async function partialResponse(header: string, response: Response): Promise<Response | undefined> {
  const range = parseRange(header);
  if (!range) return undefined;
  const body = await response.blob();
  const headers = new Headers(response.headers);
  const bounds = resolveRange(range, body.size);
  if (!bounds) {
    headers.set('Content-Range', `bytes */${String(body.size)}`);
    headers.delete('Content-Length');
    return new Response(null, { status: 416, statusText: 'Range Not Satisfiable', headers });
  }
  const [first, last] = bounds;
  headers.set('Content-Range', `bytes ${String(first)}-${String(last)}/${String(body.size)}`);
  headers.set('Content-Length', String(last - first + 1));
  return new Response(body.slice(first, last + 1), { status: 206, statusText: 'Partial Content', headers });
}
