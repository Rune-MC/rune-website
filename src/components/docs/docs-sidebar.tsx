"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { docHref, docNav } from "@/lib/docs/nav";

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Docs navigation" className="space-y-8">
      {docNav.map((group) => (
        <div key={group.title}>
          <p className="mb-3 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {group.title}
          </p>
          <ul className="space-y-1.5">
            {group.items.map((item) => {
              const href = docHref(item.slug);
              const isActive = pathname === href;
              return (
                <li key={item.slug}>
                  <Link
                    href={href}
                    aria-current={isActive ? "page" : undefined}
                    className={
                      isActive
                        ? "block text-sm text-foreground"
                        : "block text-sm text-muted-foreground transition-colors hover:text-foreground"
                    }
                  >
                    {item.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
