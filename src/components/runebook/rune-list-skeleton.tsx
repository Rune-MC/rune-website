const SKELETON_KEYS = Array.from({ length: 16 }, (_, i) => `skeleton-row-${i}`);

export function RuneListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <ul className="divide-y divide-border" aria-hidden="true">
      {SKELETON_KEYS.slice(0, count).map((key) => (
        <li key={key} className="py-5">
          <div className="flex items-baseline gap-3">
            <span className="h-4 w-48 animate-pulse rounded bg-muted" />
            <span className="h-3 w-12 animate-pulse rounded bg-muted" />
          </div>
          <span className="mt-3 block h-3 w-3/4 animate-pulse rounded bg-muted" />
          <span className="mt-2 block h-3 w-1/3 animate-pulse rounded bg-muted" />
        </li>
      ))}
    </ul>
  );
}
