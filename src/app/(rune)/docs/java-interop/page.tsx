import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section, Sub } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Java interop",
  description:
    "Call statics, subclass Java types from JS, navigate the classpath via package proxies, and bind third-party plugins as aliases.",
};

export default function JavaInteropPage() {
  return (
    <DocsPage
      slug="java-interop"
      title="Java interop."
      description="Bukkit isn't the only Java surface you have access to. Rune exposes the full JVM classpath through a small set of primitives: package proxies, static call helpers, and an interface-implementation bridge that lets you hand JS callbacks to Java code that expects to be called back."
    >
      <Section title="Package proxies">
        <p>
          The globals <code>org</code>, <code>java</code>, <code>javax</code>,{" "}
          <code>net</code>, <code>io</code>, and <code>com</code> are proxies.
          Reading a property navigates the classpath; the final access returns a
          Java class or static helper.
        </p>
        <CodeBlock
          lang="typescript"
          code={`// Reach into the JDK.
const buf = java.nio.ByteBuffer.allocate(1024);

// Reach into Bukkit.
const material = org.bukkit.Material.DIAMOND_SWORD;

// Reach into Paper.
const component = io.papermc.paper.text.PaperComponents.legacySectionSerializer();`}
        />
        <p>
          The host writes <code>.d.ts</code> declarations for the packages it
          knows about (Bukkit, Paper, Adventure, declared plugins), so
          autocomplete works. Anything else returns a weakly-typed proxy —
          useful but you're on your own for type safety.
        </p>
      </Section>

      <Section title="bukkit and rune.bukkit">
        <p>
          <code>bukkit</code> is a convenience alias for <code>org.bukkit</code>
          . It's the most common entry point — <code>bukkit.Bukkit</code> for
          the static API, <code>bukkit.Material</code> for the enum, and so on.{" "}
          <code>rune.bukkit</code> is identical; the redundancy exists so
          handlers reading <code>e.getPlayer()</code> can stay short while files
          that prefer namespaced access can use{" "}
          <code>rune.bukkit.Bukkit.getOnlinePlayers()</code>.
        </p>
      </Section>

      <Section title="Calling static methods">
        <p>
          Static method calls work through the proxy the same way instance calls
          work on live refs. <code>rune.callStatic</code> exists for the rare
          case where you need to call a static method whose class name isn't a
          clean dotted path (a synthetic class, an inner class with{" "}
          <code>$</code>) — pass the FQN as a string.
        </p>
        <CodeBlock
          lang="typescript"
          code={`// Normal path:
const id = bukkit.Bukkit.getServer().getMaxPlayers();

// Awkward FQN:
const enumValue = rune.callStatic(
  "net.example.internal.Inner$State",
  "valueOf",
  "ACTIVE",
);`}
        />
      </Section>

      <Section title="Implementing Java interfaces from JS">
        <p>
          Sometimes a Java API expects you to hand it an implementation of an
          interface — a listener, a handler, a provider.{" "}
          <code>rune.implement(fqcn, methods)</code> generates a Java subclass
          at runtime that routes intercepted method calls to your JS object.
          ward uses it to register a PlaceholderAPI expansion, which
          PlaceholderAPI insists on receiving as a Java instance.
        </p>
        <CodeBlock
          lang="typescript"
          code={`expansionRef = rune.implement(
  "me.clip.placeholderapi.expansion.PlaceholderExpansion",
  {
    getIdentifier: () => "ward",
    getAuthor:     () => "ward",
    getVersion:    () => "1.0",
    persist:       () => true,
    canRegister:   () => true,
    onRequest: (offlinePlayer: any, rawParams: any): string => {
      const params = String(rawParams ?? "");
      if (!offlinePlayer) return "";
      const uuid = String(offlinePlayer.getUniqueId());

      const display = getLastDisplay(uuid);
      if (params === "prefix") return display.prefix;
      if (params === "suffix") return display.suffix;
      return resolveParam(uuid, offlinePlayer, params);
    },
  },
);

papi.PlaceholderAPI.registerExpansion(expansionRef);`}
        />
        <p>
          Each method is synchronous from Java's point of view: the JVM parks on
          your JS callback, waits for the return value, and coerces it to the
          declared type. Don't <code>await</code> inside an{" "}
          <code>implement</code> handler — JS will return a promise object and
          Java will probably crash trying to use it.
        </p>
        <Note>
          <code>implement</code> is the escape hatch that makes Rune
          interoperable with the existing plugin ecosystem. Anywhere Paper or
          another plugin asks &quot;give me an instance of this interface,&quot;
          this is the answer.
        </Note>
      </Section>

      <Section title="Plugin aliases">
        <p>
          Declaring a plugin in <code>rune.jsonc</code> binds two things: a
          global alias and a generated <code>.d.ts</code>. Inside your code, the
          alias acts like any other namespace.
        </p>
        <CodeBlock
          lang="jsonc"
          code={`{
  "plugins": {
    "Vault":          { "alias": "vault", "package": "net.milkbowl.vault" },
    "PlaceholderAPI": { "alias": "papi",  "package": "me.clip.placeholderapi" }
  }
}`}
        />
        <CodeBlock
          lang="typescript"
          code={`if (typeof vault === "undefined") {
  console.warn("[ward] Vault not installed; economy disabled.");
} else {
  const eco = vault.RegisteredServiceProvider.get(
    "net.milkbowl.vault.economy.Economy",
  );
  // ... transact normally
}`}
        />
        <Sub title="Optional vs. required">
          <p>
            A declared plugin is <em>optional</em> by default — if it's not
            installed on the server, the alias is <code>undefined</code> and
            your code should guard. To make it required, add the plugin to your{" "}
            <code>capabilities.required</code> array; future versions of the
            host will refuse to load your Rune unless the named plugin is
            present.
          </p>
        </Sub>
      </Section>

      <Section title="Scheduling on the main thread">
        <p>
          Bukkit's API is mostly main-thread-only. JS code, by default, runs on
          the Node event loop. The bridge is <code>rune.runOnMain(fn)</code>: it
          queues your function on the next tick and returns a promise of its
          result. Use it anywhere you've left the main thread (HTTP handlers,
          async handler bodies after the first <code>await</code>, callbacks
          from a non-Bukkit library).
        </p>
        <CodeBlock
          lang="typescript"
          code={`const playerName = await rune.runOnMain(() => {
  const p = bukkit.Bukkit.getPlayer(uuid);
  return p ? p.getName() : null;
});`}
        />
        <Note variant="warn">
          Don't call <code>runOnMain</code> from inside an{" "}
          <code>@EventHandler</code> body that's already on the main thread —
          you'll deadlock waiting for the next tick. Sync handler bodies just
          call Bukkit directly.
        </Note>
      </Section>
    </DocsPage>
  );
}
