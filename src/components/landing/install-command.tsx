"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface Props {
  command: string;
  prompt?: string;
}

export function InstallCommand({ command, prompt = "$" }: Props) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable; the visible command is still selectable
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-x-3 font-mono text-base">
      <span aria-hidden="true" className="select-none text-primary">
        {prompt}
      </span>
      <code className="text-foreground">{command}</code>
      <button
        type="button"
        onClick={copy}
        className="-mx-2 -my-3 ml-0 inline-flex items-center gap-1.5 px-2 py-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
        aria-label={copied ? "Copied" : "Copy install command"}
      >
        {copied ? (
          <>
            <Check className="size-3.5" aria-hidden="true" />
            copied
          </>
        ) : (
          <>
            <Copy className="size-3.5" aria-hidden="true" />
            copy
          </>
        )}
      </button>
    </div>
  );
}
