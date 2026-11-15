import { DocsSidebar } from "@/components/docs/docs-sidebar";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="site-shell docs-layout">
      <aside className="docs-layout-sidebar">
        <DocsSidebar />
      </aside>
      <div className="docs-layout-article">{children}</div>
    </div>
  );
}
