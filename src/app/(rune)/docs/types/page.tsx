import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section, Sub } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Types",
  description:
    "Your IDE autocompletes against the classes that actually exist on this server. Here is how the type files get generated and how to extend them.",
};

export default function TypesPage() {
  return (
    <DocsPage
      slug="types"
      title="Types."
      description="Rune ships TypeScript types not by maintaining a hand-written API package but by reflecting your live classpath at runtime and emitting .d.ts files. If a plugin is on the server, your IDE knows about its classes. If it isn't, it doesn't. The types match reality."
    >
      <Section title="What gets generated, and when">
        <p>
          On every server start, after the Paper plugin enables and before any
          script loads, the host walks the live classpath and writes three
          things:
        </p>
        <ul>
          <li>
            <code>plugins/Rune/types/bukkit.d.ts</code> — every public class
            under <code>org.bukkit.*</code>, <code>io.papermc.paper.*</code>,
            and <code>net.kyori.adventure.*</code>.
          </li>
          <li>
            <code>plugins/Rune/types/events.d.ts</code> — every subclass of{" "}
            <code>org.bukkit.event.Event</code> that the reflector finds,
            including those contributed by other plugins, plus the{" "}
            <code>Events</code> enum that backs{" "}
            <code>@EventHandler(Events.X)</code>.
          </li>
          <li>
            <code>plugins/Rune/types/&lt;alias&gt;.d.ts</code> — one per plugin
            declared in your <code>rune.jsonc</code>'s <code>plugins</code> map,
            emitted from the plugin's package.
          </li>
        </ul>
        <p>
          The files are committed to disk so your editor can pick them up
          without running the server. They're regenerated on every start so they
          stay accurate as you add or remove plugins.
        </p>
      </Section>

      <Section title="Wiring them into tsconfig">
        <p>
          The scaffolded <code>tsconfig.json</code> already includes the right
          paths. If you're hand-rolling one, point TypeScript at the types
          directory and let it discover everything.
        </p>
        <CodeBlock
          lang="jsonc"
          code={`{
  "compilerOptions": {
    "target":      "esnext",
    "module":      "esnext",
    "moduleResolution": "bundler",
    "strict":      true,
    "types":       ["@rune/sdk"],
    "experimentalDecorators": true,
    "emitDecoratorMetadata":   true
  },
  "include": [
    "**/*.ts",
    "../../types/**/*.d.ts"
  ]
}`}
        />
        <p>
          The <code>experimentalDecorators</code> flag is needed for{" "}
          <code>@Listener</code> / <code>@Command</code> / friends to
          type-check. Rune uses TC39 stage-3 decorators at runtime; the legacy
          TS-decorator flag is just for type-checking compatibility today and
          will go away once TS 5.9 stabilizes stage-3 emit.
        </p>
      </Section>

      <Section title="Author-owned types.d.ts">
        <p>
          If your Rune exposes its own globals (ward exposes{" "}
          <code>ward.registerTransaction(...)</code> on the global scope),
          declare them in a <code>types.d.ts</code> at your project root.
          TypeScript will merge them with the host-generated declarations.
        </p>
        <CodeBlock
          lang="typescript"
          code={`// ward/types.d.ts
declare global {
  const ward: WardApi;
}

interface WardApi {
  registerTransaction<A extends TransactionArgs>(
    handler: string,
    impl: TransactionHandler<A>,
  ): void;
  unregisterTransaction(handler: string): void;
}

export {};   // make this a module so 'declare global' works`}
        />
      </Section>

      <Section title="What's typed and what isn't">
        <p>The reflector tries hard to be accurate but has limits.</p>
        <Sub title="Typed">
          <ul>
            <li>
              Public constructors, methods, and fields on every reflected class.
            </li>
            <li>
              Enum values as union types — autocomplete on{" "}
              <code>bukkit.Material</code> lists every block and item.
            </li>
            <li>
              Generic parameters with their declared bounds (so{" "}
              <code>List&lt;Player&gt;</code> from Java surfaces as{" "}
              <code>JavaList&lt;Player&gt;</code> in TS).
            </li>
          </ul>
        </Sub>
        <Sub title="Not typed">
          <ul>
            <li>
              Anonymous and synthetic classes (anything Java's{" "}
              <code>Class#isSynthetic()</code> reports).
            </li>
            <li>
              Methods on package-private classes — they exist at runtime if you
              can reach them, but autocomplete won't suggest them.
            </li>
            <li>
              Reflective access via <code>rune.callStatic</code> with a string
              FQN. By design — you're telling the host you know what you're
              doing.
            </li>
          </ul>
        </Sub>
      </Section>

      <Section title="Adding types for a plugin not in rune.jsonc">
        <p>
          If you want intellisense for a plugin you're not formally declaring
          (perhaps for one-off interop), write the types yourself in{" "}
          <code>types.d.ts</code> using the global proxy. The runtime call path
          is unaffected.
        </p>
        <CodeBlock
          lang="typescript"
          code={`declare const someplugin: {
  Api: {
    getInstance(): {
      getThing(id: string): SomeThing | null;
    };
  };
};

interface SomeThing {
  getName(): string;
}`}
        />
        <Note>
          When you eventually formalize the dependency by adding it to{" "}
          <code>rune.jsonc</code>, delete your hand-rolled declarations — the
          auto-generated ones will be more accurate.
        </Note>
      </Section>
    </DocsPage>
  );
}
