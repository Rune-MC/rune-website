import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { runeKeys } from "./keys";

export interface RuneSearchHit {
  name: string;
  description: string | null;
  latest_version: string | null;
  language: string | null;
  capabilities: string[];
  total_downloads: number;
  score: number;
  is_library?: boolean;
  visibility?: "public" | "private";
}

export interface RuneSearchResponse {
  query: string;
  total: number;
  results: RuneSearchHit[];
}

export function useSearchRunesQuery(q: string) {
  const trimmed = q.trim();
  return useQuery({
    queryKey: runeKeys.search(trimmed),
    queryFn: () =>
      apiFetch<RuneSearchResponse>(
        `/api/v1/search?q=${encodeURIComponent(trimmed)}`,
      ),
    enabled: trimmed.length > 0,
  });
}
