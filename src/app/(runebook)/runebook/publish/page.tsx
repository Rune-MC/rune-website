import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";

export const metadata: Metadata = {
  title: "Publish",
  description: "How to publish a Rune to Runebook.",
};

export default function PublishDocsPage() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <p className="mb-6 font-mono text-xs text-muted-foreground">
        runebook · publish
      </p>
      <h1 className="text-3xl font-medium tracking-tight text-display sm:text-4xl">
        Publish a Rune.
      </h1>
      <p className="mt-4 max-w-prose text-sm text-foreground">
        Runes are published from the CLI. The website verifies the manifest,
        deduplicates blobs against existing storage, and serves them. You
        authenticate with a personal access token from{" "}
        <a
          href="/dashboard/tokens"
          className="text-primary transition-colors hover:text-primary-hover"
        >
          your dashboard
        </a>
        .
      </p>

      <div className="mt-12 divide-y divide-border">
        <article className="py-8">
          <h2 className="font-mono text-xs text-muted-foreground">
            1. authenticate
          </h2>
          <p className="mt-3 max-w-prose text-sm text-foreground">
            Create a CLI token in the dashboard, then save it on your machine:
          </p>
          <div className="mt-4">
            <CodeBlock code="rune auth login" lang="shell" />
          </div>
          <p className="mt-3 max-w-prose text-sm text-foreground">
            The token is stored under <code>~/.config/rune/token</code> and sent
            as <code>Authorization: Bearer rune_pat_*</code>.
          </p>
        </article>

        <article className="py-8">
          <h2 className="font-mono text-xs text-muted-foreground">2. pack</h2>
          <p className="mt-3 max-w-prose text-sm text-foreground">
            From your Rune directory:
          </p>
          <div className="mt-4">
            <CodeBlock code="rune publish" lang="shell" />
          </div>
          <p className="mt-3 max-w-prose text-sm text-foreground">
            The CLI resolves your file list, runs the esbuild publish preset,
            computes per-file sha256 hashes, and builds the canonical manifest.
            Identical content always produces the same manifest hash.
          </p>
        </article>

        <article className="py-8">
          <h2 className="font-mono text-xs text-muted-foreground">3. upload</h2>
          <p className="mt-3 max-w-prose text-sm text-foreground">
            The CLI sends the manifest to the registry, receives pre-signed R2
            PUT URLs for any blobs not already in storage, and uploads them
            directly to R2. Blobs are content-addressed: two Runes that ship the
            same file dedupe to one storage object.
          </p>
        </article>

        <article className="py-8">
          <h2 className="font-mono text-xs text-muted-foreground">
            4. finalize
          </h2>
          <p className="mt-3 max-w-prose text-sm text-foreground">
            Once every blob is in R2, the CLI calls finalize. The registry
            verifies presence, atomically registers the version, and returns the
            canonical install string. A half-uploaded publish is never visible.
          </p>
        </article>

        <article className="py-8">
          <h2 className="font-mono text-xs text-muted-foreground">
            capability disclosure
          </h2>
          <p className="mt-3 max-w-prose text-sm text-foreground">
            Every host privilege your Rune asks for goes in the manifest's
            <code> capabilities </code> array. These appear on the detail page
            before the install command, weight-graded by trust cost.
            Capabilities are part of the manifest hash, so they are part of the
            version's identity: adding a capability requires a new version.
          </p>
        </article>

        <article className="py-8">
          <h2 className="font-mono text-xs text-muted-foreground">yanking</h2>
          <p className="mt-3 max-w-prose text-sm text-foreground">
            If you ship a broken version, you can soft-delete it:
          </p>
          <div className="mt-4">
            <CodeBlock
              code={`rune yank @<scope>/<name>@<version> --reason "broken on 1.21.4"`}
              lang="shell"
            />
          </div>
          <p className="mt-3 max-w-prose text-sm text-foreground">
            Yanked versions remain installable for operators who pinned them,
            but disappear from the default resolver and show a warning banner on
            the detail page.
          </p>
        </article>
      </div>
    </section>
  );
}
