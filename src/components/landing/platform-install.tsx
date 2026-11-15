"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { installCommands, type PlatformId } from "@/lib/site-config";
import { InstallCommand } from "./install-command";

export function PlatformInstall() {
  const [active, setActive] = useState<PlatformId>("unix");

  useEffect(() => {
    if (navigator.userAgent.toLowerCase().includes("windows"))
      setActive("windows");
  }, []);

  return (
    <Tabs
      value={active}
      onValueChange={(value) => setActive(value as PlatformId)}
      className="install-tabs"
    >
      <TabsList
        variant="line"
        aria-label="Server operating system"
        className="install-tab-list"
      >
        {installCommands.map(({ id, label }) => (
          <TabsTrigger key={id} value={id}>
            {label}
          </TabsTrigger>
        ))}
      </TabsList>
      {installCommands.map(({ id, command, prompt }) => (
        <TabsContent key={id} value={id}>
          <InstallCommand command={command} prompt={prompt} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
