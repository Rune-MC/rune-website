import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Section } from "@/components/docs/docs-page";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Extensions",
  description:
    "Connect Runes with versioned services, events, settings, and operator panels.",
};

export default function ExtensionsPage() {
  return (
    <DocsPage
      slug="extensions"
      title="Extensions."
      description="Give each Rune a stable way to communicate with other packages on the same Paper server."
    >
      <Section title="Services and events">
        <p>
          Register a service under a namespaced ID and a major version.
          Consumers can look it up when they need it so either package can load
          first. Events carry structured-cloneable data and give each subscriber
          its own copy. Use player UUIDs instead of live Bukkit objects in
          events.
        </p>
        <CodeBlock
          lang="typescript"
          code={`rune.services.provide("example.score", 1, {
  score(playerId: string) { return scores.get(playerId) ?? 0; },
});

rune.events.on<{ playerId: string }>("example.won", ({ playerId }) => {
  const service = rune.services.get<{ score(id: string): number }>(
    "example.score", 1
  );
  if (service) console.info(service.score(playerId));
});`}
        />
        <p>
          Registration returns a disposer. A server-wide reload rebuilds the
          registries as Runes load. Major versions can coexist under one ID.
        </p>
      </Section>

      <Section title="Settings">
        <p>
          Describe settings with defaults, labels, and optional numeric bounds.
          Values persist across reloads. Read the settings when you need them to
          pick up edits without restarting.
        </p>
        <CodeBlock
          lang="typescript"
          code={`const settings = rune.config("sprint-arena", {
  "round-seconds": { default: 45, min: 5, max: 300, label: "Round duration" },
});

const seconds = settings.read()["round-seconds"];`}
        />
        <CodeBlock
          lang="shell"
          code="rune config sprint-arena round-seconds 60"
        />
      </Section>

      <Section title="Local operator dashboard">
        <p>
          Set <code>RUNE_DASHBOARD_TOKEN</code> in the server environment to a
          password of at least 24 characters. Then start the dashboard from a
          TypeScript Rune. Open <code>http://127.0.0.1:8777</code> and sign in
          as <code>rune</code> using that password. The dashboard binds to
          loopback for local access or access through an SSH tunnel.
        </p>
        <CodeBlock
          lang="typescript"
          code={`const token = process.env.RUNE_DASHBOARD_TOKEN;
if (token) rune.dashboard.start({ token });

rune.dashboard.panel("sprint-arena", "Sprint Arena", () => ({
  "Waiting players": queue.size,
}));`}
        />
      </Section>

      <Section title="Try Sprint Arena">
        <p>
          The example packages include a timed race, quest and Vault rewards, a
          dashboard Rune, and adapters for Vault, PlaceholderAPI, and
          WorldGuard. Each example has a manifest you can pack with the CLI.
        </p>
        <p>
          <a href={`${siteConfig.links.github}/tree/main/examples`}>
            Get the source and setup guide
          </a>
        </p>
      </Section>
    </DocsPage>
  );
}
