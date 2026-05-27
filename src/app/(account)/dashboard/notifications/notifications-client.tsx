"use client";

import Link from "next/link";
import {
  useMarkAllReadMutation,
  useMarkReadMutation,
  useNotificationsQuery,
} from "@/lib/query/notifications";

function relative(iso: string | null): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms)) return "";
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  return iso.slice(0, 10);
}

export function NotificationsClient() {
  const { data, isLoading } = useNotificationsQuery();
  const markRead = useMarkReadMutation();
  const markAll = useMarkAllReadMutation();

  if (isLoading) {
    return (
      <p className="font-mono text-sm text-muted-foreground">loading...</p>
    );
  }

  const items = data?.items ?? [];
  if (items.length === 0) {
    return (
      <div className="rounded border border-dashed border-border px-6 py-12 text-center">
        <p className="text-sm text-muted-foreground">
          You're all caught up. Nothing to see here.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-mono text-xs text-muted-foreground">
          {data?.unread_count ?? 0} unread
        </p>
        {(data?.unread_count ?? 0) > 0 && (
          <button
            type="button"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            mark all read
          </button>
        )}
      </div>
      <ul className="divide-y divide-border">
        {items.map((n) => {
          const unread = !n.read_at;
          const inner = (
            <div className="group flex items-baseline justify-between gap-3 py-4">
              <div className="min-w-0">
                <p
                  className={
                    unread
                      ? "font-mono text-sm text-foreground"
                      : "font-mono text-sm text-muted-foreground"
                  }
                >
                  {unread && (
                    <span
                      aria-hidden="true"
                      className="mr-2 inline-block size-1.5 rounded-full bg-primary align-middle"
                    />
                  )}
                  {n.title}
                </p>
                {n.body && (
                  <p className="mt-1 text-xs text-muted-foreground">{n.body}</p>
                )}
              </div>
              <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                {relative(n.created_at)}
              </span>
            </div>
          );
          return (
            <li key={n.id}>
              {n.href ? (
                <Link
                  href={n.href}
                  onClick={() => {
                    if (unread) markRead.mutate(n.id);
                  }}
                  className="block transition-colors hover:bg-muted -mx-3 px-3"
                >
                  {inner}
                </Link>
              ) : (
                <div className="-mx-3 px-3">{inner}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
