/** A response as it travels between peers and from a page to its worker. */
export interface ResponseMeta {
  status: number;
  statusText: string;
  headers: [string, string][];
}

/** From the worker to a page: find url among the peers. Its port carries the replies. */
export interface FetchRequest {
  type: 'peer-cdn:fetch';
  url: string;
}

/** From a page to the worker: ack at once, then miss or the response. */
export type FetchReply = { type: 'ack' } | { type: 'miss' } | ({ type: 'response'; body: ArrayBuffer } & ResponseMeta);

/**
 * Between peers, as JSON over the data channel. To find url, a peer asks the others whether they have it; each
 * answers have or miss. It then asks one that has it to get it, and that peer sends a response followed by
 * size bytes in binary messages, or gone if it can't any more.
 */
export type PeerMessage =
  | { type: 'has'; id: number; url: string }
  | { type: 'have'; id: number }
  | { type: 'miss'; id: number }
  | { type: 'get'; id: number; url: string }
  | { type: 'gone'; id: number }
  | ({ type: 'response'; id: number; size: number } & ResponseMeta);

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

const isCount = (value: unknown): value is number => Number.isSafeInteger(value) && (value as number) >= 0;

const isHeaders = (value: unknown): value is [string, string][] =>
  Array.isArray(value) &&
  value.every((pair) => Array.isArray(pair) && pair.length === 2 && pair.every((part) => typeof part === 'string'));

const isMeta = (value: Record<string, unknown>): boolean =>
  isCount(value.status) && typeof value.statusText === 'string' && isHeaders(value.headers);

export function isFetchRequest(value: unknown): value is FetchRequest {
  return isObject(value) && value.type === 'peer-cdn:fetch' && typeof value.url === 'string';
}

export function isFetchReply(value: unknown): value is FetchReply {
  if (!isObject(value)) return false;
  if (value.type === 'ack' || value.type === 'miss') return true;
  return value.type === 'response' && value.body instanceof ArrayBuffer && isMeta(value);
}

/** The message a peer sent, or undefined if it isn't one: peers can send anything. */
export function parsePeerMessage(data: string): PeerMessage | undefined {
  let value: unknown;
  try {
    value = JSON.parse(data);
  } catch {
    return undefined;
  }
  if (!isObject(value) || !isCount(value.id)) return undefined;
  switch (value.type) {
    case 'has':
    case 'get':
      return typeof value.url === 'string' ? (value as PeerMessage) : undefined;
    case 'have':
    case 'miss':
    case 'gone':
      return value as PeerMessage;
    case 'response':
      return isCount(value.size) && isMeta(value) ? (value as PeerMessage) : undefined;
    default:
      return undefined;
  }
}

/** A Response from what a peer or page sent, or undefined if the browser rejects it, such as a bad header. */
export function toResponse(body: BodyInit | null, meta: ResponseMeta): Response | undefined {
  try {
    return new Response(body, { status: meta.status, statusText: meta.statusText, headers: meta.headers });
  } catch {
    return undefined;
  }
}

/** Headers that describe the bytes as they came over the network, not the body peers pass on. */
const TRANSPORT_HEADERS = new Set([
  'content-encoding',
  'content-length',
  'transfer-encoding',
  'connection',
  'keep-alive',
]);

/** The status and headers of response worth passing on with its body. */
export function metaOf(response: Response): ResponseMeta {
  const headers: [string, string][] = [];
  for (const [name, value] of response.headers) if (!TRANSPORT_HEADERS.has(name)) headers.push([name, value]);
  return { status: response.status, statusText: response.statusText, headers };
}

/** The directives of response's Cache-Control header, in lower case. */
export function cacheControl(response: Response): Set<string> {
  const header = response.headers.get('Cache-Control') ?? '';
  return new Set(header.split(',').map((directive) => directive.split('=')[0]?.trim().toLowerCase() ?? ''));
}
