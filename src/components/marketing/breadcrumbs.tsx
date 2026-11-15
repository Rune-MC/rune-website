import Link from "next/link";

export function Breadcrumbs({
  items,
}: {
  items: { label: string; href: string }[];
}) {
  return (
    <nav aria-label="Breadcrumbs" className="site-breadcrumbs">
      <ol>
        {items.map(({ label, href }, index) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={index === items.length - 1 ? "page" : undefined}
            >
              {label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
