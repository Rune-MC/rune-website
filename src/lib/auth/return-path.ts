/** Only local paths may survive the GitHub sign-in redirect. */
export function safeReturnPath(path: string | null | undefined): string {
  if (!path?.startsWith("/") || path.startsWith("//") || path.includes("\\")) {
    return "/dashboard";
  }
  const url = new URL(path, "https://runemc.dev");
  if (url.origin !== "https://runemc.dev" || url.pathname.startsWith("//")) {
    return "/dashboard";
  }
  return url.pathname + url.search + url.hash;
}
