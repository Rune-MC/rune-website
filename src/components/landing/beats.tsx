import { CodeBlock } from "@/components/code-block";
import { LanguageMatrix } from "./language-matrix";

interface Beat {
  id: string;
  title: string;
  body: string;
  code: string | "matrix";
}

const beats: Beat[] = [
  {
    id: "embedded",
    title: "Embedded, not adjacent.",
    body: "Other plugin scripts run as a sidecar process, serializing every player action through a socket or HTTP boundary. Rune embeds Node.js inside the Paper JVM via the Panama FFM API. A method call from Java into JS is an upcall, not a round-trip.",
    code: `// no fetch, no socket, no JSON. the java object is right there.
const world = rune.bukkit.getWorlds().get(0);
const spawn = world.getSpawnLocation();`,
  },
  {
    id: "polyglot",
    title: "Polyglot from day one.",
    body: "TypeScript ships first; Wasm is already wired via Wasmtime. Python, Lua, and Rust-to-Wasm are next. The host API is language-agnostic, so what your Rune sees is the same across runtimes.",
    code: "matrix",
  },
  {
    id: "types",
    title: "Types from your actual classpath.",
    body: "On enable, the plugin reflects every Bukkit, Paper, Adventure, and declared third-party plugin class on the classpath and writes them to .d.ts files. Your IDE autocompletes against the server you are shipping for, not a hand-maintained type package.",
    code: `// rune.jsonc
{
  "plugins": {
    "Vault": { "alias": "vault", "package": "net.milkbowl.vault" }
  }
}

// salary.ts
@Listener
export class Salary {
  @EventHandler(Events.PlayerJoinEvent)
  onJoin(e: PlayerJoinEvent) {
    vault.economy.deposit(e.getPlayer(), 100);
  }
}`,
  },
];

export function Beats() {
  return (
    <section className="mx-auto max-w-4xl px-6">
      <div className="divide-y divide-border">
        {beats.map((beat) => (
          <article key={beat.id} className="py-16">
            <h2 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
              {beat.title}
            </h2>
            <p className="mt-4 max-w-prose text-base leading-relaxed text-foreground">
              {beat.body}
            </p>
            <div className="mt-8">
              {beat.code === "matrix" ? (
                <LanguageMatrix />
              ) : (
                <CodeBlock code={beat.code} lang="typescript" />
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
