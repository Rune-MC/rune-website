import type { Metadata } from "next";
import { Suspense } from "react";
import { SearchResults } from "@/components/runebook/search-results";

export const metadata: Metadata = {
  title: "Search",
};

export default function SearchPage() {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <p className="mb-6 font-mono text-xs text-muted-foreground">
        runebook · search
      </p>
      <h1 className="text-3xl font-medium tracking-tight text-display sm:text-4xl">
        Search.
      </h1>
      <p className="mt-3 max-w-prose text-sm text-foreground">
        Type your query in the search bar above. Results match against Rune name
        and description.
      </p>
      <div className="mt-12">
        <Suspense fallback={null}>
          <SearchResults />
        </Suspense>
      </div>
    </section>
  );
}
