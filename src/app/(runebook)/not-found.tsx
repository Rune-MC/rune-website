import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not found",
  description: "This Rune does not exist on Runebook.",
};

export default function RunebookNotFound() {
  return (
    <section className="mx-auto max-w-3xl px-6 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <p className="mb-6 font-mono text-xs text-muted-foreground">
        runebook · not found
      </p>
      <h1 className="text-3xl font-medium tracking-tight text-display sm:text-4xl">
        Nothing here.
      </h1>
      <p className="mt-4 max-w-prose text-sm text-foreground">
        That Rune, version, or user does not exist on Runebook. It may have been
        yanked, never published, or the URL is mistyped.
      </p>
      <div className="mt-10 flex flex-wrap gap-6 font-mono text-sm">
        <Link
          href="/runebook"
          className="text-primary transition-colors hover:text-primary-hover"
        >
          ← runebook home
        </Link>
        <Link
          href="/runebook/search"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          search
        </Link>
        <Link
          href="/runebook/publish"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          publish a rune
        </Link>
      </div>
    </section>
  );
}
