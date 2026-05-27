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

export const installCommands = [
  {
    id: "unix",
    label: "macOS / Linux",
    command: "curl -fsSL runemc.dev/install.sh | bash",
    prompt: "$",
  },
  {
    id: "windows",
    label: "Windows",
    command: "irm runemc.dev/install.ps1 | iex",
    prompt: ">",
  },
] as const;

export type PlatformId = (typeof installCommands)[number]["id"];

export const commitSha = process.env.NEXT_PUBLIC_COMMIT_SHA ?? "dev";
