"use client";

import { Download, GitFork, Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { siteConfig } from "@/lib/site-config";

const destinations = [
  { label: "Install", href: "/install" },
  { label: "Docs", href: "/docs" },
  { label: "Runebook", href: "/runebook" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const menuId = useId();
  const header = useRef<HTMLElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const root = header.current;
    const frame = row.current;
    const links = menu.current;
    if (
      !root ||
      !frame ||
      !links ||
      !("showPopover" in HTMLElement.prototype)
    ) {
      return;
    }

    let previousWidth = 0;
    const measure = () => {
      if (
        root.dataset.layout === "compact" &&
        frame.clientWidth === previousWidth
      )
        return;
      previousWidth = frame.clientWidth;
      const wasOpen = links.matches(":popover-open");
      links.removeAttribute("popover");
      root.dataset.layout = "wide";
      if (frame.scrollWidth > frame.clientWidth) {
        root.dataset.layout = "compact";
        links.setAttribute("popover", "auto");
        if (wasOpen) links.showPopover();
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(frame);
    void document.fonts.ready.then(() => {
      if (!root.isConnected) return;
      previousWidth = 0;
      measure();
    });
    return () => observer.disconnect();
  }, []);

  function closeMenu() {
    if (menu.current?.getAttribute("popover")) menu.current.hidePopover?.();
  }

  return (
    <header ref={header} className="site-header">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <div ref={row} className="site-shell header-row">
        <Link href="/" className="brand" aria-label="Rune home">
          <Image src="/icon.png" width={34} height={34} alt="" priority />
          <span>Rune</span>
        </Link>
        <nav aria-label="Main navigation" className="header-nav">
          <button
            type="button"
            popoverTarget={menuId}
            aria-controls={menuId}
            className="site-menu-toggle"
          >
            <Menu size={18} aria-hidden="true" />
            Menu
          </button>
          <ul ref={menu} id={menuId} popover="auto" className="site-menu">
            {destinations.map(({ label, href }) => {
              const active =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    onClick={closeMenu}
                  >
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="header-actions">
          <a
            href={siteConfig.links.github}
            className="site-icon-link"
            aria-label="Rune on GitHub"
          >
            <GitFork size={18} aria-hidden="true" />
          </a>
          <ThemeToggle className="site-icon-link" />
          <Link href="/install" className="header-install">
            <Download size={15} aria-hidden="true" /> Get Rune
          </Link>
        </div>
      </div>
    </header>
  );
}
