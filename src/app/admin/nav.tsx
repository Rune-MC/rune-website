"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { label: "overview", href: "/admin" },
  { label: "users", href: "/admin/users" },
  { label: "runes", href: "/admin/runes" },
  { label: "orgs", href: "/admin/orgs" },
];

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-6 border-b border-border pb-4 font-mono text-sm">
      {items.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/admin" && pathname?.startsWith(`${item.href}/`));
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={
              isActive
                ? "text-foreground"
                : "text-muted-foreground transition-colors hover:text-foreground"
            }
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
