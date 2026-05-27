import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
          if (
            error instanceof ApiError &&
            error.code >= 400 &&
            error.code < 500
          ) {
            // Don't retry client errors (401, 403, 404, 422, etc.).
            return false;
          }
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}
