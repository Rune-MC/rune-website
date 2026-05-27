import { PageNav } from "@/components/docs/page-nav";
import { findDoc } from "@/lib/docs/nav";

interface Props {
  slug: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function DocsPage({ slug, title, description, children }: Props) {
  const position = findDoc(slug);
  const groupLabel = position?.group.title.toLowerCase() ?? "docs";

  return (
    <article className="docs-prose min-w-0">
      <p className="mb-4 font-mono text-xs text-muted-foreground">
        docs · {groupLabel}
      </p>
      <h1 className="font-medium leading-[1.15] tracking-tight text-display text-3xl sm:text-4xl">
        {title}
      </h1>
      {description && (
        <p className="mt-4 max-w-prose text-base leading-relaxed text-foreground">
          {description}
        </p>
      )}
      <div className="mt-12 space-y-8">{children}</div>
      {position && <PageNav position={position} />}
    </article>
  );
}

export function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="text-xl font-medium tracking-tight text-display sm:text-2xl">
        {title}
      </h2>
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function Sub({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-base font-medium tracking-tight text-display sm:text-lg">
        {title}
      </h3>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}

export function Note({
  variant = "info",
  children,
}: {
  variant?: "info" | "warn";
  children: React.ReactNode;
}) {
  const cls =
    variant === "warn"
      ? "border-destructive/40 bg-destructive/5"
      : "border-border bg-muted";
  return (
    <aside
      className={`rounded border ${cls} px-4 py-3 text-sm text-foreground`}
    >
      {children}
    </aside>
  );
}
