import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";
import { userKeys } from "./keys";

interface ClaimUsernameInput {
  username: string;
}

interface ClaimUsernameResult {
  username: string;
}

export function useClaimUsernameMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ClaimUsernameInput) =>
      apiFetch<ClaimUsernameResult>("/api/v1/users/me/username", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
