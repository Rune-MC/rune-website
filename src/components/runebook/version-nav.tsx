"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  name: string;
  version: string;
}

export function VersionNav({ name, version }: Props) {
  const pathname = usePathname();
  const base = `/runebook/r/${name}/v/${version}`;
  const items = [
    { label: "detail", href: base },
    { label: "files", href: `${base}/files` },
  ];

  return (
    <nav className="flex items-center gap-6 border-b border-border pb-3 font-mono text-sm">
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
