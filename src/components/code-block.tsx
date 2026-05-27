import type { BundledLanguage } from "shiki/bundle/full";
import { highlightSource } from "@/lib/highlighter";

interface Props {
  code: string;
  lang: BundledLanguage;
  className?: string;
}

/**
 * Server-rendered, theme-aware code block. Output uses shiki's dual-theme
 * CSS variables, so it follows the site theme toggle without re-highlighting.
 */
export async function CodeBlock({ code, lang, className }: Props) {
  const html = await highlightSource(code, lang);
  return (
    <div
      className={`rune-code-block overflow-x-auto rounded border border-border${
        className ? ` ${className}` : ""
      }`}
      // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output is safe HTML
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
