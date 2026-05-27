import type { BundledLanguage } from "shiki/bundle/full";

/** Extension → shiki language identifier. */
const EXT_LANGUAGE: Record<string, BundledLanguage> = {
  ts: "typescript",
  tsx: "tsx",
  js: "javascript",
  jsx: "jsx",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  jsonc: "jsonc",
  md: "markdown",
  mdx: "mdx",
  py: "python",
  rs: "rust",
  go: "go",
  java: "java",
  kt: "kotlin",
  kts: "kotlin",
  lua: "lua",
  rb: "ruby",
  sh: "shell",
  bash: "shell",
  zsh: "shell",
  fish: "shell",
  ps1: "powershell",
  toml: "toml",
  yaml: "yaml",
  yml: "yaml",
  xml: "xml",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  sql: "sql",
  c: "c",
  h: "c",
  cpp: "cpp",
  cc: "cpp",
  cxx: "cpp",
  hpp: "cpp",
  cs: "csharp",
  dockerfile: "dockerfile",
  gitignore: "ini",
  ini: "ini",
  diff: "diff",
  patch: "diff",
  graphql: "graphql",
  gql: "graphql",
  proto: "proto",
  swift: "swift",
  zig: "zig",
};

/** Special filenames that override extension-based detection. */
const FILENAME_LANGUAGE: Record<string, BundledLanguage> = {
  dockerfile: "dockerfile",
  makefile: "makefile",
  ".gitignore": "ini",
  ".npmrc": "ini",
  ".env": "shell",
  ".env.local": "shell",
  ".env.example": "shell",
};

export function detectLanguage(path: string): BundledLanguage | null {
  const fileName = path.split("/").pop()?.toLowerCase() ?? "";
  if (fileName in FILENAME_LANGUAGE) return FILENAME_LANGUAGE[fileName];
  const dot = fileName.lastIndexOf(".");
  if (dot < 0) return null;
  const ext = fileName.slice(dot + 1);
  return EXT_LANGUAGE[ext] ?? null;
}

/**
 * Heuristic binary detection: scan a prefix for null bytes or a high ratio of
 * non-printable bytes. Cheap and good enough for source code.
 */
export function looksBinary(buf: Buffer): boolean {
  const len = Math.min(buf.length, 8000);
  if (len === 0) return false;
  let suspicious = 0;
  for (let i = 0; i < len; i++) {
    const b = buf[i];
    if (b === 0) return true;
    // Allow tab, LF, CR, and common printable ASCII. Outside of that, count
    // as suspicious — UTF-8 multi-byte sequences will also land here, which
    // is fine; we only flag binary above a ratio threshold.
    if (b < 7 || (b > 14 && b < 32) || b === 127) suspicious++;
  }
  return suspicious / len > 0.3;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(
    units.length - 1,
    Math.floor(Math.log(bytes) / Math.log(1024)),
  );
  const value = bytes / 1024 ** i;
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}
