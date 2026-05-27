export const siteConfig = {
  name: "Rune",
  version: "1.0.0",
  description:
    "Polyglot scripting for Paper Minecraft servers, embedded inside the JVM.",
  url: "https://runemc.dev",
  links: {
    docs: "/docs",
    install: "/install",
    runebook: "/runebook",
    changelog: "/changelog",
    about: "/about",
    github:
      process.env.NEXT_PUBLIC_REPO_URL ?? "https://github.com/rune-mc/rune",
  },
} as const;

// `https://` is mandatory on the Windows side: Vercel 308's http→https,
// and Windows PowerShell 5.1's Invoke-RestMethod refuses to follow a
// protocol-changing redirect. curl on the unix side handles it fine with
// -L, but we keep the schemes consistent for copy-paste sanity.
export const installCommands = [
  {
    id: "unix",
    label: "macOS / Linux",
    command: "curl -fsSL https://runemc.dev/install.sh | bash",
    prompt: "$",
  },
  {
    id: "windows",
    label: "Windows",
    command: "irm https://runemc.dev/install.ps1 | iex",
    prompt: ">",
  },
] as const;

export type PlatformId = (typeof installCommands)[number]["id"];

export const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA ?? "dev";
