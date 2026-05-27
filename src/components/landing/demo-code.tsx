import { CodeBlock } from "@/components/code-block";

const snippet = `@Listener
export class WelcomeMessage {
  @EventHandler(Events.PlayerJoinEvent)
  onJoin(e: PlayerJoinEvent) {
    const player = e.getPlayer();
    player.sendMessage(\`Welcome, \${player.getName()}.\`);
  }
}`;

export function DemoCode() {
  return <CodeBlock code={snippet} lang="typescript" />;
}
