import type { BundledLanguage } from "shiki/bundle/full";
import { highlightSource } from "@/lib/highlighter";
import { LanguageMatrixTabs } from "./language-matrix-tabs";

const samples = [
  {
    value: "python",
    label: "Python",
    file: "welcome.py",
    lang: "python",
    code: `from rune import broadcast, on

@on("PlayerJoinEvent")
def welcome(event):
    player = event["player"]["name"]
    broadcast(f"Welcome, {player}!")`,
  },
  {
    value: "typescript",
    label: "TypeScript",
    file: "welcome.ts",
    lang: "typescript",
    code: `rune.on(Events.PlayerJoinEvent, (event) => {
  const player = event.getPlayer();
  rune.adventure.broadcast(
    rune.adventure.text("Welcome, " + player.getName() + "!")
  );
});`,
  },
  {
    value: "javascript",
    label: "JavaScript",
    file: "welcome.js",
    lang: "javascript",
    code: `rune.on("PlayerJoinEvent", ({ player }) => {
  rune.broadcast("Welcome, " + player.getName() + "!");
});`,
  },
] satisfies {
  value: string;
  label: string;
  file: string;
  lang: BundledLanguage;
  code: string;
}[];

export async function LanguageMatrix() {
  const tabs = await Promise.all(
    samples.map(async (sample) => ({
      ...sample,
      html: await highlightSource(sample.code, sample.lang),
    })),
  );
  return <LanguageMatrixTabs tabs={tabs} defaultValue="python" />;
}
