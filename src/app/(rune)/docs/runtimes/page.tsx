import type { Metadata } from "next";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Section } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Runtimes",
  description:
    "Compare Python, TypeScript, and JavaScript on your Paper server.",
};

export default function RuntimesPage() {
  return (
    <DocsPage
      slug="runtimes"
      title="Choose a runtime"
      description="Rune loads scripts from one Paper server directory. Choose the language and host features your script needs."
    >
      <Section title="Language support">
        <div className="doc-start-grid">
          <Link
            className="doc-start-link no-prose"
            href="/docs/quickstart/python"
          >
            <strong>Python</strong>
            <span>
              CPython worker with event snapshots, commands, async handlers,
              logging, and broadcasts.
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
          <Link className="doc-start-link no-prose" href="/docs/quickstart">
            <strong>TypeScript and JavaScript</strong>
            <span>
              Embedded Node.js with live Bukkit references, Adventure, npm
              libraries, and inter-Rune services.
            </span>
            <ArrowRight size={18} aria-hidden="true" />
          </Link>
        </div>
      </Section>
      <Section title="Python on CPython">
        <p>
          Install Python 3 on the server. Set <code>RUNE_PYTHON</code> to an
          absolute interpreter path if you use a separate environment. Each Rune
          receives event and command snapshots asynchronously.
        </p>
        <CodeBlock
          lang="python"
          code={`from rune import broadcast, on

@on("PlayerJoinEvent")
def welcome(event):
    broadcast(f"Welcome, {event['player']['name']}!")`}
        />
        <p>
          Python handlers react to events after dispatch. Use the Node.js
          runtime when a handler must modify or cancel a live Bukkit event
          inline.
        </p>
      </Section>
      <Section title="TypeScript and JavaScript on Node.js">
        <p>
          Rune embeds <code>libnode</code> in the Paper JVM. Scripts can call
          live Paper objects through the native bridge. TypeScript can use
          generated classpath types and decorators.
        </p>
        <CodeBlock
          lang="typescript"
          code={`rune.on(Events.PlayerJoinEvent, (event) => {
  const player = event.getPlayer();
  rune.adventure.send(player, rune.adventure.text("Welcome!", "gold"));
});`}
        />
        <p>
          Use the{" "}
          <Link href="/docs/adventure">Adventure and primitives guide</Link> for
          chat, sounds, titles, common Paper classes, and safe text
          interpolation.
        </p>
      </Section>
    </DocsPage>
  );
}
