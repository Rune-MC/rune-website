import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Runtimes",
  description:
    "Rune is a polyglot platform with a single host API. Today TypeScript ships; the rest is grammar, not architecture.",
};

export default function RuntimesPage() {
  return (
    <DocsPage
      slug="runtimes"
      title="Runtimes."
      description="Rune separates the language from the API. The host API — the surface your Rune writes against — is defined once and lives in Rust. Each language runtime is a backend that implements that contract, so 'add a language' means 'wire a new backend', not 'rewrite the platform'."
    >
      <Section title="Today: TypeScript">
        <p>
          The Node.js backend is the only runtime currently wired. It embeds{" "}
          <code>libnode</code> (V8 + Node) inside the Paper JVM by way of the
          Rust loader, which uses Panama FFM to keep both sides in the same
          address space. Your script runs in a real Node environment —{" "}
          <code>fs</code>, <code>http</code>, <code>process</code>, and the npm
          ecosystem are all available — but the upcalls to Bukkit don't go over
          a socket. They're direct synchronous calls through V8 → Rust → JVM.
        </p>
        <CodeBlock
          lang="typescript"
          code={`// Plain Node-side work happens normally.
import fs from "node:fs";
import { z } from "zod";

const envSchema = z.object({ DATABASE_URI: z.string() });
const env = envSchema.parse(loadEnvFile());

// Bukkit work hits the JVM through FFM.
@Listener
export class Pulse {
  @EventHandler(Events.PlayerJoinEvent)
  onJoin(e: PlayerJoinEvent) {
    const player = e.getPlayer();        // live ref, not a snapshot
    rune.runOnMain(() => {                // schedule on the main thread
      player.sendMessage("welcome.");
    });
  }
}`}
        />
      </Section>

      <Section title="Wasm (wired, not yet exposed)">
        <p>
          Wasmtime is included as a second runtime backend. The plumbing works —
          a script declared with <code>language = &quot;wasm&quot;</code> in{" "}
          <code>rune.toml</code> routes to the Wasm backend instead of Node —
          but the host bindings exposed to Wasm guests are still being designed.
          The published Wasm interface lives in <code>wit/</code> in the Rune
          repo and uses the Component Model. Treat this as preview surface; the
          WIT will move before 1.0.
        </p>
      </Section>

      <Section title="Planned: Python, Lua, Rust → Wasm">
        <p>
          The roadmap covers three more guests. Python and Lua get native
          embeddings (CPython and LuaJIT respectively, both via FFM, same
          pattern as Node). Rust gets the easier path: you compile to Wasm and
          the existing Wasmtime runtime hosts it. The host API is
          language-agnostic by design; what your Rune sees is the same across
          guests.
        </p>
      </Section>

      <Section title="How a language is added">
        <p>
          Each backend implements a single trait, <code>LanguageRuntime</code>,
          in <code>crates/rune-host-api</code>. The trait says: given a path to
          a script, load it; given a query callback, register it; given a reload
          signal, tear down and rebuild. Everything else — event dispatch,
          command registration, store persistence — is host-side machinery
          routed back to the guest via callbacks. New backends register
          themselves in the loader; nothing in the Paper plugin changes.
        </p>
        <Note>
          This is why the platform can promise &quot;same API across
          languages.&quot; The decorators and globals you write against aren't
          TypeScript features — they're a contract any backend can materialize.
        </Note>
      </Section>
    </DocsPage>
  );
}
