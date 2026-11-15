import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { DocsPage, Section } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Documentation",
  description:
    "Install Rune and build scripts for Paper in Python, TypeScript, or JavaScript.",
};

const guides = [
  {
    title: "Python quickstart",
    text: "Load a script, subscribe to a player event, and reload it.",
    href: "/docs/quickstart/python",
  },
  {
    title: "TypeScript and JavaScript quickstart",
    text: "Create a Rune with live access to Paper objects and generated types.",
    href: "/docs/quickstart",
  },
];

export default function DocsIndex() {
  return (
    <DocsPage
      slug=""
      title="Documentation"
      description="Set up Rune, choose a language, and build a script for your Paper server."
    >
      <Section title="Start with a language">
        <div className="doc-start-grid">
          {guides.map(({ title, text, href }) => (
            <Link className="doc-start-link no-prose" key={href} href={href}>
              <strong>{title}</strong>
              <span>{text}</span>
              <ArrowRight size={19} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </Section>
      <Section title="Build a Rune">
        <ul>
          <li>
            <Link href="/docs/runtimes">Compare runtimes</Link> to see what each
            language can do.
          </li>
          <li>
            <Link href="/docs/listeners">Handle Paper events</Link> and{" "}
            <Link href="/docs/commands">register commands.</Link>
          </li>
          <li>
            <Link href="/docs/adventure">Send messages with Adventure</Link>{" "}
            from TypeScript and JavaScript.
          </li>
          <li>
            <Link href="/docs/extensions">Connect Runes</Link> with services,
            events, and dashboard panels.
          </li>
        </ul>
      </Section>
      <Section title="Run a server">
        <ul>
          <li>
            <Link href="/install">Install Rune</Link> on your Paper server.
          </li>
          <li>
            <Link href="/runebook">Find packages</Link> to install with the CLI.
          </li>
          <li>
            <Link href="/docs/capabilities">Review declared capabilities</Link>{" "}
            before running a package.
          </li>
        </ul>
      </Section>
    </DocsPage>
  );
}
