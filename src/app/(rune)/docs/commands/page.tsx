import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Commands",
  description:
    "@Command, @Arg, @Run — declarative Brigadier commands with typed arguments, suggesters, and subcommand trees.",
};

export default function CommandsPage() {
  return (
    <DocsPage
      slug="commands"
      title="Commands."
      description="A command in Rune is a class. The class is decorated with @Command and a space-separated path; its fields are decorated with @Arg and become the command's typed positional arguments; one method is decorated with @Run and becomes the executor. The host wires the result into Paper's Brigadier tree."
    >
      <Section title="The smallest command">
        <p>
          Three decorators, one method, you're done. The class is constructed
          fresh per invocation, so <code>this.arg</code> is always the parsed
          value for the current call.
        </p>
        <CodeBlock
          lang="typescript"
          code={`@Command("hello")
export class Hello {
  @Arg("target", { type: "player" })
  target!: Player;

  @Run
  run(ctx: CommandCtx) {
    ctx.sender.sendMessage(\`hello, \${this.target.getName()}\`);
  }
}`}
        />
        <p>
          <code>ctx.sender</code> is the <code>CommandSender</code> who ran the
          command (a player, the console, or a command block).
          <code>ctx.args</code> is a typed record of every <code>@Arg</code> on
          the class — handy when you want to fan out to a helper rather than
          read <code>this</code>.
        </p>
      </Section>

      <Section title="Argument types">
        <p>
          The <code>type</code> on <code>@Arg</code> picks a Brigadier parser.
          The built-ins:
        </p>
        <ul>
          <li>
            <code>string</code> — quoted string. <code>word</code> — single
            token. <code>greedy</code> — rest of the line.
          </li>
          <li>
            <code>int</code>, <code>long</code>, <code>double</code>,{" "}
            <code>bool</code> — primitive numerics + boolean.
          </li>
          <li>
            <code>player</code>, <code>players</code> — resolves to a single
            online <code>Player</code> or an array of them.
          </li>
          <li>
            <code>entity</code>, <code>entities</code> — broader entity
            selectors.
          </li>
          <li>
            <code>world</code> — a <code>World</code> by name.
          </li>
          <li>
            <code>block_pos</code> — an <code>x y z</code> coordinate tuple,
            supporting <code>~</code> relative form.
          </li>
        </ul>
      </Section>

      <Section title="Suggesters">
        <p>
          Pass <code>suggest</code> on the argument options to attach an
          autocomplete provider. The function is called with the partial input
          and the context, and returns an array of strings synchronously (or a
          promise of one for async sources).
        </p>
        <CodeBlock
          lang="typescript"
          code={`const groupSuggester = (partial: string) => {
  return cachedGroupNames()
    .filter((name) => name.startsWith(partial.toLowerCase()));
};

@Command("ward group")
export class WardGroup {
  @Arg("group", { type: "string", suggest: groupSuggester })
  group!: string;

  @Run
  async run(ctx: CommandCtx) {
    if (!requirePerm(ctx, "ward.group.info")) return;
    await renderGroupCard(ctx, this.group);
  }
}`}
        />
        <Note>
          Suggesters run on every tab-press and should be cheap. Prime the data
          they consult at script-load and keep it in memory; ward refreshes its
          group cache after every mutation so the suggester stays
          sub-millisecond.
        </Note>
      </Section>

      <Section title="Subcommand trees">
        <p>
          <code>@Command</code> takes a space-separated path. Each segment
          becomes a literal in the Brigadier tree; each class is one leaf. The
          host stitches the tree together by matching prefixes, so{" "}
          <code>ward group create</code> and <code>ward group prefix set</code>{" "}
          can coexist as siblings of <code>ward group</code>.
        </p>
        <CodeBlock
          lang="typescript"
          code={`@Command("ward group create")
export class WardGroupCreate {
  @Arg("name", { type: "string" })
  name!: string;

  @Run
  async run(ctx: CommandCtx) {
    if (!requirePerm(ctx, PERM.groupEdit)) return;
    if (!/^[a-z0-9_-]{1,32}$/i.test(this.name)) {
      err(ctx.sender, "group name must be 1-32 chars of [a-zA-Z0-9_-]");
      return;
    }
    const created = await createGroup(this.name);
    await refreshGroups();
    ok(ctx.sender, \`created group \${created.name}\`);
  }
}`}
        />
        <p>
          The parent path (<code>ward group</code> on its own) is a valid leaf
          if you also declare it; without an explicit{" "}
          <code>@Command(&quot;ward group&quot;)</code> class the parent
          tab-completes to its children but won't run.
        </p>
      </Section>

      <Section title="Aliases, descriptions, permissions">
        <p>
          Pass an options object to <code>@Command</code> for everything Paper
          expects to know about your command at registration time.
        </p>
        <CodeBlock
          lang="typescript"
          code={`@Command("ward", {
  description: "Ward permissions management",
  aliases: ["perms", "permissions"],
  permission: "ward.command.ward",
})
export class WardRoot {
  @Run
  run(ctx: CommandCtx) {
    ctx.sender.sendMessage("see /ward help");
  }
}`}
        />
        <p>
          <code>permission</code> gates command discovery at the Bukkit level —
          players who don't have the node won't see the command in tab-complete.
          For finer-grained per-method gating, check a permission inside{" "}
          <code>@Run</code> and return early.
        </p>
      </Section>

      <Section title="Optional and greedy arguments">
        <p>
          Mark an argument optional with <code>optional: true</code>; the field
          will be <code>undefined</code> if the player didn't provide it. Use{" "}
          <code>greedy: true</code> on a string to slurp the rest of the input —
          useful for messages, descriptions, and free-form prefixes.
        </p>
        <CodeBlock
          lang="typescript"
          code={`@Command("ward group prefix set")
export class WardGroupPrefixSet {
  @Arg("group", { type: "string", suggest: groupSuggester })
  group!: string;

  @Arg("text", { type: "greedy", greedy: true })
  text!: string;

  @Run
  async run(ctx: CommandCtx) {
    const parsed = splitPriorityText(this.text, 100);
    await setPrefix(this.group, parsed.text, parsed.priority);
  }
}`}
        />
      </Section>

      <Section title="Imperative builder">
        <p>
          If you'd rather construct commands at runtime — say, registering
          commands from a config file — use the builder.{" "}
          <code>rune.command(&quot;ward&quot;)</code> returns a fluent surface
          that mirrors the decorators.
        </p>
        <CodeBlock
          lang="typescript"
          code={`rune.command("kick")
  .argument("target", "player")
  .argument("reason", "greedy", { optional: true })
  .run((ctx) => {
    const target = ctx.args.target as Player;
    const reason = (ctx.args.reason as string | undefined) ?? "no reason";
    target.kick(reason);
  })
  .register();`}
        />
        <Note variant="warn">
          The Brigadier tree is locked once Paper finishes its COMMANDS
          lifecycle event. Register commands at top-level script load, not from
          inside an event handler that fires later.
        </Note>
      </Section>
    </DocsPage>
  );
}
