"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface Props {
  isPlatformStaff?: boolean;
}

export function DashboardNav({ isPlatformStaff }: Props) {
  const pathname = usePathname();

  const navItems = [
    { label: "overview", href: "/dashboard" },
    { label: "orgs", href: "/dashboard/orgs" },
    { label: "tokens", href: "/dashboard/tokens" },
    { label: "notifications", href: "/dashboard/notifications" },
    { label: "settings", href: "/dashboard/settings" },
    ...(isPlatformStaff ? [{ label: "admin", href: "/admin" }] : []),
  ];

  return (
    <nav className="flex flex-wrap items-center gap-6 font-mono text-sm">
      {navItems.map((item) => {
        const isActive =
          pathname === item.href ||
          (item.href !== "/dashboard" && pathname?.startsWith(`${item.href}/`));
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
