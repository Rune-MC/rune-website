"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface MatrixTab {
  value: string;
  label: string;
  badge?: string;
  html: string;
}

interface Props {
  tabs: MatrixTab[];
  defaultValue: string;
}

export function LanguageMatrixTabs({ tabs, defaultValue }: Props) {
  return (
    <Tabs defaultValue={defaultValue} className="w-full">
      <TabsList
        variant="line"
        className="h-auto w-full justify-start gap-4 rounded-none border-b border-border bg-transparent p-0"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="font-mono text-xs"
          >
            {tab.label}
            {tab.badge && (
              <span className="ml-1.5 text-[10px] text-muted-foreground">
                {tab.badge}
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className="mt-4">
          <div
            className="rune-code-block overflow-x-auto rounded border border-border"
            // biome-ignore lint/security/noDangerouslySetInnerHtml: shiki output is safe HTML
            dangerouslySetInnerHTML={{ __html: tab.html }}
          />
        </TabsContent>
      ))}
    </Tabs>
  );
}
