import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Section } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Adventure and primitives",
  description:
    "Send Adventure messages and work with common Paper objects from TypeScript.",
};

export default function AdventurePage() {
  return (
    <DocsPage
      slug="adventure"
      title="Adventure and primitives."
      description="Use rune.adventure for messaging and rune.types for common Paper classes. Both are available directly in TypeScript Runes."
    >
      <Section title="Send a message">
        <CodeBlock
          lang="typescript"
          code={`const { adventure } = rune;

rune.on(Events.PlayerJoinEvent, (event) => {
  const player = event.getPlayer();
  const welcome = adventure.format\`<gold>Welcome, \${player.getName()}!</gold>\`;

  adventure.send(player, welcome);
  adventure.title(player, welcome, "Glad you're here", { stayMs: 2200 });
  adventure.actionBar(player, "Use /help to see commands");
  adventure.playSound(player, "minecraft:entity.player.levelup", { volume: 0.5 });
});`}
        />
        <p>
          Plain strings are literal. Use <code>adventure.miniMessage()</code>
          or the <code>adventure.format</code> template tag for rich text.
          Interpolated strings are inserted literally. Adventure components can
          also be interpolated to preserve their styling.
        </p>
        <CodeBlock
          lang="typescript"
          code={`const name = "<red>Still literal";
const welcome = rune.adventure.miniMessage("<gold>Hello, <name>!", { name });
rune.adventure.broadcast(welcome);`}
        />
      </Section>
      <Section title="Compose components">
        <CodeBlock
          lang="typescript"
          code={`const a = rune.adventure;
const label = a.hover(a.text("Open the guide", "#ffb347"), "Click to open");
const link = a.click(label, "open_url", "https://runemc.dev/docs");

a.send(rune.players(), link);

const book = a.book("Server guide", "Operators", [link, a.text("Have fun!")]);
const player = rune.player("Alex");
if (player) a.openBook(player, book);`}
        />
        <p>
          Use <code>join</code>, <code>translate</code>, and{" "}
          <code>serialize</code>
          to combine, localize, and export components. The{" "}
          <code>Component</code>, <code>Style</code>, <code>ClickEvent</code>,
          <code>HoverEvent</code>, <code>TagResolver</code>, and other Adventure
          classes are also available directly on <code>rune.adventure</code>.
        </p>
      </Section>
      <Section title="Boss bars, tab lists, and sounds">
        <CodeBlock
          lang="typescript"
          code={`const a = rune.adventure;
const team = a.audience(rune.players());
const bar = a.bossBar(a.text("Race starts soon", "gold"), {
  progress: 0.5,
  color: "yellow",
  overlay: "notched_10",
});

a.showBossBar(team, bar);
a.tabList(team, a.text("Sprint Arena", "gold"), "Waiting for players");
bar.progress(0.75);
a.hideBossBar(team, bar);
a.stopSound(team, "minecraft:entity.player.levelup");`}
        />
      </Section>
      <Section title="Common Paper objects">
        <CodeBlock
          lang="typescript"
          code={`const { Material, PotionEffect } = rune.types;
const world = rune.world("world");

if (world) {
  const spawn = rune.location(world, 10.5, 70, 8.5);
  const floor = rune.blockAt(world, 10, 69, 8);
  floor.setType(Material.STONE);

  const player = rune.player("Alex"); // exact online name or UUID
  if (player) player.teleport(spawn);
}

const direction = rune.vector(0, 1, 0);`}
        />
        <p>
          <code>rune.types</code> also exposes <code>Location</code>,
          <code> Vector</code>, <code>ItemStack</code>,{" "}
          <code>NamespacedKey</code>,<code> EntityType</code>,{" "}
          <code>GameMode</code>, and <code>PotionEffectType</code>. Existing
          helpers such as <code>rune.item</code>, <code>rune.key</code>, and{" "}
          <code>rune.msg</code> remain available.
        </p>
      </Section>
    </DocsPage>
  );
}
