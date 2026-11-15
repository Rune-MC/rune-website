import type { Metadata } from "next";
import { Suspense } from "react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { SearchBar } from "@/components/runebook/search-bar";
import { SearchResults } from "@/components/runebook/search-results";

export const metadata: Metadata = { title: "Search Runebook" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const { q } = await searchParams;
  const query = Array.isArray(q) ? (q[0] ?? "") : (q ?? "");
  return (
    <section className="site-shell inner-page registry-width">
      <Breadcrumbs
        items={[
          { label: "Runebook", href: "/runebook" },
          { label: "Search", href: "/runebook/search" },
        ]}
      />
      <h1 className="page-heading">Search Runebook</h1>
      <div className="mt-6">
        <SearchBar query={query} />
      </div>
      <div className="mt-10">
        <Suspense fallback={null}>
          <SearchResults />
        </Suspense>
      </div>
    </section>
  );
}
