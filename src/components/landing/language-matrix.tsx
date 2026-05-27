import type { BundledLanguage } from "shiki/bundle/full";
import { highlightSource } from "@/lib/highlighter";
import { LanguageMatrixTabs } from "./language-matrix-tabs";

interface SourceTab {
  value: string;
  label: string;
  badge?: string;
  lang: BundledLanguage;
  snippet: string;
}

const tabs: SourceTab[] = [
  {
    value: "ts",
    label: "TypeScript",
    lang: "typescript",
    snippet: `@Listener
export class Welcome {
  @EventHandler(Events.PlayerJoinEvent)
  onJoin(e: PlayerJoinEvent) {
    e.getPlayer().sendMessage("welcome.");
  }
}`,
  },
  {
    value: "wasm",
    label: "Wasm",
    lang: "rust",
    snippet: `// rune.jsonc
{ "language": "wasm", "entry": "main.wasm" }

// main.rs  (compile with: wasm-pack build)
#[no_mangle]
pub extern "C" fn on_join(player_id: u32) {
    rune::player::send_message(player_id, "welcome.");
}`,
  },
  {
    value: "python",
    label: "Python",
    badge: "planned",
    lang: "python",
    snippet: `# Coming in 2026. The host API is language-agnostic;
# Python bindings land alongside Lua and Rust-to-Wasm.`,
  },
  {
    value: "lua",
    label: "Lua",
    badge: "planned",
    lang: "lua",
    snippet: `-- Coming in 2026. The same listener model,
-- in a smaller language.`,
  },
  {
    value: "rust",
    label: "Rust → Wasm",
    badge: "planned",
    lang: "rust",
    snippet: `// Coming in 2026. First-class Rust source support;
// the runtime is already Wasmtime-backed today.`,
  },
];

export async function LanguageMatrix() {
  const highlighted = await Promise.all(
    tabs.map(async (t) => ({
      value: t.value,
      label: t.label,
      badge: t.badge,
      html: await highlightSource(t.snippet, t.lang),
    })),
  );
  return <LanguageMatrixTabs tabs={highlighted} defaultValue="ts" />;
}
