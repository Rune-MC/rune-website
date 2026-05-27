import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export function RunebookTile() {
  return (
    <section className="mx-auto max-w-4xl px-6">
      <div className="border-t border-border py-16">
        <h2 className="text-2xl font-medium tracking-tight text-display sm:text-3xl">
          And when you ship: publish to Runebook.
        </h2>
        <p className="mt-4 max-w-prose text-base leading-relaxed text-foreground">
          Runebook is the package registry for Runes. Content-addressed blobs,
          immutable manifests, prominent capability disclosure. Operators see
          exactly what your Rune will do on their server before they install it.
        </p>
        <Link
          href="/runebook"
          className="group mt-6 inline-flex items-center gap-1.5 font-mono text-sm text-primary transition-colors hover:text-primary-hover"
        >
          browse runebook
          <ArrowUpRight
            className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  );
}
