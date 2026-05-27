"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function RouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section className="mx-auto flex max-w-3xl flex-1 flex-col justify-center px-6 py-24">
      <p className="font-mono text-xs text-destructive">error</p>
      <h1 className="mt-3 text-3xl font-medium tracking-tight text-display sm:text-4xl">
        Something broke.
      </h1>
      <p className="mt-4 max-w-prose text-sm text-foreground">
        We hit an unexpected error rendering this page. The issue has been
        logged. You can try again, or head back home.
      </p>
      {error.digest && (
        <p className="mt-4 font-mono text-xs text-muted-foreground">
          digest: <code>{error.digest}</code>
        </p>
      )}
      <div className="mt-10 flex flex-wrap gap-6 font-mono text-sm">
        <button
          type="button"
          onClick={reset}
          className="text-primary transition-colors hover:text-primary-hover"
        >
          ↻ try again
        </button>
        <Link
          href="/"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          back home
        </Link>
      </div>
    </section>
  );
}
