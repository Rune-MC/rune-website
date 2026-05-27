import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api/client";

export const notificationKeys = {
  all: ["notifications"] as const,
  list: (unread?: boolean) =>
    [...notificationKeys.all, "list", unread ?? false] as const,
};

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  body: string | null;
  href: string | null;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string | null;
}

export function useNotificationsQuery(unreadOnly = false) {
  return useQuery({
    queryKey: notificationKeys.list(unreadOnly),
    queryFn: () => {
      const qs = unreadOnly ? "?unread=true" : "";
      return apiFetch<{
        items: NotificationItem[];
        next_cursor: string | null;
        unread_count: number;
      }>(`/api/v1/notifications${qs}`);
    },
    refetchInterval: 60_000,
  });
}

export function useMarkReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/v1/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}

export function useMarkAllReadMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiFetch("/api/v1/notifications/read-all", { method: "POST" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: notificationKeys.all });
    },
  });
}
