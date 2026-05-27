import type { Metadata } from "next";
import { CodeBlock } from "@/components/code-block";
import { DocsPage, Note, Section } from "@/components/docs/docs-page";

export const metadata: Metadata = {
  title: "HTTP servers",
  description:
    "rune.serve() spins up an HTTP server inside the Paper process. Routes are functions; handlers can be async; and the same Bukkit references you use in commands are available to the request handler.",
};

export default function HttpPage() {
  return (
    <DocsPage
      slug="http"
      title="HTTP servers."
      description="rune.serve() exposes a Paper-internal HTTP server backed by the JDK's com.sun.net.httpserver. Routes register at script load. Handlers can be async and call back into Bukkit on the main thread. That's the unlock — you can build a web dashboard that operates on live world state without an IPC layer."
    >
      <Section title="Hello server">
        <p>
          The minimum is a port, a route, and a handler. The handler receives a
          context object with the request, the resolved params, and helpers to
          read the body.
        </p>
        <CodeBlock
          lang="typescript"
          code={`const app = rune.serve({ port: 3000 });

app.get("/api/health", () => ({ status: "ok" }));

app.get("/api/players/:uuid", async (c) => {
  const uuid = c.param("uuid")!;
  return rune.runOnMain(() => {
    const player = bukkit.Bukkit.getPlayer(uuid);
    if (!player) return { error: "not_found", status: 404 };
    return { uuid, name: player.getName(), world: player.getWorld().getName() };
  });
});

app.start();`}
        />
        <p>
          Returning a plain object responds with{" "}
          <code>200 application/json</code>. Returning a tuple or a shaped
          response object lets you control status code and headers. A thrown
          error becomes a 500.
        </p>
      </Section>

      <Section title="Route shape">
        <ul>
          <li>
            <code>app.get(path, handler)</code> / <code>app.post</code> /{" "}
            <code>app.put</code> / <code>app.patch</code> /{" "}
            <code>app.delete</code> — one per verb.
          </li>
          <li>
            Path params with <code>:name</code> are matched and exposed via{" "}
            <code>c.param(&quot;name&quot;)</code>.
          </li>
          <li>
            <code>c.req</code> is the underlying request (URL, headers, body
            stream).
          </li>
          <li>
            <code>c.req.json()</code> / <code>c.req.text()</code> read the body
            asynchronously.
          </li>
        </ul>
      </Section>

      <Section title="Bukkit calls from a request">
        <p>
          HTTP handlers run on the server's HTTP thread pool, not the Paper main
          thread. Bukkit isn't thread-safe; any call into the API must be
          wrapped in <code>rune.runOnMain()</code>, which schedules a callback
          on the main tick and resolves a promise with its return value.
        </p>
        <CodeBlock
          lang="typescript"
          code={`app.post("/api/players/:uuid/kick", async (c) => {
  const uuid = c.param("uuid")!;
  const { reason } = await c.req.json<{ reason?: string }>();

  return rune.runOnMain(() => {
    const player = bukkit.Bukkit.getPlayer(uuid);
    if (!player) return { error: "offline", status: 404 };
    player.kick(reason ?? "kicked via dashboard");
    return { ok: true };
  });
});`}
        />
        <Note variant="warn">
          Don't hold a <code>Player</code> reference across a request boundary.
          Resolve it inside the <code>runOnMain</code> block from the UUID you
          trust (URL param, auth claim) so the request stays valid even if the
          player disconnects mid-flight.
        </Note>
      </Section>

      <Section title="Authentication">
        <p>
          The HTTP server is just a server — Rune doesn't ship an opinionated
          auth layer. ward issues bearer tokens from an in-game command and
          validates them in a middleware-like gateway pattern.
        </p>
        <CodeBlock
          lang="typescript"
          code={`function gate<T>(
  perm: string,
  handler: (c: Context, session: Session) => Promise<T> | T,
) {
  return async (c: Context) => {
    const session = lookupBearer(c.req.headers.get("authorization"));
    if (!session) return unauthorized();
    if (!session.perms[perm]) return forbidden();
    return handler(c, session);
  };
}

// Issued by the in-game command:
@Command("ward web token")
export class WardWebToken {
  @Run
  run(ctx: CommandCtx) {
    if (!isPlayer(ctx.sender)) return;
    const uuid = String(ctx.sender.getUniqueId());
    const token = issueToken(uuid, ctx.sender.getName());
    ctx.sender.sendMessage(
      \`<click:copy_to_clipboard:'\${token}'>click to copy token</click>\`,
    );
  }
}

app.get("/api/players/:uuid", gate("ward.user.info", async (c, session) => {
  // session.uuid is the authed player; c.param("uuid") is the target.
  return fetchPlayer(c.param("uuid")!);
}));`}
        />
      </Section>

      <Section title="Serving static files and a SPA">
        <p>
          For a dashboard you'll want to ship HTML, JS, and CSS in addition to
          the API.{" "}
          <code>
            serve({"{"} static: ... {"}"})
          </code>{" "}
          takes a directory and serves it with proper <code>Content-Type</code>{" "}
          headers. With <code>vite: true</code>, the host spawns Vite in dev
          mode and proxies HMR through the same port; in production it serves
          the built <code>dist/</code> directly.
        </p>
        <CodeBlock
          lang="typescript"
          code={`const app = rune.serve({
  port: 3000,
  static: {
    dir: "./web/dist",
    fallback: "index.html",   // SPA fallback for client routing
  },
  vite: env.NODE_ENV === "development" && {
    dir: "./web",             // your vite project root
    entry: "src/main.ts",
  },
});

// API routes register normally — they take precedence over static.
registerWebApi(app);

app.start();`}
        />
        <p>
          The <code>fallback</code> option is what makes SPA routing work: any
          non-file URL falls back to <code>index.html</code>, letting your
          client-side router pick up the path.
        </p>
      </Section>

      <Section title="Shutdown and reload">
        <p>
          <code>app.start()</code> binds the port. On reload the host drains
          in-flight requests and closes the listener before tearing down the
          runtime; your <code>start()</code> call re-runs and rebinds. Clients
          reconnect on their next request. If your dashboard uses long-lived
          WebSockets, expect them to reconnect through reload.
        </p>
        <Note>
          Ports are exclusive. If two Runes try to bind 3000, the second one's{" "}
          <code>start()</code> will throw. Pick distinct ports per Rune, or
          route them through a reverse proxy in production.
        </Note>
      </Section>
    </DocsPage>
  );
}
