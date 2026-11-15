import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Section } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Menus",
  description:
    "rune.gui() builds chest-style inventory UIs with per-slot click handlers, decorative fills, and private chat prompts.",
};

export default function MenusPage() {
  return (
    <DocsPage
      slug="menus"
      title="Menus."
      description="rune.gui() is the chest-inventory UI builder. You declare a title and a row count, fill it with items, attach click handlers per slot, and open it on a player. Rune protects its menus from inventory clicks, drags, and creative item changes."
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
    title: "<gradient:#9b87f5:#5b3df5>Guild Ranks Admin</gradient>",
    rows: 3,
  });

  gui.fill(GLASS());                             // decorative background
  gui.slot(11, USERS_ICON(player), (e) => {
    const clicked = e.getWhoClicked() as Player;
    rune.schedule.nextTick(() => openUsersMenu(clicked, 0));
  });
  gui.slot(13, GROUPS_ICON(), (e) => {
    const clicked = e.getWhoClicked() as Player;
    rune.schedule.nextTick(() => openGroupsMenu(clicked, 0));
  });
  gui.slot(15, TRACKS_ICON(), (e) => {
    const clicked = e.getWhoClicked() as Player;
    rune.schedule.nextTick(() => openTracksMenu(clicked, 0));
  });
  gui.slot(22, CLOSE_ICON(), (e) => {
    const clicked = e.getWhoClicked();
    rune.schedule.nextTick(() => clicked.closeInventory());
  });

  gui.open(player);
}`}
        />
        <p>
          The handler signature mirrors <code>InventoryClickEvent</code> — you
          get the full event, including which item was clicked and which mouse
          button was used. The event is auto-cancelled before your handler runs,
          so the player can’t take the icon out. Use{" "}
          <code>rune.schedule.nextTick</code> when opening another inventory or
          closing it from a click handler.
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
          render one at a time. Below is the helper guild-ranks uses; it's a
          stateless function that returns a window into the underlying list.
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

      <Section title="Private chat prompts">
        <p>
          Rune 0.5.1 adds <code>rune.gui.prompt(player, spec)</code> and{" "}
          <code>gui.prompt(player, spec)</code>. The prompt closes the inventory
          and reads the player’s next chat message privately. By default it
          expires after 60 seconds. The player can type <code>!cancel</code> to
          cancel.
        </p>
        <CodeBlock
          lang="typescript"
          code={`export function askForLabel(player: Player) {
  rune.gui.prompt(player, {
    title: "New label",
    hint: "Type in chat or enter !cancel.",
    timeoutMs: 30_000,
    onReply: (text, player) => player.sendMessage("Label: " + text),
    onCancel: (player) => player.sendMessage("Canceled."),
    onTimeout: (player) => player.sendMessage("Prompt expired."),
  });
}`}
        />
        <p>
          Opening another Rune GUI or disconnecting clears the prompt. Use{" "}
          <code>rune.gui.hasPrompt(player)</code> to check for one and{" "}
          <code>rune.gui.cancelPrompt(player)</code> to clear it yourself.
        </p>
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
gui.slot(22, CLOSE_ICON(), (e) => {
  const clicked = e.getWhoClicked();
  rune.schedule.nextTick(() => clicked.closeInventory());
});`}
        />
      </Section>
    </DocsPage>
  );
}
