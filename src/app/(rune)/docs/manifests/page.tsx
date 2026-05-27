import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section, Sub } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Manifests",
  description:
    "Rune ships two manifests on purpose. rune.toml is the publish-side identity; rune.jsonc is the runtime configuration.",
};

export default function ManifestsPage() {
  return (
    <DocsPage
      slug="manifests"
      title="Manifests."
      description="Every Rune carries two manifests, and they answer different questions. rune.toml answers 'who is this package'; rune.jsonc answers 'what does this script need at runtime'. They overlap on identity and stay separate on intent."
    >
      <Section title="rune.toml">
        <p>
          The CLI reads <code>rune.toml</code> when it packs an archive for
          publishing. It's a TOML file with three sections you'll write and a
          few you might.
        </p>
        <CodeBlock
          lang="toml"
          code={`[package]
name        = "ward"                  # required, lowercase + hyphens
version     = "0.1.0"                 # required, semver
language    = "typescript"            # required: "typescript" | "wasm"
entry       = "index.ts"              # required, relative to manifest
description = "Permissions + web dashboard for Paper"
license     = "MIT"
homepage    = "https://github.com/your/ward"
repository  = "https://github.com/your/ward"
keywords    = ["permissions", "web", "rank-up"]

[publish]
include = ["**/*.ts", "rune.jsonc", "README*", "LICENSE*"]
exclude = ["**/*.test.ts", "dist/**"]

[capabilities]
required = ["host:bukkit", "host:plugin:vault", "host:plugin:papi"]

[dependencies]
"@rune/sdk" = "^0.4.0"`}
        />
        <Sub title="Package identity">
          <p>
            <code>name</code> must match the regex{" "}
            <code>^(?:@[a-z0-9-]+/)?[a-z0-9-]+$</code>. Names without a scope
            are claimed first-come-first-served on the registry; scoped names (
            <code>@yourname/foo</code>) are reserved to the user who owns the
            scope. <code>version</code> must be valid semver and increases
            monotonically per publish.
          </p>
        </Sub>
        <Sub title="Files">
          <p>
            <code>publish.include</code> is the file allowlist that ends up in
            the archive. Default is <code>["**/*", "!.*"]</code>; override when
            your project has a build step or sibling directories you don't want
            shipped. <code>publish.exclude</code> applies after include so you
            can allow a broad pattern and surgically remove test files.
          </p>
        </Sub>
        <Sub title="Capabilities (advisory today)">
          <p>
            <code>capabilities.required</code> declares which host privileges
            your Rune asks for. The list is part of the manifest hash, so it's
            part of the version's identity; adding a capability requires a new
            version. Runtime enforcement is reserved — see{" "}
            <a href="/docs/capabilities">capabilities</a> for the
            currently-tracked strings.
          </p>
        </Sub>
      </Section>

      <Section title="rune.jsonc">
        <p>
          The host reads <code>rune.jsonc</code> at script load. It tells the
          runtime which third-party Paper plugins your script depends on and
          what aliases to bind. Comments are allowed. JSONC merges last-wins
          between the global <code>plugins/Rune/rune.jsonc</code> and your
          script's local copy.
        </p>
        <CodeBlock
          lang="jsonc"
          code={`{
  // Optional Paper plugins your script wants to interop with.
  // The host generates .d.ts files for declared plugins on enable.
  "plugins": {
    "PlaceholderAPI": {
      "alias": "papi",
      "package": "me.clip.placeholderapi"
    },
    "Vault": {
      "alias": "vault",
      "package": "net.milkbowl.vault"
    }
  },
  // Global names to bind into the script's runtime. Anything reachable
  // from the classpath can be aliased.
  "aliases": {
    "mm":             "net.kyori.adventure.text.minimessage.MiniMessage",
    "Component":      "net.kyori.adventure.text.Component",
    "NamedTextColor": "net.kyori.adventure.text.format.NamedTextColor"
  }
}`}
        />
        <Sub title="Plugin declarations">
          <p>
            Each entry under <code>plugins</code> tells the host: &quot;at
            enable time, reflect this Java package and write its types to{" "}
            <code>types/&lt;alias&gt;.d.ts</code>; at runtime, bind the plugin's
            API surface as a global named <code>&lt;alias&gt;</code>.&quot; If
            the underlying plugin isn't installed the alias becomes{" "}
            <code>undefined</code> at runtime — guard with{" "}
            <code>typeof papi !== &quot;undefined&quot;</code> if it's optional.
          </p>
        </Sub>
        <Sub title="Aliases">
          <p>
            The <code>aliases</code> map is for binding individual classes
            (often Adventure or static helper classes) into globals so you don't
            have to write the fully-qualified package name every time. Aliases
            land on the global scope; the host emits matching <code>.d.ts</code>{" "}
            declarations so TypeScript is happy.
          </p>
        </Sub>
      </Section>

      <Section title="What goes where">
        <p>
          Don't try to consolidate. Identity belongs in <code>rune.toml</code>{" "}
          because it's what the registry signs and stores. Runtime wiring
          belongs in <code>rune.jsonc</code> because it's what the host has to
          know to bring your script up. Keeping them split means a Rune can run
          unpublished (no <code>rune.toml</code> needed at all if you only use
          it locally) and a published Rune can declare runtime config that the
          registry doesn't have to understand.
        </p>
        <Note variant="warn">
          Both files reference the same script. Keep the <code>name</code> and{" "}
          <code>version</code> in sync between them if you choose to duplicate
          them. Future tooling will lint for drift.
        </Note>
      </Section>
    </DocsPage>
  );
}
