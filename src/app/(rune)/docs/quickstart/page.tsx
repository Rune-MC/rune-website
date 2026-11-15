import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "TypeScript and JavaScript quickstart",
  description:
    "From an empty Paper server to a Rune that announces every player join, in under five minutes.",
};

export default function Quickstart() {
  return (
    <DocsPage
      slug="quickstart"
      title="TypeScript and JavaScript quickstart"
      description="You'll install Rune onto a Paper server, scaffold a new script, write a join announcer, and reload it without restarting the server."
    >
      <Section id="node-runtime" title="Prerequisites">
        <p>
          For Python, follow the{" "}
          <a href="/docs/quickstart/python">Python quickstart</a>.
        </p>
        <ul>
          <li>Paper 1.21.4 on Java 25.</li>
          <li>
            The <code>rune</code> CLI on your PATH (
            <code>curl -fsSL https://runemc.dev/install.sh | bash</code> on
            macOS or Linux;{" "}
            <code>irm https://runemc.dev/install.ps1 | iex</code> on Windows).
          </li>
        </ul>
      </Section>

      <Section title="1. Install Rune onto the server">
        <p>
          Drop the Rune jar into <code>plugins/</code> and start the server
          once. Rune creates <code>plugins/Rune/scripts/</code> on first load
          and writes out <code>bukkit.d.ts</code> by reflecting the classpath
          you're actually running on.
        </p>
        <CodeBlock
          lang="shell"
          code={`cd your-paper-server
cp ~/Downloads/Rune-*.jar plugins/
java -Xmx2G -jar paper.jar nogui   # let it boot once, then stop`}
        />
      </Section>

      <Section title="2. Scaffold a script">
        <p>
          From inside the scripts directory, ask the CLI to scaffold a new Rune.
          It writes <code>src/index.ts</code> and a <code>rune.toml</code>
          declaring the entry point.
        </p>
        <CodeBlock
          lang="shell"
          code={`cd plugins/Rune/scripts
rune init hello
cd hello`}
        />
      </Section>

      <Section title="3. Write a join announcer">
        <p>
          Open <code>src/index.ts</code>. The scaffold gives you a working
          example; replace it with this:
        </p>
        <CodeBlock
          lang="typescript"
          code={`@Listener
export class HelloListeners {
  @EventHandler(Events.PlayerJoinEvent)
  onJoin(e: PlayerJoinEvent) {
    const player = e.getPlayer();
    rune.adventure.broadcast(rune.mm("<gold>Welcome, <name>!", {
      name: player.getName(),
    }));
  }
}`}
        />
        <p>
          Three things are happening here. <code>@Listener</code> tells the host
          to register every <code>@EventHandler</code> method on this class as a
          Bukkit listener. <code>PlayerJoinEvent</code> is a real Bukkit type —
          your IDE autocompletes against the classes that actually exist on this
          server, including any plugins you've declared. <code>rune.mm</code>{" "}
          creates the formatted component and{" "}
          <code>rune.adventure.broadcast</code> sends it to the server. The{" "}
          <a href="/docs/adventure">Adventure guide</a> covers safe
          interpolation, titles, action bars, and sounds.
        </p>
      </Section>

      <Section title="4. Reload">
        <p>
          From the server console, run <code>/rune reload</code>. The host tears
          down its Node isolate, rebuilds it, replays your scripts, and
          re-registers their handlers. There's no need to stop and restart
          Paper.
        </p>
        <Note>
          Reload re-evaluates the script from scratch. State you kept in plain
          module-level variables is gone. State you kept in{" "}
          <code>rune.store()</code> survives. Live Bukkit references (players,
          worlds) are re-wrapped on every access, so reload never leaves you
          holding a stale handle.
        </Note>
      </Section>

      <Section title="5. Watch it run">
        <p>
          Join the server. The first player to log in triggers your handler; the
          broadcast lands in everyone's chat. From here, the rest of the docs
          are a tour of features: <a href="/docs/commands">commands</a>,{" "}
          <a href="/docs/menus">menus</a>,{" "}
          <a href="/docs/persistence">persistence</a>, and{" "}
          <a href="/docs/http">HTTP servers</a> — all in the same process as the
          server.
        </p>
      </Section>
      <Section title="Use JavaScript">
        <p>
          For a plain JavaScript Rune, create a file named <code>hello.js</code>{" "}
          in <code>plugins/Rune/scripts/</code>. The Node.js runtime exposes the
          same Rune APIs to JavaScript. Reload from the server console.
        </p>
        <CodeBlock
          lang="javascript"
          code={`rune.on("PlayerJoinEvent", ({ player }) => {
  rune.broadcast("Welcome, " + player.getName() + "!");
});`}
        />
      </Section>
    </DocsPage>
  );
}
