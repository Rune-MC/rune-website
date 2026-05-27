import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { SearchBar } from "./search-bar";

interface Props {
  userLabel: string | null;
}

export function RunebookHeader({ userLabel }: Props) {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-4 md:flex-row md:items-center md:gap-6">
        <div className="flex items-baseline gap-3">
          <Link
            href="/"
            className="font-mono text-sm tracking-tight text-foreground"
            aria-label="Rune"
          >
            rune
          </Link>
          <span aria-hidden="true" className="text-muted-foreground">
            /
          </span>
          <Link
            href="/runebook"
            className="font-mono text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            runebook
          </Link>
        </div>
        <div className="md:flex-1">
          <SearchBar variant="header" />
        </div>
        <nav className="flex items-center gap-6 font-mono text-sm">
          <Link
            href="/runebook/publish"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            publish
          </Link>
          {userLabel ? (
            <Link
              href="/dashboard"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {userLabel}
            </Link>
          ) : (
            <Link
              href="/login"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              sign in
            </Link>
          )}
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
