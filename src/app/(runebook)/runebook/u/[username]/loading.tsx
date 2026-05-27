import { RuneListSkeleton } from "@/components/runebook/rune-list-skeleton";

export default function UserProfileLoading() {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <p className="mb-3 font-mono text-xs text-muted-foreground">
        runebook · user
      </p>
      <span className="block h-8 w-48 animate-pulse rounded bg-muted" />
      <span className="mt-4 block h-3 w-64 animate-pulse rounded bg-muted" />
      <div className="mt-12">
        <span className="block h-3 w-20 animate-pulse rounded bg-muted" />
        <div className="mt-4">
          <RuneListSkeleton count={4} />
        </div>
      </div>
    </section>
  );
}
