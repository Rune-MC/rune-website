import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { PlatformInstall } from "@/components/landing/platform-install";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Install",
  description: "Install Rune on your Paper Minecraft server.",
};

export default function InstallPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-24 pb-24 sm:pt-32 sm:pb-32">
      <p className="mb-8 font-mono text-sm text-muted-foreground">install</p>
      <h1 className="font-medium leading-[1.1] tracking-tight text-display text-[2rem] sm:text-5xl">
        Install Rune on your Paper server.
      </h1>
      <p className="mt-6 max-w-prose text-base text-foreground">
        One command sets up Paper, drops the Rune plugin into{" "}
        <code>plugins/</code>, and bootstraps the scripts directory.
      </p>
      <div className="mt-10">
        <PlatformInstall />
      </div>

      <div className="mt-24 divide-y divide-border">
        <article className="py-12">
          <h2 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
            Requirements
          </h2>
          <ul className="mt-6 space-y-2.5 text-foreground">
            <li>Java 21 or newer. Paper 1.21+ requires it.</li>
            <li>
              2 GB RAM minimum; start the server with{" "}
              <code>java -Xmx2G -jar paper.jar nogui</code>.
            </li>
            <li>About 1 GB free disk for Paper, Rune, and a starter world.</li>
          </ul>
        </article>

        <article className="py-12">
          <h2 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
            Manual install
          </h2>
          <p className="mt-6 max-w-prose text-foreground">
            While the one-line installer is being finalized, you can install
            Rune by hand:
          </p>
          <ol className="mt-6 list-inside list-decimal space-y-3 text-foreground">
            <li>
              Download the latest Rune jar from{" "}
              <a
                href={`${siteConfig.links.github}/releases`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary transition-colors hover:text-primary-hover"
              >
                GitHub releases
              </a>
              .
            </li>
            <li>
              Drop it into your Paper server's <code>plugins/</code> directory.
            </li>
            <li>
              Start your server. Rune creates <code>plugins/Rune/scripts/</code>{" "}
              on first load.
            </li>
          </ol>
        </article>

        <article className="py-12">
          <h2 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
            Verify
          </h2>
          <p className="mt-6 max-w-prose text-foreground">
            Confirm Rune loaded by running <code>plugins</code> in the server
            console. You should see <code>Rune</code> in the list.
          </p>
        </article>

        <article className="py-12">
          <h2 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
            Your first Rune
          </h2>
          <p className="mt-6 max-w-prose text-foreground">
            Scaffold a TypeScript Rune in{" "}
            <code>plugins/Rune/scripts/&lt;name&gt;/</code>:
          </p>
          <div className="mt-6">
            <CodeBlock code="rune new-script --name hello" lang="shell" />
          </div>
          <p className="mt-6 max-w-prose text-foreground">
            That writes <code>rune.jsonc</code> and an <code>index.ts</code>{" "}
            with a working event listener. Reload from the server console with{" "}
            <code>rune reload</code>. Live Bukkit references survive the reload,
            so iteration is fast: edit, save, reload, see the change in-game.
          </p>
        </article>
      </div>
    </section>
  );
}
