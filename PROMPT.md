# Agent Handoff — Rune & Runebook Website

Drop this into a fresh agent's context to bring it up to speed on
this project. Reads top-to-bottom in ~5 minutes. The full technical
design lives in [`SPEC.md`](./SPEC.md); this file is the orienting
brief that points at it.

---

## 0. Before anything

1. **Use the Impeccable skill for any UI work.** Run
   `impeccable teach` first if `PRODUCT.md`/`DESIGN.md` are missing
   or stub. Then `impeccable shape <surface>` before code, and
   `impeccable audit` / `impeccable polish` before declaring a phase
   done. Don't skip the register step — marketing pages are
   **brand**, the registry and dashboard are **product**.
2. **This is Next.js 16.** The repo's `AGENTS.md` says so plainly:
   APIs, conventions, and file structure differ from Next 14/15.
   Read the relevant pages in `node_modules/next/dist/docs/` before
   touching routing, data fetching, caching, or server actions.
3. **Read `SPEC.md` in full** — data model, API contract, route map,
   integrity model, repo conventions. It's the source of truth; this
   prompt does not duplicate its details.
4. **Read `AGENTS.md`** at the repo root (one line, but it matters).

---

## 1. What we're building

A single site at **runemc.dev** that hosts two surfaces:

### Rune (the marketing/docs surface)

The public face of the Rune platform. Lives at the root path. The
audience is plugin authors and server operators evaluating the
platform. Needs to explain — fast — what Rune *is*, why an in-process
embedded V8 inside the Paper JVM is a real engineering choice (not a
gimmick), and what the developer experience looks like in code.

Pages: `/`, `/docs/...`, `/install`, `/changelog`, `/about`.

### Runebook (the registry surface)

Where users publish, browse, and install **Runes** — the publishable
package format. Lives under `/runebook/*`. This is a real developer
registry: detail pages, semver-pinned versions, capabilities
disclosure, immutable manifests, content-addressed blobs. Audience
is the same authors and operators but with an action in mind.

Pages: `/runebook`, `/runebook/r/[name]`, `/runebook/r/[name]/v/[v]`,
`/runebook/u/[user]`, `/runebook/publish`, `/runebook/search`. Account
flows at `/login`, `/dashboard`, `/dashboard/tokens`.

Two surfaces, one Next.js app, one design token system used in two
distinct registers (`(rune)` and `(runebook)` route groups in
`src/app/`).

---

## 2. Rune in depth (so the marketing pages don't lie)

Rune is a **polyglot scripting platform for Paper Minecraft servers**.
The hook is the architectural one, not the language one:

- **Embedded, not adjacent.** The Rune plugin is a single Paper
  plugin jar. Inside that jar, a Rust loader (`rune-loader`) is
  called from Java through the **Panama FFM API**, and it boots
  **libnode** (Node.js / V8) inside the Paper JVM process. No
  sidecar, no IPC, no proxy process. A method call from Java into JS
  is an upcall, not a socket round-trip.
- **Polyglot, not just TS.** Node/V8 is the first runtime; the host
  API and FFI plumbing are language-agnostic. Wasm (Wasmtime)
  is wired-up. Python, Lua, and Rust→Wasm are next.
- **TypeScript natively.** An embedded **esbuild** transforms `.ts`
  files at load time. Decorators (`@Listener`, `@EventHandler`,
  `@Command`, `@Arg`, `@Run`) are stage-3 syntax handled before
  Node's amaro pipeline.
- **Hot reload.** `/rune reload` rebuilds the JS isolate without
  bouncing Paper. Live Bukkit refs survive the reload boundary.
- **Live Bukkit proxies.** Java objects returned to script land are
  Proxy-wrapped: `world.getBlockAt(x,y,z).getType()` is a chain of
  reflective calls, synchronous from the script's perspective, off
  the main thread when it has to be.
- **Type generation.** On enable, the plugin reflects the entire
  Bukkit/Paper/Adventure classpath into `bukkit.d.ts` so scripts get
  full autocomplete for the actual API your server has loaded.
  Third-party plugins declared in `rune.jsonc` get the same
  treatment — `vault.economy.Economy` is a real typed handle.

A **Rune** (the package, lowercase) is what gets published. It can
be a single `.ts` file or a directory tree with `rune.toml`, multiple
modules, `.wasm` blobs, assets, and a README. The runtime loads it
multi-file (it has to — decorators get scanned per-file) and verifies
integrity by hash before executing anything.

If you're writing copy for the marketing pages, anchor on this:
*Rune scripts get installed as easily as configuring a plugin, but
behave with the power of writing one.* No process boundary, no
serialization tax, no transport between your code and the server.

