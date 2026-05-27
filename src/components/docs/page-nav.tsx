import Link from "next/link";
import { type DocPosition, docHref } from "@/lib/docs/nav";

export function PageNav({ position }: { position: DocPosition }) {
  if (!position.prev && !position.next) return null;
  return (
    <nav
      aria-label="Document navigation"
      className="mt-16 grid gap-3 border-t border-border pt-8 sm:grid-cols-2"
    >
      {position.prev ? (
        <Link
          href={docHref(position.prev.slug)}
          className="group rounded border border-border px-4 py-3 transition-colors hover:border-primary"
        >
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            ← previous
          </p>
          <p className="mt-1 text-sm text-foreground transition-colors group-hover:text-primary-hover">
            {position.prev.title}
          </p>
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      {position.next && (
        <Link
          href={docHref(position.next.slug)}
          className="group rounded border border-border px-4 py-3 text-right transition-colors hover:border-primary sm:col-start-2"
        >
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            next →
          </p>
          <p className="mt-1 text-sm text-foreground transition-colors group-hover:text-primary-hover">
            {position.next.title}
          </p>
        </Link>
      )}
    </nav>
  );
}
