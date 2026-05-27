"use client";

import { useEffect } from "react";

export function PageEntrance() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let cancelled = false;
    void (async () => {
      const { gsap } = await import("gsap");
      if (cancelled) return;

      const targets =
        document.querySelectorAll<HTMLElement>("[data-hero-stage]");
      if (targets.length === 0) return;

      gsap.fromTo(
        Array.from(targets),
        { opacity: 0, y: 8 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "expo.out",
          stagger: 0.08,
        },
      );
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
