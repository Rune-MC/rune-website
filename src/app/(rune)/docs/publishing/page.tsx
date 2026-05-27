import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section, Sub } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Publishing",
  description:
    "How a Rune gets from your machine onto someone else's server: pack, upload, finalize, install.",
};

export default function PublishingPage() {
  return (
    <DocsPage
      slug="publishing"
      title="Publishing."
      description="Publishing a Rune means turning your directory into a content-addressed archive, uploading any blobs the registry hasn't seen, and registering a new immutable version. Operators install by name and version; the registry hands them back exactly the bytes you uploaded."
    >
      <Section title="The flow">
        <ol>
          <li>
            <strong>Pack.</strong> The CLI reads <code>rune.toml</code>, applies
            your <code>publish.include</code> and <code>publish.exclude</code>{" "}
            globs, runs the publish preset (esbuild for TypeScript), computes
            sha256 per file, and assembles the canonical manifest JSON.
            Identical content always produces the same manifest hash.
          </li>
          <li>
            <strong>Upload.</strong> The CLI sends the manifest to{" "}
            <code>POST /api/v1/runes/&lt;name&gt;/versions</code>. The registry
            verifies the schema, claims the name on first publish, and returns
            pre-signed R2 PUT URLs for any blobs it doesn't already have. The
            CLI uploads those blobs directly to R2.
          </li>
          <li>
            <strong>Finalize.</strong> The CLI calls{" "}
            <code>
              POST /api/v1/runes/&lt;name&gt;/versions/&lt;v&gt;/finalize
            </code>
            . The registry verifies every blob is present in R2, atomically
            activates the version, updates <code>latestVersion</code> if
            applicable, and returns the install string.
          </li>
        </ol>
        <Note>
          A half-uploaded publish is never visible. Versions live in{" "}
          <code>pending</code> until finalize completes; failed publishes can be
          retried with the same hash and resume from where they left off.
        </Note>
      </Section>

      <Section title="Content addressing">
        <p>
          Every file you ship is stored under <code>blobs/&lt;sha256&gt;</code>{" "}
          in R2. The manifest is stored under{" "}
          <code>manifests/&lt;sha256&gt;</code>. Two Runes that ship the same{" "}
          <code>README.md</code> share one blob; if you publish the same source
          twice, the second publish writes zero new bytes.
        </p>
        <p>
          The manifest hash is part of your version's identity. It's shown on
          the detail page, exposed via the API, and verifiable by re-packing
          locally: <code>rune pack</code> emits the same hash given the same
          source.
        </p>
      </Section>

      <Section title="Naming">
        <p>
          Names match <code>^(?:@[a-z0-9-]+/)?[a-z0-9-]+$</code>.
        </p>
        <ul>
          <li>
            Unscoped names (<code>ward</code>) are first-come-first-served
            across the registry.
          </li>
          <li>
            Scoped names (<code>@yourname/ward</code>) are reserved to whoever
            owns the <code>@yourname</code> scope, set up by claiming a username
            during onboarding.
          </li>
        </ul>
        <Note variant="warn">
          Names are permanent in v1. There's no rename. If you want a different
          name, publish a new package and point users to it; the old name
          continues to exist but doesn't have to receive updates.
        </Note>
      </Section>

      <Section title="Versioning">
        <p>
          Versions are semver. The registry rejects any version that isn't
          strictly greater than the highest existing version for that name (per
          semver-precedence, so <code>1.0.0-beta.1</code> &lt;{" "}
          <code>1.0.0</code>). <code>latestVersion</code> tracks the highest
          stable version; pre-releases (anything with a hyphen) are visible but
          not surfaced by default.
        </p>
        <Sub title="Capability changes">
          <p>
            Capabilities are part of the manifest hash, which means they're part
            of the version's identity. Adding, removing, or reordering
            capabilities requires a new version — operators get to review the
            delta before they upgrade. See{" "}
            <a href="/docs/capabilities">capabilities</a> for the format.
          </p>
        </Sub>
      </Section>

      <Section title="What ends up in the archive">
        <p>
          The CLI honors your <code>publish.include</code> and{" "}
          <code>publish.exclude</code> globs. Defaults are intentionally broad —
          every file in the project root that isn't a dotfile — and you narrow
          from there.
        </p>
        <CodeBlock
          lang="toml"
          code={`[publish]
include = [
  "**/*.ts",
  "rune.jsonc",
  "README*",
  "LICENSE*",
  "web/dist/**",        # ship the built dashboard, not the sources
]
exclude = [
  "**/*.test.ts",
  "**/.env*",
]`}
        />
        <p>
          Order matters for clarity: include first, then exclude. Anything
          outside the project root, anything starting with <code>.</code>, and
          the contents of <code>node_modules/</code> are never packed regardless
          of globs.
        </p>
      </Section>

      <Section title="Yanking">
        <p>
          If you ship a broken version, soft-delete it. Yanked versions stay
          installable for operators who pinned them but disappear from the
          default resolver, and the Runebook detail page shows a banner with
          your reason. The right move is to yank the bad version and ship a fix
          as a new patch version — never republish over a name + version combo.
        </p>
        <CodeBlock
          lang="shell"
          code={`rune yank @yourname/ward@0.1.0 --reason "broken on 1.21.4"`}
        />
      </Section>

      <Section title="Installing a published Rune">
        <p>Operators install with one command from a Paper server root:</p>
        <CodeBlock
          lang="shell"
          code={`rune add ward                # latest stable
rune add ward@0.1.0          # pin a specific version
rune add @scope/foo          # scoped`}
        />
        <p>
          The CLI fetches the manifest, downloads every blob from R2,
          materializes the directory under{" "}
          <code>plugins/Rune/scripts/&lt;name&gt;/</code>, and exits. A{" "}
          <code>/rune reload</code> from the server console picks it up.
        </p>
      </Section>
    </DocsPage>
  );
}
