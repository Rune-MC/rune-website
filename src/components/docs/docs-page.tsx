import { PageNav } from "@/components/docs/page-nav";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { docHref, findDoc } from "@/lib/docs/nav";

interface Props {
  slug: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}

export function DocsPage({ slug, title, description, children }: Props) {
  const position = findDoc(slug);
  const trail = [{ label: "Docs", href: "/docs" }];
  if (slug)
    trail.push({ label: position?.item.title ?? title, href: docHref(slug) });

  return (
    <article className="docs-prose min-w-0">
      <Breadcrumbs items={trail} />
      <h1 className="page-heading">{title.replace(/\.$/, "")}</h1>
      {description && <p className="page-intro">{description}</p>}
      <div className="mt-10 space-y-10 sm:mt-12 sm:space-y-12">{children}</div>
      {position && <PageNav position={position} />}
    </article>
  );
}

export function Section({
  id,
  title,
  children,
}: {
  id?: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={
        id ??
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/-$/, "")
      }
      className="doc-section"
    >
      <h2 className="text-xl font-semibold tracking-tight text-display sm:text-2xl">
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