---

## 3. Runebook in depth (so the registry doesn't drift)

The registry's job is to be a faithful, trustable middleman between
authors and operators. Three primitives carry everything:

### Blobs

Every file in every Rune ever published is stored exactly once in
R2 under `blobs/<sha256>`. Two Runes that ship the same `@rune/sdk`
file dedupe to one blob. Immutable — once written, never overwritten.
This is why uploads are pre-signed PUTs with `If-None-Match: *`.

### Manifests

A version isn't a tarball — it's a **manifest**: a JSON document
listing the files in that version, each with its SHA-256, plus
metadata (name, version, language, capabilities, dependencies). The
manifest is itself a blob, addressed by its own hash. The version
identity is the manifest hash.

Stored both in MongoDB (for indexing/querying) and as a blob in R2
(for offline reverification). The two must agree; the R2 copy is the
trust source.

### Capabilities

Each manifest declares what the Rune will need from the host —
`fs:read`, `fs:write`, `network`, `host:bukkit`, `host:player.*`,
etc. This is the trust signal that matters most: installed Runes
execute in-process on the operator's server. Detail pages surface
capabilities **before** the install command, not buried below the
fold. A Rune asking for `fs:write` should visually weigh more than
one that only sends chat.

### Publish flow (the CLI contract)

The CLI's `publish` runs `pack` first (resolve file list, esbuild
publish-preset transform, zstd compress) and then talks to four
endpoints in order:

1. `POST /api/v1/blobs/check` — "which of these hashes are missing?"
2. `POST /api/v1/runes/:name/versions` — submits the manifest, gets
   pre-signed R2 PUT URLs for the missing blobs.
3. `PUT <signed url>` — uploads blobs **directly to R2**, no proxy.
4. `POST /api/v1/runes/:name/versions/:version/finalize` — server
   verifies every referenced blob is in R2, atomically registers
   the version, returns the canonical install string.

A half-uploaded publish is never visible. Full contract in `SPEC.md`
§6. The CLI source is the other half of this contract; keep them
synchronised.

### Install flow

`rune add @alice/foo@1.2.3` resolves to a manifest hash, fetches the
manifest, then fetches each blob by hash directly from R2 (skip any
already cached locally). The runtime re-hashes everything and refuses
to load anything that doesn't match. The website is responsible for
serving exactly what was published — never rewriting blobs, never
re-encoding manifests, never re-hashing.

---

## 4. Stack — already chosen

Don't second-guess these unless you find a hard blocker.

| Layer | Choice |
|---|---|
| Framework | **Next.js 16** (App Router), React 19 |
| Styling | **Tailwind 4** (`@theme` tokens), no CSS-in-JS |
| Components | **shadcn/ui** as the strict baseline. Custom components compose shadcn; we don't reach for Radix directly. |
| Client data | **TanStack Query** (`@tanstack/react-query`) |
| Client state | **Zustand** — feature-scoped stores, no global blob |
| Motion | **GSAP** (page chrome, marketing flourishes), CSS for hovers |
| Forms | **react-hook-form** + Zod resolvers, wrapping shadcn `Form` |
| Validation | **Zod** at every external boundary (API bodies, manifests, env) |
| DB | **MongoDB** via **Mongoose**, Atlas Search for queries |
| Storage | **Cloudflare R2** (content-addressed blobs + manifests) |
| Web auth | **Locksmith** (`@getlocksmith/nextjs`) — JWT-based, BFF route handler, pre-built themeable forms. Email/password + magic link + GitHub + Google + TOTP MFA. Docs: https://docs.getlocksmith.dev/frameworks/nextjs |
| CLI auth | Our own personal access tokens (`rune_pat_*`), stored hashed in Mongo. Locksmith doesn't issue long-lived tokens, so the dashboard's "tokens" page is our system. |
| Markdown | **MDX** for `/docs`, sanitised `remark`/`rehype` pipeline for READMEs |
| Lint/format | **Biome** (no ESLint, no Prettier) |
| Package manager | **Bun** (lockfile committed) |
| Hosting | **Vercel** |

Adding a library not on this list needs a real justification, written
into `SPEC.md` §4.2 with the rationale.

---

## 5. Constraints worth re-stating (because they're load-bearing)

These come from the CLI / runtime contracts and are not negotiable
in the website's design:

- **Hashes are a security boundary**, not a corruption check. The
  website must store and serve the exact bytes the CLI produced.
  No "let me prettify this README before storing" steps.
