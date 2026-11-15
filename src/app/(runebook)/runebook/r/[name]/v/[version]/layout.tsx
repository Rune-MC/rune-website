import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
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
    <section className="site-shell inner-page">
      <Breadcrumbs
        items={[
          { label: "Runebook", href: "/runebook" },
          { label: decodedName, href: `/runebook/r/${encoded}` },
          { label: `v${version}`, href: `/runebook/r/${encoded}/v/${version}` },
        ]}
      />
      <div className="flex flex-wrap items-baseline gap-3">
        <h1 className="page-heading package-heading">{decodedName}</h1>
        <span className="font-mono text-lg text-muted-foreground">
          v{version}
        </span>
      </div>
      <div className="mt-10">
        <VersionNav name={encoded} version={version} />
        <div className="pt-10">{children}</div>
      </div>
    </section>
  );
}
