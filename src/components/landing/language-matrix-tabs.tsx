"use client";

import { Code2, Terminal } from "lucide-react";
import { CopyButton } from "@/components/runebook/copy-button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export interface MatrixTab {
  value: string;
  label: string;
  file: string;
  code: string;
  html: string;
}

export function LanguageMatrixTabs({
  tabs,
  defaultValue,
}: {
  tabs: MatrixTab[];
  defaultValue: string;
}) {
  return (
    <div className="runtime-editor">
      <div className="runtime-editor-caption">
        <Code2 size={16} aria-hidden="true" />
        Player join example
      </div>
      <Tabs defaultValue={defaultValue} className="runtime-editor-tabs">
        <TabsList
          variant="line"
          aria-label="Example language"
          className="runtime-editor-tab-list"
        >
          {tabs.map(({ value, label }) => (
            <TabsTrigger
              key={value}
              value={value}
              className="runtime-editor-tab"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        {tabs.map((tab) => (
          <TabsContent
            key={tab.value}
            value={tab.value}
            className="runtime-editor-content"
          >
            <div className="runtime-editor-file">
              <span>{tab.file}</span>
              <CopyButton value={tab.code} label="Copy" />
            </div>
            <div
              className="rune-code-block runtime-editor-code"
              // biome-ignore lint/security/noDangerouslySetInnerHtml: Shiki escapes the source.
              dangerouslySetInnerHTML={{ __html: tab.html }}
            />
          </TabsContent>
        ))}
      </Tabs>
      <div className="runtime-editor-output">
        <Terminal size={16} aria-hidden="true" />
        <span>Server chat</span>
        <code>Welcome, Alex!</code>
      </div>
    </div>
  );
}
