import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section, Sub } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Persistence",
  description:
    "Three levels of state: in-memory, rune.store() JSON, and external systems like MongoDB. Pick the right one for each piece.",
};

export default function PersistencePage() {
  return (
    <DocsPage
      slug="persistence"
      title="Persistence."
      description="Every Rune juggles three kinds of state. In-memory caches die on reload. rune.store() is durable JSON that the host owns. Anything bigger — relational data, large blobs, anything you'd want to query — should live in an external store. The trick is knowing which is which."
    >
      <Section title="In-memory: free, but ephemeral">
        <p>
          Plain module-level variables and instance fields are the cheapest
          possible state. They cost nothing to read or write, and they live
          exactly as long as the current script evaluation.{" "}
          <code>/rune reload</code> wipes them. Use them for caches you can
          rebuild from a durable source.
        </p>
        <CodeBlock
          lang="typescript"
          code={`// ward primes its group cache from Mongo on every load.
let groupCache: GroupDoc[] = [];

export async function refreshGroups() {
  groupCache = await listGroups();
}

export function cachedGroupNames(): string[] {
  return groupCache.map((g) => g.name);
}`}
        />
        <p>
          The cache is in-memory, but ward refreshes it from Mongo at every
          script load, and after every mutation. Reload wipes the cache; the
          prime call rebuilds it. The user never sees the gap.
        </p>
      </Section>

      <Section title="rune.store: typed, durable JSON">
        <p>
          <code>rune.store()</code> returns a typed wrapper around a JSON file
          the host owns. The file lives at{" "}
          <code>plugins/Rune/store/&lt;script-name&gt;.json</code>. Reads are
          synchronous; writes flush asynchronously but durably. Use it for
          small, mostly-read state that you don't want to stand up a database
          for.
        </p>
        <CodeBlock
          lang="typescript"
          code={`interface ServerState {
  motd: string;
  greetedAt: Record<string, number>; // uuid → epoch ms
}

const state = rune.store<ServerState>("server-state", {
  motd: "welcome to the server.",
  greetedAt: {},
});

@Listener
export class GreetOnce {
  @EventHandler(Events.PlayerJoinEvent)
  onJoin(e: PlayerJoinEvent) {
    const player = e.getPlayer();
    const uuid = String(player.getUniqueId());
    const already = state.get().greetedAt[uuid];
    if (already) return;

    player.sendMessage(state.get().motd);
    state.update((s) => {
      s.greetedAt[uuid] = Date.now();
    });
  }
}`}
        />
        <p>
          <code>state.get()</code> returns the current value (a frozen object).{" "}
          <code>state.update(fn)</code> hands you a draft, lets you mutate it,
          and persists the result. The host serializes concurrent updates and
          flushes them in order.
        </p>
        <Sub title="Sizing rule of thumb">
          <p>
            <code>rune.store</code> is sized for &quot;config plus a handful of
            records per player.&quot; If the file would exceed a few megabytes,
            or if you need range queries or secondary indexes, graduate to a
            real database. ward keeps transient promotion state in the store and
            offloads everything else to Mongo.
          </p>
        </Sub>
      </Section>

      <Section title="External: full Node ecosystem">
        <p>
          Because Rune embeds Node, you have npm. MongoDB is the well-trodden
          path — ward uses Mongoose with decorator-defined schemas — but
          anything you can talk to from Node is fair game: Postgres via{" "}
          <code>pg</code>, SQLite via <code>better-sqlite3</code>, Redis,
          S3-compatible blob storage, an external HTTP API.
        </p>
        <Sub title="Singleton connection on script load">
          <p>
            Reload re-evaluates your script. Don't open a new connection every
            time; gate the connect on a promise that's re-used across calls.
          </p>
          <CodeBlock
            lang="typescript"
            code={`import mongoose from "mongoose";

let connectionPromise: Promise<typeof mongoose> | null = null;

export function ensureDBConnection() {
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(env.DATABASE_URI)
      .catch((err) => {
        connectionPromise = null;  // allow retry on next call
        throw err;
      });
  }
  return connectionPromise;
}`}
          />
          <p>
            Call <code>await ensureDBConnection()</code> from your top-level
            script load. After reload, the connection promise re-resolves (the
            underlying socket is unaffected) and your handlers can hit the DB
            immediately.
          </p>
        </Sub>
        <Sub title="Schema as a decorator">
          <p>
            ward defines its Mongoose models with a small in-house ODM decorator
            layer. The pattern keeps domain types and persistence schemas
            co-located.
          </p>
          <CodeBlock
            lang="typescript"
            code={`@model("Group")
export class Group {
  @unique()
  @field({ type: String, required: true, lowercase: true, trim: true })
  name!: string;

  @field({ type: String, default: "" })
  displayName!: string;

  @field({ type: Number, default: 0, index: true })
  weight!: number;

  @field({ type: Boolean, default: false, index: true })
  isDefault!: boolean;

  @field({ type: [NodeSchema], default: () => [] })
  nodes!: Node[];
}

export function findGroup(name: string): Promise<GroupDoc | null> {
  return GroupModel.findOne({ name: name.toLowerCase() }).exec();
}

export function listGroups(): Promise<GroupDoc[]> {
  return GroupModel.find().sort({ weight: -1, name: 1 }).exec();
}`}
          />
        </Sub>
      </Section>

      <Section title="Picking a layer">
        <ul>
          <li>
            Reload-rebuildable, hot-path read? In-memory cache, primed from a
            durable source at script load.
          </li>
          <li>
            Small, structured config or per-player flags?{" "}
            <code>rune.store()</code>.
          </li>
          <li>
            Anything you'd want to query, paginate, or aggregate? A real
            database.
          </li>
        </ul>
        <Note variant="warn">
          A common trap is keeping &quot;just a few&quot; player records in{" "}
          <code>rune.store()</code> and watching the file grow until every write
          is rewriting 10 MB. The store is durable JSON, not a key-value engine.
          When you're tempted to add an index, move up a layer.
        </Note>
      </Section>
    </DocsPage>
  );
}
