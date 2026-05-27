import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section, Sub } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Lifecycle",
  description:
    "Understand load, reload, and unload — and which pieces of state survive each.",
};

export default function LifecyclePage() {
  return (
    <DocsPage
      slug="lifecycle"
      title="Lifecycle."
      description="A Rune goes through three transitions: load (server start), reload (you ran /rune reload), and unload (server stop). What survives each transition is the most important thing to internalize."
    >
      <Section title="Load">
        <p>
          When Paper enables the Rune plugin, three things happen, in order.
          First, the host reflects the live classpath and writes{" "}
          <code>bukkit.d.ts</code> plus any{" "}
          <code>types/&lt;alias&gt;.d.ts</code> for plugins you declared in{" "}
          <code>rune.jsonc</code>. Second, the loader brings up the Node runtime
          (V8 isolate, Node context, event loop). Third, the host walks{" "}
          <code>plugins/Rune/scripts/</code> and hands each script to the
          runtime in turn. Each script's top-level code executes immediately;
          decorators run during that execution, registering listeners and
          commands against Paper.
        </p>
        <p>
          By the time the Paper console says &quot;Done!&quot; every script's
          top-level body has finished and every handler is live.
        </p>
      </Section>

      <Section title="Reload">
        <p>
          <code>/rune reload</code> is the iteration loop. It does five things,
          in order:
        </p>
        <ol>
          <li>
            Drains <code>rune.serve()</code> HTTP servers.
          </li>
          <li>
            Invalidates the ref registry — every outstanding live Bukkit
            reference goes stale.
          </li>
          <li>Tears down the Node runtime entirely.</li>
          <li>Brings up a fresh runtime and replays every script's source.</li>
          <li>Re-registers all handlers.</li>
        </ol>
        <p>
          From your script's point of view, reload is a clean evaluation from
          scratch. Module-level <code>const</code>s, closures, timers — gone.
          You should write code that's safe to re-execute, and you should keep
          durable state in the right place.
        </p>
      </Section>

      <Section title="What survives reload">
        <Sub title="Survives">
          <ul>
            <li>
              Anything you put through <code>rune.store()</code>. The host
              writes it to{" "}
              <code>plugins/Rune/store/&lt;script-name&gt;.json</code> and
              replays it on the next boot.
            </li>
            <li>
              External state: files, databases, network endpoints. Mongo keeps
              running across reloads; your reconnect logic should be a singleton
              promise so the first script-load wins.
            </li>
            <li>
              The Paper main thread itself, plus the world, players, and every
              entity. Reload only resets your script, not the server.
            </li>
          </ul>
        </Sub>
        <Sub title="Does not survive">
          <ul>
            <li>
              Closure-captured Bukkit references. Re-fetch them after reload.
            </li>
            <li>
              Module-level variables. If you cached a list of online players in
              a <code>const</code>, it's gone.
            </li>
            <li>
              <code>setInterval</code> / <code>setTimeout</code> handles.
              Re-schedule from top-level code so reload re-creates them.
            </li>
            <li>HTTP server bindings. They're rebuilt on reload.</li>
          </ul>
        </Sub>
      </Section>

      <Section title="A reload-safe pattern">
        <p>
          The canonical reload-safe pattern is &quot;register at top level, do
          work in handlers, persist through rune.store or an external
          system.&quot; Below is the lifecycle entry from ward — every method is
          short and side-effect-light because the containing class is
          constructed fresh on every reload.
        </p>
        <CodeBlock
          lang="typescript"
          code={`@Listener
export class WardLifecycle {
  @EventHandler(Events.PlayerJoinEvent)
  async onJoin(e: PlayerJoinEvent) {
    try {
      await applyToPlayer(e.getPlayer());  // reads from Mongo, attaches perms
    } catch (err) {
      console.error("[ward] join apply failed:", err);
    }
  }

  @EventHandler(Events.PlayerQuitEvent)
  onQuit(e: PlayerQuitEvent) {
    const uuid = String(e.getPlayer().getUniqueId());
    dropPlayer(uuid);                       // detach attachment
    clearAutoPromoteState(uuid);            // clear local cache
  }
}

// Top-level boot work runs on every reload — keep it idempotent.
await ensureDBConnection();
await primeGroupCache();
registerDefaultTransactions();
startAutoPromoteTicker();
serveWebApi(3000);`}
        />
      </Section>

      <Section title="Unload">
        <p>
          On server shutdown the host stops accepting events, drains HTTP
          servers gracefully, and tears down the runtime. There's no per-script
          unload hook today — anything you need to close cleanly should be tied
          to a Paper shutdown event or a <code>process</code> signal handler.
        </p>
        <Note variant="warn">
          The lack of an explicit unload hook is the most likely thing to bite a
          Rune that holds external resources (open file handles, persistent
          socket connections). If you've allocated something that doesn't free
          itself on JVM exit, hook <code>PluginDisableEvent</code> for the Rune
          plugin to clean up.
        </Note>
      </Section>
    </DocsPage>
  );
}
