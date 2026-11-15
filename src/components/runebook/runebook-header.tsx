import Link from "next/link";

export function RunebookHeader({ userLabel }: { userLabel: string | null }) {
  return (
    <div className="registry-toolbar">
      <nav
        className="site-shell registry-toolbar-links"
        aria-label="Runebook navigation"
      >
        <Link href="/runebook">Browse packages</Link>
        <Link href="/runebook/publish">Publish a Rune</Link>
        <Link href={userLabel ? "/dashboard" : "/login"}>
          {userLabel ?? "Sign in"}
        </Link>
      </nav>
    </div>
  );
}
