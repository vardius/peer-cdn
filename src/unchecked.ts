/**
 * The header DelegatePlugin adds to a response from a peer that nothing checked: one for media, whose request
 * had no Subresource Integrity metadata. CachePlugin gives such a response only to media requests.
 */
export const UNCHECKED_HEADER = 'Peer-CDN-Unchecked';

/** What the browser only shows or plays, which a peer can't use to run code on the site, or change what does. */
const MEDIA = new Set<RequestDestination>(['image', 'font', 'audio', 'video', 'track']);

/** Reports whether a peer's bytes, unchecked, may answer request: whether it's for an image, a font or media. */
export function takesUnchecked(request: Request): boolean {
  return MEDIA.has(request.destination);
}
