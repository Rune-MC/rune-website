import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, Server } from "lucide-react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { InstallCommand } from "@/components/landing/install-command";
import { PlatformInstall } from "@/components/landing/platform-install";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Install",
  description:
    "Install the Rune CLI on your computer and set up Rune on an existing Paper server.",
};

export default function InstallPage() {
  return (
    <div className="site-shell inner-page">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Install", href: "/install" },
        ]}
      />
      <div className="setup-layout">
        <div>
          <h1 className="page-heading">Install Rune</h1>
          <p className="page-intro">
            Write and package Runes on your computer, then load them on a Paper
            server when you’re ready.
          </p>
          <div className="requirements-note">
            <Server size={20} aria-hidden="true" />
            <div>
              <strong>Running scripts on Paper</strong>
              <p>
                Use a Paper server with Java 25. The Rune plugin bundles the
                Node.js runtime. Python scripts use Python 3 installed on the
                server.
              </p>
            </div>
          </div>
        </div>
        <section className="install-panel" aria-labelledby="installer-heading">
          <h2 id="installer-heading">Install the CLI</h2>
          <p>
            The CLI installer works from any folder. You can scaffold, check,
            and package a project without Minecraft or Java.
          </p>
          <PlatformInstall />
          <a
            href={`${siteConfig.links.github}/releases/latest`}
            className="site-text-link"
          >
            <Download size={16} aria-hidden="true" /> Download the plugin
            manually
          </a>
        </section>
      </div>

      <section className="install-next" aria-labelledby="next-heading">
        <h2 id="next-heading">Set up an existing Paper server</h2>
        <p>
          Stop Paper, then run this from the server folder. You can also pass
          the folder as <code>rune setup &quot;/path/to/server&quot;</code>.
        </p>
        <InstallCommand command="rune setup" />
        <p>
          Setup installs the Rune plugin and creates{" "}
          <code>plugins/Rune/scripts/</code>. Start Paper to generate the config
          and types, or add <code>--start</code> to use your existing server
          launcher. Run <code>rune status</code> in the Paper console to check
          the plugin.
        </p>
        <div className="doc-start-grid">
          <Link className="doc-start-link" href="/docs/quickstart/python">
            <strong>Write a Python Rune</strong>
            <span>Scaffold a Python script and handle a player event.</span>
            <ArrowRight size={19} aria-hidden="true" />
          </Link>
          <Link className="doc-start-link" href="/docs/quickstart">
            <strong>Write a TypeScript or JavaScript Rune</strong>
            <span>Use the live Bukkit and Adventure APIs.</span>
            <ArrowRight size={19} aria-hidden="true" />
          </Link>
        </div>
        <Link href="/runebook" className="site-text-link">
          Find a package on Runebook <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </div>
  );
}
