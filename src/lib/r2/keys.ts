/**
 * R2 layout (SPEC.md §5.2): two top-level prefixes, both content-addressed.
 *
 *   blobs/<hex-sha256>      every file ever published, once
 *   manifests/<hex-sha256>  every manifest JSON, once
 */

export function blobKey(hashHex: string): string {
  return `blobs/${hashHex}`;
}

export function manifestKey(hashHex: string): string {
  return `manifests/${hashHex}`;
}
