import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Docs",
  description: "Documentation for the Rune platform.",
};

export default function DocsPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-24 pb-24 sm:pt-32 sm:pb-32">
      <p className="mb-8 font-mono text-sm text-muted-foreground">docs</p>
      <h1 className="font-medium leading-[1.1] tracking-tight text-display text-[2rem] sm:text-5xl">
        Documentation.
      </h1>
      <p className="mt-6 max-w-prose text-base text-foreground">
        Long-form documentation lands here as the platform reaches public beta.
        For now, the README in the source repo is the working reference, and the{" "}
        <Link
          href={siteConfig.links.install}
          className="text-primary transition-colors hover:text-primary-hover"
        >
          install page
        </Link>{" "}
        covers getting Rune onto a Paper server.
      </p>

      <div className="mt-16 border-t border-border pt-12">
        <h2 className="text-xl font-medium tracking-tight text-display">
          Coming soon
        </h2>
        <ul className="mt-6 grid gap-3 text-foreground sm:grid-cols-2">
          <li>
            <span className="font-mono text-sm text-muted-foreground">
              concepts ·
            </span>{" "}
            Runtimes, manifests, capabilities.
          </li>
          <li>
            <span className="font-mono text-sm text-muted-foreground">
              listeners ·
            </span>{" "}
            <code>@Listener</code>, <code>@EventHandler</code>, the full
            decorator surface.
          </li>
          <li>
            <span className="font-mono text-sm text-muted-foreground">
              commands ·
            </span>{" "}
            <code>@Command</code>, <code>@Run</code>, argument parsing.
          </li>
          <li>
            <span className="font-mono text-sm text-muted-foreground">
              plugins ·
            </span>{" "}
            Declaring third-party Bukkit plugins in <code>rune.jsonc</code>.
          </li>
          <li>
            <span className="font-mono text-sm text-muted-foreground">
              types ·
            </span>{" "}
            How the runtime reflects your classpath into <code>.d.ts</code>{" "}
            files.
          </li>
          <li>
            <span className="font-mono text-sm text-muted-foreground">
              publishing ·
            </span>{" "}
            Packing, capabilities, semver, the publish flow.
          </li>
        </ul>
      </div>
    </section>
  );
}
