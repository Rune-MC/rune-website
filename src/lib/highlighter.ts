import {
  type BundledLanguage,
  type BundledTheme,
  createHighlighter,
  type HighlighterGeneric,
} from "shiki/bundle/full";

export const LIGHT_THEME: BundledTheme = "github-light";
export const DARK_THEME: BundledTheme = "github-dark-dimmed";

type Highlighter = HighlighterGeneric<BundledLanguage, BundledTheme>;

let cached: Promise<Highlighter> | null = null;

/**
 * Singleton shiki highlighter. We start with no languages preloaded; each call
 * to `highlightSource` lazy-loads its language on first use, then caches it.
 */
export async function getHighlighter(): Promise<Highlighter> {
  if (!cached) {
    cached = createHighlighter({
      themes: [LIGHT_THEME, DARK_THEME],
      langs: [],
    });
  }
  return cached;
}

export async function highlightSource(
  source: string,
  lang: BundledLanguage | null,
): Promise<string> {
  const highlighter = await getHighlighter();
  const effective: BundledLanguage = lang ?? ("text" as BundledLanguage);
  if (
    lang &&
    !highlighter.getLoadedLanguages().includes(lang as BundledLanguage)
  ) {
    try {
      await highlighter.loadLanguage(lang);
    } catch {
      // fall back to plaintext if the grammar fails to load
      return highlighter.codeToHtml(source, {
        lang: "text" as BundledLanguage,
        themes: { light: LIGHT_THEME, dark: DARK_THEME },
        defaultColor: false,
      });
    }
  }
  return highlighter.codeToHtml(source, {
    lang: effective,
    themes: { light: LIGHT_THEME, dark: DARK_THEME },
    defaultColor: false,
  });
}
