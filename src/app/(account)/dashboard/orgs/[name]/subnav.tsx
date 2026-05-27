"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  name: string;
}

export function OrgSubnav({ name }: Props) {
  const pathname = usePathname();
  const base = `/dashboard/orgs/${name}`;
  const items = [
    { label: "overview", href: base },
    { label: "members", href: `${base}/members` },
    { label: "roles", href: `${base}/roles` },
    { label: "settings", href: `${base}/settings` },
  ];

  return (
    <nav
      aria-label="Org sections"
      className="flex flex-wrap items-center gap-6 border-b border-border pb-3 font-mono text-sm"
    >
      {items.map((item) => {
        const isActive = pathname === item.href;
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
