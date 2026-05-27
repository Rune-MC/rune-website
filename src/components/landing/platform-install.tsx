"use client";

import { useEffect, useState } from "react";
import { installCommands, type PlatformId } from "@/lib/site-config";
import { InstallCommand } from "./install-command";

function detectPlatform(): PlatformId {
  if (typeof navigator === "undefined") return "unix";
  return navigator.userAgent.toLowerCase().includes("windows")
    ? "windows"
    : "unix";
}

export function PlatformInstall() {
  const [active, setActive] = useState<PlatformId>("unix");

  useEffect(() => {
    setActive(detectPlatform());
  }, []);

  const current =
    installCommands.find((p) => p.id === active) ?? installCommands[0];

  return (
    <div>
      <div
        role="tablist"
        aria-label="Install command platform"
        className="mb-2 flex gap-1 font-mono text-xs"
      >
        {installCommands.map((p) => {
          const isActive = p.id === active;
          return (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(p.id)}
              className={
                isActive
                  ? "px-3 py-3 text-foreground transition-colors"
                  : "px-3 py-3 text-muted-foreground transition-colors hover:text-foreground"
              }
            >
              {p.label}
            </button>
          );
        })}
      </div>
      <InstallCommand command={current.command} prompt={current.prompt} />
    </div>
  );
}
