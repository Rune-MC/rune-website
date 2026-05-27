import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section, Sub } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Listeners",
  description:
    "Subscribe to Bukkit events with @Listener and @EventHandler. Sync or async. Types come from your actual classpath.",
};

export default function ListenersPage() {
  return (
    <DocsPage
      slug="listeners"
      title="Listeners."
      description="@Listener is a class decorator. @EventHandler is a method decorator. Together they replace the boilerplate of registering a Bukkit listener and route the event payload into a typed handler that runs in your script."
    >
      <Section title="The shape">
        <p>
          Decorate a class with <code>@Listener</code> and any method inside it
          with <code>@EventHandler(Events.X)</code>. At decorator-evaluation
          time, the host registers an instance of your class as a Paper listener
          and binds each annotated method to the event you named. The class is
          instantiated with a zero-argument constructor; if you need state, put
          it on the instance.
        </p>
        <CodeBlock
          lang="typescript"
          code={`@Listener
export class WardLifecycle {
  @EventHandler(Events.PlayerJoinEvent)
  async onJoin(e: PlayerJoinEvent) {
    await applyToPlayer(e.getPlayer());
  }

  @EventHandler(Events.PlayerQuitEvent)
  onQuit(e: PlayerQuitEvent) {
    dropPlayer(String(e.getPlayer().getUniqueId()));
  }
}`}
        />
        <p>
          The <code>e</code> parameter is the real Bukkit event object, not a
          snapshot. Calling <code>e.getPlayer()</code> hands back a live
          reference; mutating fields on the event (cancelling, setting cancelled
          message) takes effect.
        </p>
      </Section>

      <Section title="Why Events.X instead of strings">
        <p>
          You'll see two styles in older code:{" "}
          <code>@EventHandler(&quot;PlayerJoinEvent&quot;)</code> and{" "}
          <code>@EventHandler(Events.PlayerJoinEvent)</code>. Both work. The
          enum form is preferred because the host has populated autocomplete for
          it from your live classpath — including any custom events emitted by
          plugins you declared in <code>rune.jsonc</code>. The string form is a
          fallback for dynamically-resolved events.
        </p>
      </Section>

      <Section title="Async handlers">
        <p>
          A handler can return a <code>Promise</code>. The event itself fires
          synchronously on the Paper main thread, but your async body continues
          on the Node event loop after the event has already been dispatched.
          This means:
        </p>
        <ul>
          <li>
            You can <code>await</code> a database lookup or HTTP fetch from
            inside a handler.
          </li>
          <li>
            You <em>cannot</em> cancel the event from after the first{" "}
            <code>await</code> — it's already past the point where Paper asks
            &quot;was this cancelled?&quot;
          </li>
          <li>
            Calls back into the Bukkit API from async code must be scheduled on
            the main thread with <code>rune.runOnMain(() =&gt; ...)</code>.
          </li>
        </ul>
        <CodeBlock
          lang="typescript"
          code={`@EventHandler(Events.PlayerJoinEvent)
async onJoin(e: PlayerJoinEvent) {
  const player = e.getPlayer();
  const profile = await fetchProfileFromMongo(player.getUniqueId());

  // We're off the main thread now. Schedule the response back on.
  rune.runOnMain(() => {
    player.sendMessage(\`welcome back, \${profile.title}\`);
  });
}`}
        />
        <Note variant="warn">
          The Bukkit thread-safety rules still apply. Most Bukkit API calls must
          happen on the main thread. The compiler won't catch this; testing on a
          real server will.
        </Note>
      </Section>

      <Section title="Priorities and ignoreCancelled">
        <p>
          Pass an options object as the second argument to{" "}
          <code>@EventHandler</code> when you need standard Bukkit priority
          semantics.
        </p>
        <CodeBlock
          lang="typescript"
          code={`@EventHandler(Events.PlayerCommandPreprocessEvent, {
  priority: "HIGHEST",
  ignoreCancelled: true,
})
onCommand(e: PlayerCommandPreprocessEvent) {
  if (e.getMessage().startsWith("/banned-command")) {
    e.setCancelled(true);
  }
}`}
        />
        <p>
          Valid priorities are <code>LOWEST</code>, <code>LOW</code>,{" "}
          <code>NORMAL</code> (default), <code>HIGH</code>, <code>HIGHEST</code>
          , <code>MONITOR</code>. Same semantics as Bukkit's enum.
        </p>
      </Section>

      <Section title="Multiple handlers, one class">
        <p>
          Bundle related handlers on the same class so they share state. The
          class is instantiated once per registration; every method on the
          instance sees the same <code>this</code>.
        </p>
        <CodeBlock
          lang="typescript"
          code={`@Listener
export class ChatGate {
  private mutedUntil = new Map<string, number>();

  @EventHandler(Events.AsyncChatEvent)
  onChat(e: AsyncChatEvent) {
    const uuid = String(e.getPlayer().getUniqueId());
    const until = this.mutedUntil.get(uuid);
    if (until && Date.now() < until) {
      e.setCancelled(true);
    }
  }

  @EventHandler(Events.PlayerQuitEvent)
  onQuit(e: PlayerQuitEvent) {
    this.mutedUntil.delete(String(e.getPlayer().getUniqueId()));
  }
}`}
        />
        <Sub title="Reload caveat">
          <p>
            The map above is instance state. On <code>/rune reload</code> the
            script re-evaluates and the map starts empty. If the mute window
            needs to outlive a reload, persist it through{" "}
            <a href="/docs/persistence">rune.store()</a> or a database.
          </p>
        </Sub>
      </Section>

      <Section title="Imperative subscriptions">
        <p>
          If you need a handler that you'll later remove dynamically, use the
          imperative API. <code>rune.on()</code> returns a subscription object
          with an <code>unsubscribe()</code> method.
        </p>
        <CodeBlock
          lang="typescript"
          code={`const sub = rune.on(Events.PlayerInteractEvent, (e) => {
  if (e.getAction() === "RIGHT_CLICK_BLOCK") {
    e.getPlayer().sendMessage("clicked.");
  }
});

// Later, in some other code path:
sub.unsubscribe();`}
        />
        <p>
          Decorator-style listeners are tied to the script's lifecycle and are
          torn down on reload automatically. Imperative subscriptions are too,
          but you can also tear them down before reload if your logic demands
          it.
        </p>
      </Section>
    </DocsPage>
  );
}
