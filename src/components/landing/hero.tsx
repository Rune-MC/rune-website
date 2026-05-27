import { siteConfig } from "@/lib/site-config";
import { DemoCode } from "./demo-code";
import { PlatformInstall } from "./platform-install";

export function Hero() {
  return (
    <section className="mx-auto max-w-4xl px-6 pt-24 pb-24 sm:pt-32 sm:pb-32">
      <p
        data-hero-stage
        className="mb-10 font-mono text-sm text-muted-foreground sm:mb-12"
      >
        rune · {siteConfig.version}
      </p>
      <h1
        data-hero-stage
        className="font-medium leading-[1.05] tracking-tight text-display text-[2rem] sm:text-5xl md:text-6xl"
      >
        <span className="sm:block">Write your Paper plugin</span>{" "}
        <span className="sm:block">in TypeScript.</span>{" "}
        <span className="sm:block">In your Paper plugin.</span>
      </h1>
      <div data-hero-stage className="mt-10 sm:mt-12">
        <PlatformInstall />
      </div>
      <div data-hero-stage className="mt-12 sm:mt-16">
        <DemoCode />
      </div>
    </section>
  );
}
