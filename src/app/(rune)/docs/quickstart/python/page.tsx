import type { Metadata } from "next";
import Link from "next/link";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "Python quickstart",
  description:
    "Create and reload a Python Rune that handles a Paper player join.",
};

export default function PythonQuickstart() {
  return (
    <DocsPage
      slug="quickstart/python"
      title="Python quickstart"
      description="Create a Python script that greets players when they join your Paper server."
    >
      <Section title="Install the runtime">
        <p>
          <Link href="/install">Install the Rune CLI</Link>, then run{" "}
          <code>rune setup</code> from your Paper server folder and start Paper
          once. Install Python 3 on the server. Set <code>RUNE_PYTHON</code> to
          its executable path if the server cannot find Python on its PATH.
        </p>
      </Section>
      <Section title="Create your script">
        <p>Run these commands from your Paper server directory.</p>
        <CodeBlock
          lang="shell"
          code={`cd plugins/Rune/scripts
rune init python-welcome --language python`}
        />
        <p>
          You can also run <code>rune new python-welcome py</code> in the Paper
          console to create a script without the CLI.
        </p>
        <CodeBlock
          lang="python"
          code={`from rune import broadcast, on

@on("PlayerJoinEvent")
def welcome(event):
    player = event["player"]["name"]
    broadcast(f"Welcome, {player}!")`}
        />
      </Section>
      <Section title="Load and test it">
        <p>
          Edit <code>python-welcome/src/index.py</code> for the CLI scaffold or{" "}
          <code>python-welcome/index.py</code> for the server scaffold. From the
          Paper console, run <code>rune reload</code>. Join the server to see
          the welcome message. Restart Paper to register new commands.
        </p>
        <Note>
          Python receives event snapshots asynchronously. See{" "}
          <Link href="/docs/runtimes">Runtimes</Link> for details.
        </Note>
      </Section>
    </DocsPage>
  );
}