- **Sourcemaps ship separately**, not inside the publish archive.
  Install size matters; debuggability matters; they don't have to
  travel together. R2 path TBD in `SPEC.md` §10.
- **Light-touch minification.** Identifier names must round-trip
  through publish so an operator can `cat` the file they installed
  and recognise the code. Don't add a "minify deeper" toggle in the
  UI — that's a runtime concern.
- **esbuild target is shared** between the runtime and the CLI's
  `pack`. The website doesn't run esbuild itself.
- **Capabilities are forever.** Once published, a version's
  capability list is part of its identity (it's in the manifest).
  Don't expose a "edit capabilities" UI; new capabilities → new
  version.
- **Yank is soft**, not delete. Yanked versions stay installable for
  anyone who pinned them; they just disappear from the default
  resolver and show a banner.

---

## 6. Where to start

The repo is a fresh Next.js 16 scaffold with Tailwind 4 and Biome
configured. `src/app/` has the default `layout.tsx` + `page.tsx` and
nothing else. Don't bolt features onto the boilerplate page —
restructure into the route groups described in `SPEC.md` §3 first.

Suggested order (matches `SPEC.md` §11 phased rollout):

1. **Phase 0 (done):** scaffold boots.
2. **Phase 1 — marketing surface:** `(rune)` route group, root page,
   install one-liner, docs shell. Run `impeccable shape` for the
   landing page before writing components; the brand register
   reference will save you from category-reflex aesthetic traps.
3. **Phase 2 — auth + tokens:**
   - Drop in the Locksmith BFF route at `app/api/locksmith/[[...path]]/route.ts`.
   - Wrap the root layout with `<LocksmithAuthProvider>`.
   - Theme `<LocksmithSignInForm>` / `<LocksmithSignUpForm>` to match
     the design tokens from `impeccable teach`. Don't rebuild them
     as custom shadcn — that's wasted work + a security delta.
   - First-login lands on `/dashboard/welcome` to pick a username
     (becomes the `@<username>/*` scope).
   - `/dashboard/tokens` issues CLI PATs (our system, not Locksmith).
   This phase unblocks CLI integration tests.
4. **Phase 3 — publish API:** Route Handlers under `src/app/api/v1/`,
   blob check, version create, finalize. Mongoose models live in
   `src/lib/db/models/`.
5. **Phase 4 — browse + detail:** `(runebook)` route group, the
   detail page with capability surfacing, version picker.
6. **Phase 5 — search:** Atlas Search index on the `runes`
   collection, results page.
7. **Phase 6 — polish:** empty states, errors, OG images,
   `impeccable polish` pass.

Each phase ends with `impeccable audit` + clean Biome before moving on.

---

## 7. What to ask the user

Don't ask about anything that's already in `SPEC.md`. Do ask:

- **Brand direction** — has `impeccable teach` already run? If not,
  run it before starting marketing pages. Don't seed colors from
  category reflex (avoid "gaming → neon", "Minecraft → blocky").
- **MongoDB connection string** — they probably have an Atlas cluster
  ready; ask for the `MONGODB_URI` env var contents.
- **R2 credentials** — bucket name, access key, secret, endpoint.
- **Locksmith project keys** — `LOCKSMITH_API_KEY` for the Sandbox
  project (dev) and the Production project (later). Both are
  `lsm_sbx_…` / `lsm_live_…` formatted; never expose to the browser.
  Also confirm which social providers are enabled in the Locksmith
  dashboard (we assume GitHub + Google + email/password at minimum)
  and what `oauthRedirectUrl` is registered for `localhost:3000` /
  `runemc.dev`.
- **CLI repo location** — when implementing the publish API, you'll
  want to cross-check against the CLI's actual request shape.

Everything else, proceed. The user trusts you to drive multi-step
infra/tool decisions.

---

## 8. Style of work expected

From the user's working style and from this project's nature:

- **Ship the DX with the feature.** Don't defer type defs, fixtures,
  or `.env.example` to a later phase.
- **Trust user observations.** If the user reports a live behaviour,
  treat it as ground truth before re-reading docs.
- **Don't half-implement.** Either Phase 3 is real and the CLI can
  publish end-to-end, or it isn't in. No stub endpoints that 200
  with `{ ok: true }`.
- **One bundled PR per phase**, not a churn of micro-PRs for a
  cohesive surface.
- **Comments only when the *why* is non-obvious.** Names carry the
  *what*. No "this function does X" comments; instead, comment on
  constraints (immutability, hash invariants, the CLI contract).
- **No em dashes** in user-visible copy. Same goes for code comments.
