"use client";

import { LocksmithAuthProvider } from "@getlocksmith/nextjs/client";
import { QueryProvider } from "@/lib/query/provider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <LocksmithAuthProvider routePrefix="/api/locksmith">
        {children}
      </LocksmithAuthProvider>
    </QueryProvider>
  );
}
