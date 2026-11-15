import { SiteFooter } from "@/components/marketing/site-footer";
import { SiteHeader } from "@/components/marketing/site-header";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <SiteHeader />
      <main id="main-content" tabIndex={-1} className="flex flex-1 flex-col">
        {children}
      </main>
      <SiteFooter />
    </>
  );
}
