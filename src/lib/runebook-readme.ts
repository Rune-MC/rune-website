import { findReadme, hashHex, parseHash } from "@/lib/manifest";
import { fetchBlobPreview, fetchManifestJson } from "@/lib/r2/fetch";

const README_MAX_BYTES = 128 * 1024;

export async function loadReadme(version: {
  manifestHash: Buffer;
  readmeBlobHash?: Buffer | null;
}): Promise<{ markdown: string; truncated: boolean } | null> {
  try {
    let hash = version.readmeBlobHash;
    if (!hash) {
      const manifest = await fetchManifestJson(hashHex(version.manifestHash));
      const entry = findReadme(manifest.files);
      if (!entry?.size) return null;
      hash = parseHash(entry.hash);
    }
    const { bytes, truncated } = await fetchBlobPreview(
      hashHex(hash),
      README_MAX_BYTES,
    );
    const markdown = bytes.toString("utf8").trim();
    return markdown ? { markdown, truncated } : null;
  } catch {
    return null;
  }
}
