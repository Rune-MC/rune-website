import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CtaPair() {
  return (
    <section className="mx-auto max-w-4xl px-6 pb-24 sm:pb-32">
      <div className="flex flex-col gap-6 border-t border-border pt-16 font-mono text-base sm:flex-row sm:gap-12">
        <Link
          href="/install"
          className="group inline-flex items-center gap-2 text-primary transition-colors hover:text-primary-hover"
        >
          install rune
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
        <Link
          href="/docs"
          className="group inline-flex items-center gap-2 text-primary transition-colors hover:text-primary-hover"
        >
          read the docs
          <ArrowRight
            className="size-4 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </Link>
      </div>
    </section>
  );
}
