"use client";

import { useLocksmithAuth } from "@getlocksmith/nextjs/client";
import { useRouter } from "next/navigation";

interface Props {
  label: string;
}

export function UserMenu({ label }: Props) {
  const { signOut } = useLocksmithAuth();
  const router = useRouter();

  const handle = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

  return (
    <div className="flex items-center gap-4 font-mono text-xs">
      <span className="text-muted-foreground">{label}</span>
      <button
        type="button"
        onClick={handle}
        className="-my-3 px-2 py-3 text-muted-foreground transition-colors hover:text-foreground"
      >
        sign out
      </button>
    </div>
  );
}
