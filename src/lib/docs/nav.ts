export interface DocItem {
  slug: string;
  title: string;
  summary: string;
}

export interface DocGroup {
  title: string;
  items: DocItem[];
}

export const docNav: DocGroup[] = [
  {
    title: "Get started",
    items: [
      {
        slug: "",
        title: "Overview",
        summary: "Choose a language or find a task in the documentation.",
      },
      {
        slug: "quickstart",
        title: "TypeScript and JavaScript",
        summary: "Quickstart for TypeScript JavaScript Node.js Paper scripts.",
      },
      {
        slug: "quickstart/python",
        title: "Python quickstart",
        summary:
          "Install CPython, scaffold a script, and handle a Paper event.",
      },
    ],
  },
  {
    title: "Understand Rune",
    items: [
      {
        slug: "manifests",
        title: "Manifests",
        summary: "rune.toml and rune.jsonc — what they declare.",
      },
      {
        slug: "runtimes",
        title: "Runtimes",
        summary: "Languages today, languages planned, how they plug in.",
      },
      {
        slug: "lifecycle",
        title: "Lifecycle",
        summary: "Load, reload, unload — what state survives what.",
      },
      {
        slug: "capabilities",
        title: "Capabilities",
        summary: "How a Rune declares the host privileges it asks for.",
      },
    ],
  },
  {
    title: "Build a Rune",
    items: [
      {
        slug: "listeners",
        title: "Listeners",
        summary: "@Listener and @EventHandler for Bukkit events.",
      },
      {
        slug: "extensions",
        title: "Extensions",
        summary:
          "Connect Runes with services, events, settings, and dashboard panels.",
      },
      {
        slug: "adventure",
        title: "Adventure and primitives",
        summary: "Chat, titles, sounds, and commonly used Paper objects.",
      },
      {
        slug: "commands",
        title: "Commands",
        summary: "@Command, @Arg, @Run, suggesters, subcommands.",
      },
      {
        slug: "persistence",
        title: "Persistence",
        summary: "rune.store(), MongoDB, files — keeping state.",
      },
      {
        slug: "menus",
        title: "Menus",
        summary: "rune.gui() for chest UIs, paginated lists, chat prompts.",
      },
      {
        slug: "http",
        title: "HTTP servers",
        summary: "rune.serve() for REST APIs and web dashboards.",
      },
      {
        slug: "java-interop",
        title: "Java interop",
        summary: "Calling statics, implementing interfaces, plugin aliases.",
      },
      {
        slug: "types",
        title: "Types",
        summary: "How your classpath becomes .d.ts files.",
      },
    ],
  },
  {
    title: "Package and publish",
    items: [
      {
        slug: "cli",
        title: "CLI",
        summary: "rune init, pack, publish, add — the toolchain.",
      },
      {
        slug: "publishing",
        title: "Publishing",
        summary: "Packing, capabilities, semver, the Runebook flow.",
      },
    ],
  },
];

export interface DocPosition {
  group: DocGroup;
  item: DocItem;
  prev: { slug: string; title: string } | null;
  next: { slug: string; title: string } | null;
}

export function findDoc(slug: string): DocPosition | null {
  const flat = docNav.flatMap((group) =>
    group.items.map((item) => ({ group, item })),
  );
  const index = flat.findIndex((entry) => entry.item.slug === slug);
  if (index < 0) return null;
  const here = flat[index];
  const prevEntry = index > 0 ? flat[index - 1] : null;
  const nextEntry = index < flat.length - 1 ? flat[index + 1] : null;
  return {
    group: here.group,
    item: here.item,
    prev: prevEntry
      ? { slug: prevEntry.item.slug, title: prevEntry.item.title }
      : null,
    next: nextEntry
      ? { slug: nextEntry.item.slug, title: nextEntry.item.title }
      : null,
  };
}

export function docHref(slug: string): string {
  return slug ? `/docs/${slug}` : "/docs";
}
