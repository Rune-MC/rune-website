import { ExternalLink } from "lucide-react";
import { CopyButton } from "@/components/runebook/copy-button";
import { detectLanguage, formatBytes, looksBinary } from "@/lib/file-language";
import type { TreeFile } from "@/lib/file-tree";
import { highlightSource } from "@/lib/highlighter";
import { hashHex, parseHash } from "@/lib/manifest";
import { fetchBlobPreview, PREVIEW_MAX_BYTES } from "@/lib/r2/fetch";

interface Props {
  file: TreeFile;
}

const TEXT_VIEW_MAX_BYTES = 800_000;

export async function FileViewer({ file }: Props) {
  const hex = hashHex(parseHash(file.entry.hash));
  const rawUrl = `/api/v1/blobs/${hex}`;
  const lang = detectLanguage(file.path);

  let body: React.ReactNode;
  let copyValue: string | null = null;

  if (file.entry.size > TEXT_VIEW_MAX_BYTES) {
    body = (
      <Placeholder
        title="File too large to preview"
        detail={`This file is ${formatBytes(file.entry.size)}. Preview is capped at ${formatBytes(TEXT_VIEW_MAX_BYTES)}.`}
        rawUrl={rawUrl}
      />
    );
  } else {
    try {
      const blob = await fetchBlobPreview(hex);
      if (looksBinary(blob.bytes)) {
        body = (
          <Placeholder
            title="Binary file"
            detail={`This file isn't text. Download the raw blob to inspect it.`}
            rawUrl={rawUrl}
          />
        );
      } else {
        const source = blob.bytes.toString("utf-8");
        copyValue = source;
        const html = await highlightSource(source, lang);
        body = (
          <>
            {blob.truncated && (
              <p className="mb-4 rounded border border-border bg-muted px-4 py-3 font-mono text-xs text-muted-foreground">
                Showing the first {formatBytes(PREVIEW_MAX_BYTES)} of{" "}
                {formatBytes(blob.totalSize)}.{" "}
                <a
                  href={rawUrl}
                  className="text-primary transition-colors hover:text-primary-hover"
                >
                  view raw
                </a>
                .
              </p>
            )}
            <div
              className="rune-code-block overflow-x-auto rounded border border-border"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output is safe HTML
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </>
        );
      }
    } catch {
      body = (
        <Placeholder
          title="Unable to load file"
          detail="The blob could not be fetched from storage. It may have been removed or the storage backend is unreachable."
          rawUrl={rawUrl}
        />
      );
    }
  }

  return (
    <article className="min-w-0">
      <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
        <div className="min-w-0">
          <p className="break-all font-mono text-sm text-foreground">
            {file.path}
          </p>
          <p className="mt-1 break-all font-mono text-[11px] text-muted-foreground">
            {formatBytes(file.entry.size)} · {file.entry.hash}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {copyValue !== null && <CopyButton value={copyValue} />}
          <a
            href={rawUrl}
            className="inline-flex items-center gap-1.5 rounded px-2 py-1 font-mono text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ExternalLink className="size-3" aria-hidden="true" />
            <span>raw</span>
          </a>
        </div>
      </header>
      <div className="mt-4">{body}</div>
    </article>
  );
}

function Placeholder({
  title,
  detail,
  rawUrl,
}: {
  title: string;
  detail: string;
  rawUrl: string;
}) {
  return (
    <div className="rounded border border-dashed border-border px-6 py-10 text-center">
      <p className="font-mono text-sm text-foreground">{title}</p>
      <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
      <a
        href={rawUrl}
        className="mt-4 inline-block font-mono text-xs text-primary transition-colors hover:text-primary-hover"
      >
        download raw →
      </a>
    </div>
  );
}
