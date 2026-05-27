const CAPABILITY_KEYS = ["cap-a", "cap-b", "cap-c", "cap-d"];
const VERSION_KEYS = ["ver-a", "ver-b", "ver-c", "ver-d"];

export default function RuneDetailLoading() {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <p className="mb-3 font-mono text-xs text-muted-foreground">
        runebook · rune
      </p>
      <span className="block h-8 w-72 animate-pulse rounded bg-muted" />
      <span className="mt-4 block h-3 w-full max-w-prose animate-pulse rounded bg-muted" />
      <span className="mt-2 block h-3 w-5/6 max-w-prose animate-pulse rounded bg-muted" />

      <div className="mt-12 divide-y divide-border">
        <div className="py-10">
          <span className="block h-3 w-16 animate-pulse rounded bg-muted" />
          <span className="mt-4 block h-12 w-full animate-pulse rounded bg-muted" />
        </div>
        <div className="py-10">
          <span className="block h-3 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-6 flex flex-wrap gap-2">
            {CAPABILITY_KEYS.map((key) => (
              <span
                key={key}
                className="block h-7 w-32 animate-pulse rounded-full bg-muted"
              />
            ))}
          </div>
        </div>
        <div className="py-10">
          <span className="block h-3 w-16 animate-pulse rounded bg-muted" />
          <ul className="mt-4 divide-y divide-border">
            {VERSION_KEYS.map((key) => (
              <li
                key={key}
                className="flex items-baseline justify-between gap-4 py-3"
              >
                <span className="block h-3 w-24 animate-pulse rounded bg-muted" />
                <span className="block h-3 w-20 animate-pulse rounded bg-muted" />
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
