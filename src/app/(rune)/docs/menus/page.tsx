import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Menus",
  description:
    "rune.gui() builds chest-style inventory UIs with per-slot click handlers, decorative fills, and pagination.",
};

export default function MenusPage() {
  return (
    <DocsPage
      slug="menus"
      title="Menus."
      description="rune.gui() is the chest-inventory UI builder. You declare a title and a row count, fill it with items, attach click handlers per slot, and open it on a player. Clicks are auto-cancelled so the inventory acts as a control surface rather than something the player drags items in and out of."
    >
      <Section title="A simple menu">
        <p>
          The minimal menu is title + rows + a few slots. Slots are numbered 0
          to <code>rows * 9 - 1</code> in row-major order.
        </p>
        <CodeBlock
          lang="typescript"
          code={`export function openAdminMenu(player: Player): void {
  const gui = rune.gui({
    title: "<gradient:#9b87f5:#5b3df5>Ward Admin</gradient>",
    rows: 3,
  });

  gui.fill(GLASS());                             // decorative background
  gui.slot(11, USERS_ICON(player), (e) => {
    openUsersMenu(e.getWhoClicked() as Player, 0);
  });
  gui.slot(13, GROUPS_ICON(), (e) => {
    openGroupsMenu(e.getWhoClicked() as Player, 0);
  });
  gui.slot(15, TRACKS_ICON(), (e) => {
    openTracksMenu(e.getWhoClicked() as Player, 0);
  });
  gui.slot(22, CLOSE_ICON(), (e) => {
    e.getWhoClicked().closeInventory();
  });

  gui.open(player);
}`}
        />
        <p>
          The handler signature mirrors <code>InventoryClickEvent</code> — you
          get the full event, including which item was clicked and which mouse
          button was used. The event is auto-cancelled before your handler runs,
          so the player can't accidentally take the icon out.
        </p>
      </Section>

      <Section title="Building items">
        <p>
          The icon constants in the example above are factory functions that
          return real <code>ItemStack</code>s via <code>rune.item()</code>. The
          builder takes a <code>Material</code>, then chains
          name/lore/skull/enchant calls, and ends with <code>.build()</code>.
        </p>
        <CodeBlock
          lang="typescript"
          code={`const USERS_ICON = (player: Player) =>
  rune.item(bukkit.Material.PLAYER_HEAD)
    .skullOwner(player)
    .name("<gradient:#ffd166:#f7b500>Users</gradient>")
    .lore([
      "<gray>View and edit any player's",
      "<gray>permissions, groups, and rank.",
    ])
    .build();

const GLASS = () =>
  rune.item(bukkit.Material.GRAY_STAINED_GLASS_PANE)
    .name(" ")
    .build();`}
        />
        <p>
          Strings passed to <code>.name()</code> and <code>.lore()</code> are
          MiniMessage by default. The builder handles the legacy conversion that
          vanilla item display names insist on.
        </p>
      </Section>

      <Section title="Pagination">
        <p>
          Lists longer than a single inventory want pagination. There's no
          built-in paginator — the pattern is to slice your data into pages and
          render one at a time. Below is the helper ward uses; it's a stateless
          function that returns a window into the underlying list.
        </p>
        <CodeBlock
          lang="typescript"
          code={`interface Page<T> {
  items: T[];
  page: number;
  total: number;
  hasPrev: boolean;
  hasNext: boolean;
}

export function paginate<T>(all: T[], page: number, size: number): Page<T> {
  const total = Math.max(1, Math.ceil(all.length / size));
  const clamped = Math.max(0, Math.min(page, total - 1));
  const start = clamped * size;
  return {
    items: all.slice(start, start + size),
    page: clamped,
    total,
    hasPrev: clamped > 0,
    hasNext: clamped < total - 1,
  };
}`}
        />
        <p>
          Wire prev/next clicks to re-open the menu with <code>page + 1</code>{" "}
          or <code>page - 1</code>. Because each open is a fresh{" "}
          <code>rune.gui()</code>, the only state to manage is the page number.
        </p>
      </Section>

      <Section title="Chat prompts">
        <p>
          For text input — naming a group, picking a number — chest GUIs don't
          help. ward uses a chat-prompt pattern: close the inventory, send a
          question, register a one-shot chat listener, resolve a promise with
          the typed answer.
        </p>
        <CodeBlock
          lang="typescript"
          code={`export function prompt(player: Player, question: string): Promise<string | null> {
  return new Promise((resolve) => {
    runOnMain(() => {
      player.closeInventory();
      player.sendMessage(rune.mm(question));
    });

    awaitChat(String(player.getUniqueId()), (text) => {
      const trimmed = text.trim();
      if (!trimmed || trimmed.toLowerCase() === "cancel") {
        resolve(null);
        return;
      }
      resolve(trimmed);
    });
  });
}`}
        />
        <p>
          The internal <code>awaitChat</code> helper is a registry keyed by
          UUID; an underlying <code>@EventHandler</code> on{" "}
          <code>AsyncChatEvent</code> looks the player up, cancels the event,
          and fires the callback. Reload clears the registry — if a player was
          mid-prompt, they need to re-open the menu.
        </p>
        <Note>
          Don't try to use a sign-edit GUI or a written-book trick to get text
          input. They're laggy on modern clients and don't survive reload. A
          chat prompt with a clean cancel path is worth the extra two lines.
        </Note>
      </Section>

      <Section title="Decorating with fills">
        <p>
          <code>gui.fill(item)</code> places <code>item</code> in every slot
          that doesn't already have one assigned. Call it before your real slots
          so the background sits behind them. <code>gui.border(item)</code> is a
          convenience for filling just the outer ring — useful when you want a
          glass frame around your content.
        </p>
        <CodeBlock
          lang="typescript"
          code={`gui.border(GLASS());                          // frame
gui.slot(13, PRIMARY_ACTION_ICON(), onClick);  // centerpiece
gui.slot(15, SECONDARY_ICON(), onSecondary);
gui.slot(22, CLOSE_ICON(), (e) => e.getWhoClicked().closeInventory());`}
        />
      </Section>
    </DocsPage>
  );
}
