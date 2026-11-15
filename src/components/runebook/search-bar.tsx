import { Search } from "lucide-react";

export function SearchBar({ query = "" }: { query?: string }) {
  return (
    <search className="registry-search">
      <form action="/runebook/search" method="get">
        <Search size={20} aria-hidden="true" />
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search packages"
          aria-label="Search Runebook"
        />
        <button type="submit" className="site-button site-button-primary">
          Search
        </button>
      </form>
    </search>
  );
}
