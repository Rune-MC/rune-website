import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section, Sub } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "CLI",
  description:
    "rune init, pack, publish, add — the toolchain that scaffolds, packages, and installs Runes.",
};

export default function CliPage() {
  return (
    <DocsPage
      slug="cli"
      title="CLI."
      description="Create and package Runes from your terminal. Set up an existing server with the Rune plugin and manage Runebook packages."
    >
      <Section title="Authentication">
        <p>
          Run <code>rune login</code> to open Runebook in your desktop browser.
          On a headless server or over SSH, enter the terminal code at the
          displayed URL on another device. Add <code>--device</code> to use that
          flow from a desktop.
        </p>
        <CodeBlock
          lang="shell"
          code={`rune login
rune login --device
rune whoami
rune logout`}
        />
        <p>
          For CI, create a personal access token in{" "}
          <a href="/dashboard/tokens">your dashboard</a> and pass it through{" "}
          <code>RUNE_TOKEN</code> or <code>rune login --token</code>.
          Browser-issued credentials expire after 30 days.
        </p>
      </Section>

      <Section title="Project lifecycle">
        <Sub title="rune init">
          <p>Scaffold a new Rune project in the current directory.</p>
          <CodeBlock
            lang="shell"
            code={`rune init hello
rune init hello-js --language javascript
rune init hello-py --language python
cd hello
rune check
rune pack`}
          />
          <p>
            Creates <code>rune.toml</code>, <code>.runeignore</code>, a README,
            and a player-join example in <code>src/</code>.{" "}
            <code>rune check</code> validates your manifest and checks whether
            the entry point will be packed.
          </p>
        </Sub>

        <Sub title="rune pack">
          <p>
            Build a publishable archive. Computes per-file sha256 hashes,
            assembles the canonical manifest, and writes a zstd-compressed
            archive into the output directory.
          </p>
          <CodeBlock
            lang="shell"
            code={`rune pack                          # writes to ./dist/
rune pack --out ./build            # custom output dir
rune pack --dir ./scripts/guild-ranks     # pack a different project`}
          />
          <p>
            The archive is content-addressed — pack the same source twice and
            the hashes match. Useful for verifying a published artifact:{" "}
            <code>rune pack</code> locally, compare the hash on the Runebook
            detail page.
          </p>
        </Sub>

        <Sub title="rune publish">
          <p>
            Pack and upload in one step. The CLI sends the manifest first, gets
            pre-signed R2 URLs for any blobs the registry hasn't seen, uploads
            them, then finalizes.
          </p>
          <CodeBlock
            lang="shell"
            code={`rune publish                       # ship as a stable version
rune publish --draft               # publish but pre-yank for testing
rune publish --yes                 # skip the confirmation prompt
rune publish --registry https://...   # alternate registry`}
          />
          <Note>
            Blobs are deduplicated across every Rune. Two versions that share a
            file upload that file once; the second <code>publish</code> sees
            it's already in storage and skips it.
          </Note>
        </Sub>
      </Section>

      <Section title="Server-side commands">
        <Sub title="rune setup">
          <p>
            Install the Rune plugin into an existing Paper server and create its
            scripts directory. Setup finds the server from your current
            directory, or you can pass the server folder explicitly.
          </p>
          <CodeBlock
            lang="shell"
            code={`rune setup
rune setup "/path/to/paper"
rune setup --start`}
          />
          <p>Paper generates Rune’s config and types when it starts.</p>
        </Sub>
        <Sub title="rune add">
          <p>
            Install a published Rune into <code>plugins/Rune/scripts/</code>.
            Resolves the latest stable version unless you pin one.
          </p>
          <CodeBlock
            lang="shell"
            code={`rune add guild-ranks
rune add guild-ranks@0.1.0
rune add @yourname/foo
rune add guild-ranks --scripts ./plugins/Rune/scripts
rune add guild-ranks --force
rune list
rune update`}
          />
        </Sub>
        <Sub title="rune remove">
          <p>
            Uninstall a Rune by name. The CLI deletes its script directory;{" "}
            <code>rune.store()</code> data is preserved by default.
          </p>
          <CodeBlock
            lang="shell"
            code={`rune remove guild-ranks
rune remove guild-ranks --yes              # skip confirmation`}
          />
        </Sub>
      </Section>

      <Section title="In-server commands">
        <p>
          Some commands are run inside Paper, against the running host, not the
          CLI:
        </p>
        <ul>
          <li>
            <code>/rune reload</code> — re-evaluate every script. The iteration
            loop. Doesn't restart the server.
          </li>
          <li>
            <code>/rune list</code> — show every script the host is currently
            running, with its version.
          </li>
          <li>
            <code>/rune info &lt;name&gt;</code> — show a script's manifest,
            declared capabilities, and current uptime.
          </li>
          <li>
            <code>/rune new &lt;name&gt; [language]</code> — scaffold a new
            script directly inside the server (convenience equivalent to running{" "}
            <code>rune init</code> from the scripts dir).
          </li>
        </ul>
      </Section>
    </DocsPage>
  );
}
