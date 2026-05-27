import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section } from "@/components/docs/docs-page";
import { docHref, docNav } from "@/lib/docs/nav";

export const metadata: Metadata = {
  title: "Docs",
  description:
    "Rune embeds Node, Wasm, and friends inside the Paper JVM. This is the working reference for authoring, publishing, and running Runes.",
};

export default function DocsIndex() {
  return (
    <DocsPage
      slug=""
      title="Rune in one page."
      description="Rune is a polyglot scripting platform for Paper Minecraft servers. You write TypeScript (or Wasm) in plugins/Rune/scripts/, and a Rust loader pulls those scripts into a real Node.js runtime that lives inside the Paper JVM. The Java objects you touch are real Bukkit references, not serialized snapshots."
    >
      <Section title="The shape of a Rune">
        <p>
          A Rune is a directory under <code>plugins/Rune/scripts/</code> with a
          manifest and an entry script. Decorators in the entry script register
          event listeners and commands; modules under it hold the rest of the
          logic. On server start, Rune discovers every directory, hands its
          entry to the matching language runtime, and replays decorator
          registrations against Paper.
        </p>
        <CodeBlock
          lang="shell"
          code={`plugins/Rune/scripts/
└── ward/
    ├── rune.toml       # publish-side manifest (CLI cares about this)
    ├── rune.jsonc      # runtime manifest (the host cares about this)
    ├── index.ts        # entry — registers listeners + commands
    ├── commands/
    ├── lib/
    ├── models/
    └── web/`}
        />
        <p>
          The two manifests serve different audiences: <code>rune.toml</code> is
          what <code>rune publish</code> reads when packing for the Runebook
          registry; <code>rune.jsonc</code> is what the running host reads to
          know which third-party plugins your Rune asks for and what aliases to
          bind. They overlap on identity (name, version, language) but stay
          separated so a Rune can run un-published.
        </p>
      </Section>

      <Section title="What's actually embedded">
        <p>
          The runtime story is more aggressive than &quot;run a script.&quot;
          Rune ships a Rust loader compiled to a shared library that the Paper
          plugin loads via Panama FFM. The loader hosts language backends; today
          only Node.js (V8 via <code>libnode</code>) is wired, with Wasmtime
          stubbed in as a second runtime. Languages get added by implementing a
          single trait — Python, Lua, and Rust-to-Wasm are on the roadmap.
        </p>
        <Note>
          When your script calls <code>player.getName()</code>, V8 parks the JS
          context, calls into the loader over a C ABI, the loader routes to the
          JVM via FFM, Paper runs <code>getName()</code> on the main thread, and
          the string comes back inline. No JSON, no socket, no serialization
          round-trip — just a synchronous upcall.
        </Note>
      </Section>

      <Section title="Where to go from here">
        <p>If you've never run a Rune:</p>
        <ul>
          {docNav[0].items.slice(1).map((item) => (
            <li key={item.slug}>
              <Link href={docHref(item.slug)}>{item.title}</Link>{" "}
              <span className="text-muted-foreground">— {item.summary}</span>
            </li>
          ))}
        </ul>
        <p className="mt-6">
          If you're writing one and want a feature-by-feature reference, jump to{" "}
          <Link href={docHref("listeners")}>listeners</Link>,{" "}
          <Link href={docHref("commands")}>commands</Link>, or{" "}
          <Link href={docHref("http")}>HTTP servers</Link>. If you want to ship
          one, <Link href={docHref("publishing")}>publishing</Link> walks you
          through the registry flow.
        </p>
      </Section>

      <Section title="Reference plugin">
        <p>
          Every example in these docs is drawn from <code>ward</code>, a
          full-stack permissions plugin written entirely in Rune. It has
          decorator-based commands, an inventory-driven admin UI, a
          MongoDB-backed schema, a PlaceholderAPI expansion, a Vault economy
          integration, and a web dashboard served over HTTP from the same
          process. If a Rune feature exists, ward exercises it.
        </p>
      </Section>
    </DocsPage>
  );
}
