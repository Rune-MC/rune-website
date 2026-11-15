import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Download, Server } from "lucide-react";
import { Breadcrumbs } from "@/components/marketing/breadcrumbs";
import { PlatformInstall } from "@/components/landing/platform-install";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Install",
  description: "Install Rune and the Rune CLI on your Paper Minecraft server.",
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
            Add Rune to your Paper server, then write a script or install one
            from Runebook.
          </p>
          <div className="requirements-note">
            <Server size={20} aria-hidden="true" />
            <div>
              <strong>Before you install</strong>
              <p>
                Have a Paper server directory and Java 25 ready. The Rune plugin
                bundles the Node.js runtime. Python scripts use Python 3
                installed on the server.
              </p>
            </div>
          </div>
        </div>
        <section className="install-panel" aria-labelledby="installer-heading">
          <h2 id="installer-heading">Use the installer</h2>
          <p>
            The installer adds the plugin to your server and puts the Rune CLI
            on your PATH.
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
        <h2 id="next-heading">Start the server</h2>
        <p>
          Start Paper once. Rune creates <code>plugins/Rune/scripts/</code>. Run{" "}
          <code>rune status</code> in the server console to check the plugin.
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
