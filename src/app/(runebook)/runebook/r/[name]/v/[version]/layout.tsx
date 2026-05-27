import Link from "next/link";
import { VersionNav } from "@/components/runebook/version-nav";
import { runeNameToUrl, urlToRuneName } from "@/lib/runebook-urls";

export default async function VersionLayout({
  children,
  params,
}: LayoutProps<"/runebook/r/[name]/v/[version]">) {
  const { name, version } = await params;
  const decodedName = urlToRuneName(name);
  const encoded = runeNameToUrl(decodedName);

  return (
    <section className="mx-auto max-w-6xl px-6 pt-12 pb-24 sm:pt-16 sm:pb-32">
      <p className="mb-3 font-mono text-xs text-muted-foreground">
        runebook · rune · version
      </p>
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="break-all font-mono text-2xl text-display sm:text-3xl">
          {decodedName}
        </h1>
        <span className="font-mono text-lg text-muted-foreground">
          v{version}
        </span>
      </div>
      <p className="mt-3 font-mono text-xs text-muted-foreground">
        <Link
          href={`/runebook/r/${encoded}`}
          className="transition-colors hover:text-foreground"
        >
          ← all versions
        </Link>
      </p>
      <div className="mt-10">
        <VersionNav name={encoded} version={version} />
        <div className="pt-10">{children}</div>
      </div>
    </section>
  );
}
