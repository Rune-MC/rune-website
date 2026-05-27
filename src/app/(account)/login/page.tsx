import type { Metadata } from "next";
import { SignInCard } from "@/components/auth/sign-in-card";

export const metadata: Metadata = {
  title: "Sign in",
};

interface SearchParams {
  next?: string | string[];
  error?: string | string[];
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const next = Array.isArray(sp.next) ? sp.next[0] : sp.next;
  const error = Array.isArray(sp.error) ? sp.error[0] : sp.error;

  return (
    <div className="flex flex-1 items-center justify-center px-6 py-16">
      <SignInCard next={next} error={error} />
    </div>
  );
}
