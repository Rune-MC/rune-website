import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { tokenKeys } from "./keys";

export interface TokenSummary {
  id: string;
  name: string;
  scopes: string[];
  createdAt: string | null;
  lastUsedAt: string | null;
}

export interface CreatedToken {
  id: string;
  name: string;
  scopes: string[];
  /** Only present in the response of the create mutation. Never persisted. */
  token: string;
}

interface CreateTokenInput {
  name: string;
  scopes?: string[];
}

export function useCreateTokenMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTokenInput) =>
      apiFetch<CreatedToken>("/api/v1/tokens", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tokenKeys.all });
    },
  });
}

export function useRevokeTokenMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<null>(`/api/v1/tokens/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: tokenKeys.all });
    },
  });
}
