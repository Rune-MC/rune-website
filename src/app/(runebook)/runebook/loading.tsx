import { RuneListSkeleton } from "@/components/runebook/rune-list-skeleton";

export default function RunebookLandingLoading() {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <p className="mb-6 font-mono text-xs text-muted-foreground">runebook</p>
      <h1 className="text-3xl font-medium tracking-tight text-display sm:text-4xl">
        Browse Runes.
      </h1>
      <p className="mt-3 max-w-prose text-sm text-foreground">
        Every Rune ever published, content-addressed and capability-declared.
        Pick one, read the manifest, decide whether to install it.
      </p>
      <div className="mt-16">
        <span className="block h-3 w-32 animate-pulse rounded bg-muted" />
        <div className="mt-4">
          <RuneListSkeleton count={6} />
        </div>
      </div>
    </section>
  );
}
