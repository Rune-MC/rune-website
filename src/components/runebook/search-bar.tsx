"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";

interface Props {
  variant?: "header" | "hero";
}

export function SearchBar({ variant = "header" }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(searchParams.get("q") ?? "");

  // Keep the input in sync with the URL when the user navigates.
  useEffect(() => {
    setValue(searchParams.get("q") ?? "");
  }, [searchParams]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      router.push("/runebook/search");
      return;
    }
    router.push(`/runebook/search?q=${encodeURIComponent(trimmed)}`);
  };

  const isHero = variant === "hero";

  return (
    <form
      onSubmit={submit}
      className={
        isHero
          ? "flex w-full max-w-2xl items-center gap-3 rounded border border-border bg-muted px-4 py-3 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30"
          : "flex w-full max-w-md items-center gap-2 rounded border border-border bg-background px-3 py-1.5 transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/30"
      }
    >
      <Search
        className={
          isHero
            ? "size-5 shrink-0 text-muted-foreground"
            : "size-4 shrink-0 text-muted-foreground"
        }
        aria-hidden="true"
      />
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={isHero ? "search the runebook..." : "search runebook"}
        className={
          isHero
            ? "flex-1 bg-transparent font-mono text-base text-foreground outline-none placeholder:text-muted-foreground"
            : "flex-1 bg-transparent font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground"
        }
        aria-label="Search Runebook"
      />
    </form>
  );
}
