import { notFound } from "next/navigation";

export default async function DocSlugPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  await params;
  notFound();
}
