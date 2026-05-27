import { DocsSidebar } from "@/components/docs/docs-sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-6xl px-6 pt-16 pb-24 sm:pt-20 sm:pb-32">
      <div className="grid gap-12 lg:grid-cols-[14rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-16 lg:max-h-[calc(100vh-5rem)] lg:overflow-y-auto lg:pr-2">
          <DocsSidebar />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
