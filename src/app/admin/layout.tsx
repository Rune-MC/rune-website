import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ThemeToggle } from "@/components/theme-toggle";
import { currentUser } from "@/lib/auth/server";
import { AdminNav } from "./nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const me = await currentUser();
  if (!me) redirect("/login?next=/admin");
  if (!me.doc.platformRole) notFound();

  return (
    <div className="flex min-h-full flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="font-mono text-sm tracking-tight text-foreground"
            aria-label="Rune"
          >
            rune
          </Link>
          <span className="font-mono text-xs text-primary">platform admin</span>
          <ThemeToggle />
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-6 pt-8 pb-16 sm:pt-10 sm:pb-24">
        <AdminNav />
        <div className="pt-10 sm:pt-12">{children}</div>
      </main>
    </div>
  );
}
