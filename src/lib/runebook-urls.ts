/**
 * Rune names can be scoped (`@alice/foo`). The `/` is the only character that
 * conflicts with Next.js single-segment dynamic routing, so we encode just
 * that one character and leave `@` (and others) in place for cleaner URLs.
 */
export function runeNameToUrl(name: string): string {
  return name.replace(/\//g, "%2F");
}

export function urlToRuneName(segment: string): string {
  return decodeURIComponent(segment);
}
