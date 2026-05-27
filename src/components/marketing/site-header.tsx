import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site-config";

const navLinks = [
  { label: "docs", href: siteConfig.links.docs },
  { label: "install", href: siteConfig.links.install },
  { label: "runebook", href: siteConfig.links.runebook },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="font-mono text-sm tracking-tight text-foreground"
          aria-label={siteConfig.name}
        >
          rune
        </Link>
        <nav className="flex items-center gap-6 font-mono text-sm">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            github
          </a>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
