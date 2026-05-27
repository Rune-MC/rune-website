import type { LocksmithFormClassNames } from "@getlocksmith/nextjs/client";

export const runeFormClassNames: LocksmithFormClassNames = {
  root: "w-full max-w-md space-y-6",
  field: "space-y-1.5",
  label: "block font-mono text-xs text-muted-foreground",
  input:
    "w-full rounded border border-input bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30",
  button:
    "w-full rounded bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50",
  error: "text-sm text-destructive",
  poweredBy: "text-xs text-muted-foreground",
};
