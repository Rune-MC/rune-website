"use client";

import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useId, useState } from "react";
import { docHref, docNav } from "@/lib/docs/nav";

export function DocsSidebar() {
  const pathname = usePathname();
  const panelId = useId();
  const [expanded, setExpanded] = useState(false);
  const [filter, setFilter] = useState("");
  const term = filter.trim().toLowerCase();
  const groups = docNav
    .map(({ title, items }) => ({
      title,
      items: items.filter((item) =>
        `${item.title} ${item.summary} ${title}`.toLowerCase().includes(term),
      ),
    }))
    .filter((group) => group.items.length);

  return (
    <nav aria-label="Documentation topics" className="docs-topics">
      <button
        type="button"
        className="docs-topics-toggle"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded(!expanded)}
      >
        Documentation topics <ChevronDown size={17} aria-hidden="true" />
      </button>
      <div id={panelId} className="docs-topics-panel" data-expanded={expanded}>
        <search className="docs-search">
          <Search size={17} aria-hidden="true" />
          <input
            aria-label="Filter documentation topics"
            type="search"
            placeholder="Filter topics"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
          />
        </search>
        <p className="sr-only" aria-live="polite">
          {term
            ? `${groups.reduce((sum, group) => sum + group.items.length, 0)} matching topics`
            : ""}
        </p>
        {groups.length === 0 && (
          <p className="docs-no-topics">No topics match your search.</p>
        )}
        {groups.map(({ title, items }) => (
          <div key={title} className="docs-topic-group">
            <h2>{title}</h2>
            <ul>
              {items.map((item) => {
                const href = docHref(item.slug);
                return (
                  <li key={href}>
                    <Link
                      href={href}
                      aria-current={pathname === href ? "page" : undefined}
                      onClick={() => {
                        setExpanded(false);
                        setFilter("");
                      }}
                    >
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </nav>
  );
}
