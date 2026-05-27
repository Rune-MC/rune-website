import Link from "next/link";
import { commitSha, siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-6 font-mono text-xs text-muted-foreground sm:flex-row sm:items-baseline">
        <div className="flex items-baseline gap-6">
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            github
          </a>
          <span>MIT</span>
          <a
            href={`${siteConfig.links.github}/commit/${commitSha}`}
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
            aria-label={`source commit ${commitSha}`}
          >
            {commitSha === "dev" ? "dev" : commitSha.slice(0, 7)}
          </a>
        </div>
        <div className="flex items-baseline gap-6">
          <Link
            href={siteConfig.links.runebook}
            className="transition-colors hover:text-foreground"
          >
            runebook
          </Link>
          <Link
            href={siteConfig.links.changelog}
            className="transition-colors hover:text-foreground"
          >
            changelog
          </Link>
          <Link
            href={siteConfig.links.about}
            className="transition-colors hover:text-foreground"
          >
            about
          </Link>
        </div>
      </div>
    </footer>
  );
}
