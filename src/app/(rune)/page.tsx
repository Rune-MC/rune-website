import { Beats } from "@/components/landing/beats";
import { CtaPair } from "@/components/landing/cta-pair";
import { Hero } from "@/components/landing/hero";
import { PageEntrance } from "@/components/landing/page-entrance";
import { RunebookTile } from "@/components/landing/runebook-tile";

export default function HomePage() {
  return (
    <>
      <PageEntrance />
      <Hero />
      <Beats />
      <RunebookTile />
      <CtaPair />
    </>
  );
}
