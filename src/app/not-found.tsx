import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Not found",
  description: "The page you were looking for is not here.",
};

export default function NotFound() {
  return (
    <section className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-6 py-24">
      <p className="font-mono text-xs text-muted-foreground">404</p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight text-display sm:text-4xl">
        Not found.
      </h1>
      <p className="mt-4 max-w-prose text-sm text-foreground">
        The page you were looking for is not here. It may have been moved, never
        existed, or you mistyped a Rune name.
      </p>
      <div className="mt-10 flex flex-wrap gap-6 font-mono text-sm">
        <Link
          href="/"
          className="text-primary transition-colors hover:text-primary-hover"
        >
          ← back home
        </Link>
        <Link
          href="/runebook"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          browse runebook
        </Link>
      </div>
    </section>
  );
}
