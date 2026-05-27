import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Capabilities",
  description:
    "Capabilities are the trust contract between a Rune and the operator who installs it. Today they are advisory. The format is locked.",
};

export default function CapabilitiesPage() {
  return (
    <DocsPage
      slug="capabilities"
      title="Capabilities."
      description="A Rune's capabilities array is its trust contract. Each entry is a string that says 'this script asks for the right to do X'. Operators see the list on the Runebook detail page before they install. Today the runtime does not enforce it — but the manifest schema is locked, and adding a capability requires a new version, so what you publish is what your users review."
    >
      <Section title="The shape">
        <p>
          Capabilities live in <code>rune.toml</code> under{" "}
          <code>[capabilities]</code>. They're flat strings, namespaced by{" "}
          colon, and ordered alphabetically when packed (so two Runes asking for
          the same things produce the same manifest hash).
        </p>
        <CodeBlock
          lang="toml"
          code={`[capabilities]
required = [
  "host:bukkit",              # use the bukkit/paper API surface
  "host:plugin:vault",        # interop with the Vault plugin
  "host:plugin:papi",         # register PlaceholderAPI expansions
  "host:http",                # bind rune.serve()
  "host:store",               # persist data via rune.store()
  "host:net:outbound",        # initiate outbound network connections
  "host:fs:read",             # read files outside the script's directory
  "host:fs:write",            # write files outside the script's directory
]`}
        />
      </Section>

      <Section title="Tiering">
        <p>
          Capabilities are graded by trust cost on the Runebook detail page. The
          grading is a property of the capability string, not the Rune, so two
          Runes asking for the same thing get the same color.
        </p>
        <ul>
          <li>
            <strong>standard</strong> — bukkit access, the store, scoped files.
            Approximately every Rune declares these.
          </li>
          <li>
            <strong>elevated</strong> — outbound network, named plugin interop,
            registering placeholder expansions. Reasonable for many Runes;
            should still raise an eyebrow.
          </li>
          <li>
            <strong>danger</strong> — broad filesystem access, arbitrary
            classpath reflection, running shell commands. Operators should
            expect a justification in the README.
          </li>
        </ul>
      </Section>

      <Section title="Today vs. tomorrow">
        <p>
          Today, the runtime trusts every script in{" "}
          <code>plugins/Rune/scripts/</code> equally — the operator already had
          to copy your code into their server. Capabilities are advisory
          metadata on the registry side. This is deliberate: we want the schema
          in flight before enforcement so the ecosystem stabilizes around real
          declared sets, not invented ones.
        </p>
        <p>
          Tomorrow, capabilities will gate the same APIs they document.
          Declaring a capability you don't need is a forward-compat liability
          (your Rune will keep asking for things it doesn't use); omitting one
          you do need means future versions of the host will reject the
          operations.
        </p>
        <Note variant="warn">
          Capability strings are part of the manifest hash. Adding, removing, or
          reordering them changes the version's identity. That is the point — a
          Rune that asks for a new privilege is a new version, and the operator
          gets to see and approve the delta.
        </Note>
      </Section>
    </DocsPage>
  );
}
