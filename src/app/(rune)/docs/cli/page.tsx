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
      description="The rune CLI handles everything outside the running server: scaffolding a new Rune, packaging it for distribution, publishing to the registry, and installing one onto a server. It reads rune.toml, talks to the Runebook API, and operates against a personal access token you issue from your dashboard."
    >
      <Section title="Authentication">
        <p>
          The CLI authenticates to Runebook with a personal access token. Mint
          one at <a href="/dashboard/tokens">your dashboard</a>, then save it.
        </p>
        <CodeBlock
          lang="shell"
          code={`rune login                # prompts for the token
rune login --token rune_pat_...   # non-interactive
rune logout
rune whoami               # prints the username the token belongs to`}
        />
        <p>
          The token is stored at <code>~/.config/rune/token</code>{" "}
          (owner-readable only) and sent as{" "}
          <code>Authorization: Bearer rune_pat_*</code>.
        </p>
      </Section>

      <Section title="Project lifecycle">
        <Sub title="rune init">
          <p>Scaffold a new Rune project in the current directory.</p>
          <CodeBlock
            lang="shell"
            code={`rune init                              # uses dir name
rune init --name hello                  # explicit name
rune init --language wasm               # default is typescript
rune init --force                       # overwrite existing files`}
          />
          <p>
            Emits <code>rune.toml</code>, <code>rune.jsonc</code>,{" "}
            <code>tsconfig.json</code>, <code>package.json</code>, and an{" "}
            <code>index.ts</code> with a working listener.
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
rune pack --dir ./scripts/ward     # pack a different project`}
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
        <p>
          These run from inside a Paper server root — <code>plugins/Rune/</code>{" "}
          needs to be present.
        </p>
        <Sub title="rune add">
          <p>
            Install a published Rune into <code>plugins/Rune/scripts/</code>.
            Resolves the latest stable version unless you pin one.
          </p>
          <CodeBlock
            lang="shell"
            code={`rune add ward
rune add ward@0.1.0
rune add @yourname/foo
rune add ward --scripts ./plugins/Rune/scripts
rune add ward --force                 # overwrite if already installed`}
          />
        </Sub>
        <Sub title="rune remove">
          <p>
            Uninstall a Rune by name. The CLI deletes its script directory;{" "}
            <code>rune.store()</code> data is preserved by default.
          </p>
          <CodeBlock
            lang="shell"
            code={`rune remove ward
rune remove ward --yes              # skip confirmation`}
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
            <code>/rune new-script --name &lt;name&gt;</code> — scaffold a new
            script directly inside the server (convenience equivalent to running{" "}
            <code>rune init</code> from the scripts dir).
          </li>
        </ul>
      </Section>

      <Section title="rune yank">
        <p>
          Soft-delete a published version. Yanked versions remain installable
          for operators who pinned them, but disappear from the default resolver
          and show a banner on the detail page.
        </p>
        <CodeBlock
          lang="shell"
          code={`rune yank @yourname/ward@0.1.0 --reason "broken on 1.21.4"`}
        />
        <p>
          Use yank when you ship a broken version. Don't use it to un-publish —
          published is forever. The right move for a bad publish is to yank it
          and ship a fixed patch version.
        </p>
      </Section>
    </DocsPage>
  );
}
