import type { Metadata } from "next";
import { OAuthCallbackCard } from "@/components/auth/oauth-callback-card";

export const metadata: Metadata = {
  title: "Signing in",
  robots: { index: false, follow: false },
};

export default function AuthCallbackPage() {
  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <OAuthCallbackCard />
    </div>
  );
}
