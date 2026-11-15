import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-shell site-footer-inner">
        <div>
          <Link className="footer-brand" href="/">
            Rune
          </Link>
          <p>Scripting for Paper Minecraft servers.</p>
        </div>
        <nav aria-label="Footer">
          <Link href="/install">Install</Link>
          <Link href="/docs/runtimes">Languages</Link>
          <Link href="/runebook">Runebook</Link>
          <a href={`${siteConfig.links.github}/releases`}>Releases</a>
          <a href={siteConfig.links.github}>GitHub</a>
        </nav>
      </div>
    </footer>
  );
}
