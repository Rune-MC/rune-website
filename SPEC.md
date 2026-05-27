# Runebook — Website & Registry Design Spec

This document is the design source of truth for the site at `runemc.dev`.
It covers two distinct surfaces sharing one Next.js codebase:

1. **Rune** — marketing, docs, and identity for the Rune platform.
2. **Runebook** — the package registry where users publish and install
   *Runes* (the user-facing name for a publishable package).

Out of scope of this doc (live elsewhere): the Rune runtime/loader
internals, the CLI implementation, the Paper plugin. We only specify
the contracts the website honours and the surfaces it presents.

---

## 1. Terminology (settled)

| Term | Meaning |
|---|---|
| **Rune (platform)** | The polyglot scripting platform: embedded language runtimes inside the Paper JVM via a Rust loader on Panama FFM, no proxy process. |
| **Rune (package)** | A publishable artifact. One file, or a directory tree with `rune.toml`, multiple modules, assets. Always lowercase, scoped or unscoped (`my-rune`, `@author/my-rune`). |
| **Runebook** | The registry where Runes live — both the website section and the underlying API. |
| **Manifest** | Per-version JSON describing entry point, file list with hashes, capabilities, dependencies. Content-addressed; immutable. |
| **Blob** | A single file from a packed Rune, stored in R2 by its SHA-256. Many Runes can reference the same blob. |
| **Capability** | A declared permission the Rune requests at install time (`fs`, `network`, `host:bukkit`, …). Trust signal; surfaced prominently in UI. |

---

## 2. Goals & non-goals

### Goals

- **Browse & discover** Runes — listing, search, detail pages with
  README, install command, capabilities.
- **Publish flow** — back the CLI's `publish` command end-to-end.
- **Content-addressed storage** in Cloudflare R2 — every file stored
  once globally; manifests reference blobs by hash.
- **Hash-grade integrity** — hashes are a security boundary, not a
  corruption check. The platform verifies before loading; the
  website serves the same hashes faithfully.
- **Fast detail pages** — once a version is published it's immutable;
  detail pages cache aggressively.
- **Two-audience site** — landing/marketing co-exists with a real
  developer registry without either feeling like an afterthought.

### Non-goals (v1)

- No web-based code editor for Runes.
- No CI/CD or test runners (publish is from author's machine).
- No GitHub-app-style permissions or org accounts (single-owner v1;
  multi-owner via co-owner invites in v2).
- No mirroring or proxying other registries.
- No paid tier, no private Runes (everything public, MIT-style by
  default; private Runes deferred).

---

## 3. Surface map

### 3.1 Rune (marketing) — root + `/docs`

| Route | Purpose |
|---|---|
| `/` | What Rune is. Tagline, language matrix, install one-liner, demo snippet, three problem→solution beats. |
| `/docs` | Platform documentation index. |
| `/docs/[...slug]` | Documentation pages (MDX). |
| `/install` | Install one-liner + verification + first script. |
| `/changelog` | Release notes (sourced from a structured file in this repo). |
| `/about` | Project background, license, contact. |

### 3.2 Runebook (registry) — `/runebook/*`

| Route | Purpose |
|---|---|
| `/runebook` | Browse landing: featured, recently published, recently updated, language filter, search bar. |
| `/runebook/search` | Search results (query in `?q=`). |
| `/runebook/r/[name]` | Rune detail page — latest version. README, capabilities, install command, versions list, recent downloads, owner. |
| `/runebook/r/[name]/v/[version]` | A specific version (immutable view). |
| `/runebook/r/[name]/v/[version]/files` | File tree of a packed Rune (read-only) — pulls manifest + lets the user inspect any blob. |
| `/runebook/r/[name]/v/[version]/install` | Per-version install snippet + verification. |
| `/runebook/u/[username]` | User profile + their Runes. |
| `/runebook/publish` | Author-facing docs on how to publish. |

### 3.3 Account / auth

Auth is delegated to **Locksmith** (`@getlocksmith/nextjs`). Forms
ship with the package; we theme them, we don't rebuild. See §7 for
the full integration.

| Route | Purpose |
|---|---|
| `/login` | Renders `<LocksmithSignInForm>`. Email/password + magic link + OAuth (GitHub, Google) + TOTP step when MFA is required. |
| `/signup` | Renders `<LocksmithSignUpForm>`. Account is created in Locksmith; our local `User` doc is upserted on first authenticated request. |
| `/auth/callback` | OAuth redirect target — `oauthRedirectUrl` for Locksmith. |
| `/dashboard/welcome` | First-login username picker. Required before any publish; sets `users.username` and claims `@<username>/*` scope. |
| `/dashboard` | Logged-in landing: your Runes, recent activity. |
| `/dashboard/tokens` | CLI PATs (create, name, revoke). Our token system, not Locksmith's. |
| `/dashboard/settings` | Profile, email visibility, signing key (future). Email/password change links out to Locksmith-hosted account pages. |

### 3.4 API — `/api/v1/*` (Next.js Route Handlers)

Detailed contract in §6.

---

## 4. Stack & architecture

### 4.1 What's already chosen

- **Next.js 16** App Router, **React 19**, **Tailwind 4**, **Biome**,
  **Bun** as package manager. Project scaffolded.
- **Cloudflare R2** for blob storage (chosen for zero egress + the
  fetch-many-small-blobs access pattern).
- **TypeScript** strict.

### 4.2 Stack (decided)

| Concern | Choice | Notes |
|---|---|---|
| Metadata DB | **MongoDB** via **Mongoose** | Document-shaped fits the manifest model (nested files/capabilities/dependencies arrays without join tables). Atlas Search for §5 search. |
| Validation | **Zod** | Single schema source for manifests, API request bodies, env. Mongoose schemas validate at the DB boundary; Zod validates at the HTTP boundary. |
| Client data | **TanStack Query** (`@tanstack/react-query`) | Dashboard mutations, search-as-you-type, optimistic publishes. Server components stay server-side; React Query only inside client islands. |
| Client state | **Zustand** | Anything that crosses component trees and isn't URL-driven (token-copy state, command-palette open, theme override). Atoms-only, no global store. |
| Motion | **GSAP** | Page-level chrome, scroll-driven sections, marketing flourishes. CSS transitions for trivial hovers. Honour `prefers-reduced-motion`. |
| Components | **shadcn/ui** as the strict baseline | Every primitive (Button, Dialog, Tooltip, …) comes from shadcn. Custom components compose shadcn primitives; we don't reach for Radix directly or roll fresh primitives. |
| Web auth | **Locksmith** via `@getlocksmith/nextjs` | Identity-as-a-service. JWT (RS256), BFF route handler sets httpOnly cookies, pre-built themeable sign-in/sign-up/TOTP forms. Email/password + magic-link + OAuth (GitHub, Google) + MFA all out of the box. See §7. |
| CLI auth | **Our own personal access tokens** (PATs) in Mongo | Locksmith doesn't issue long-lived user tokens. The dashboard issues `rune_pat_*` tokens, stored hashed; the CLI sends them as bearer; Route Handlers validate against the `ApiToken` collection. Web sessions and CLI tokens are independent surfaces of the same `User` doc. |
| API process | **Next.js Route Handlers** in the same app | One deploy, one auth flow, one db client. Split to a Cloudflare Worker only when serving blobs requires it (probably never — R2 already serves direct via signed URLs). |
| Search | **MongoDB Atlas Search** | First-party text + autocomplete on `runes` collection. Fallback to `$text` index if Atlas tier isn't available. |
| Markdown | **MDX** for `/docs`, **`remark` + `rehype` pipeline** for READMEs | READMEs run through a sanitiser; do not render raw HTML. |
| Hosting | **Vercel** for the Next.js app | Works fine alongside Cloudflare R2 and MongoDB Atlas (no co-location requirement). |
| Caching | Detail/version pages: `revalidate` infinite + `revalidateTag('rune:<name>')` on publish | Immutable versions; tag-bust on the parent when a new version lands. |
| Package manager | **Bun** | Already configured; lockfile committed. |
| Lint/format | **Biome** | Already configured. No ESLint, no Prettier. |

### 4.3 Build & lint

Already wired: `bun run dev`, `bun run build`, `biome check`,
`biome format --write`. Tailwind 4 with `@theme` tokens. No CSS-in-JS.

### 4.4 The Next.js 16 caveat

`AGENTS.md` at the repo root flags this: Next 16 has breaking changes
from the Next 14/15 most agents are trained on. Before writing
routing or data-fetching code, **read the relevant pages under
`node_modules/next/dist/docs/`**. Especially:

- Route Handlers conventions (`GET`, `POST` exports in `route.ts`).
- `revalidate`, `revalidateTag`, `revalidatePath` semantics.
- `cookies()` / `headers()` async signature.

---

## 5. Data model

### 5.1 MongoDB collections (Mongoose schemas)

Stored as collections in MongoDB Atlas. Mongoose schemas defined in
`src/lib/db/models/`. Names lowercase, plural; Mongoose pluralises
automatically but we declare explicitly to avoid surprises.

```ts
// users — created on first Locksmith session, keyed by the Locksmith
// `sub` claim. Locksmith owns identity (email, password, OAuth, MFA);
// our doc owns the registry-specific profile (username, scope).
User {
  _id: ObjectId,
  locksmithSub: string (unique, indexed),  // `sub` from the Locksmith JWT
  username?: string (unique, sparse, indexed, lowercase),
                                       // chosen on first login; required
                                       // before any publish. Becomes the
                                       // scope prefix (`@<username>/foo`).
  displayName?: string,                // mirrored from Locksmith for UI;
                                       // refreshed on session.
  avatarUrl?: string,
  emailVisible: boolean (default false),
  createdAt: Date,
  // email is intentionally NOT stored locally; read it from the JWT
  // / Locksmith `getUser` when we need to send a notification. Keeps
  // the source of truth in Locksmith and avoids drift.
}

// apiTokens — issued to the CLI; stored hashed.
ApiToken {
  _id: ObjectId,
  userId: ObjectId (ref: User, indexed),
  name: string,                         // "my-laptop"
  tokenHash: Buffer,                    // sha256 of the raw token, unique
  scopes: ['publish' | 'read'][],
  lastUsedAt?: Date,
  createdAt: Date,
  revokedAt?: Date,
}

// runes — one document per logical Rune name (forever).
Rune {
  _id: ObjectId,
  name: string (unique, indexed, lowercase, e.g. "@alice/foo" or "foo"),
  description?: string,
  homepage?: string,
  repository?: string,
  license?: string,                     // SPDX id
  latestVersion?: string,               // denormalised for fast list-page reads
  latestVersionId?: ObjectId (ref: RuneVersion),
  totalDownloads: number (default 0),
  owners: [
    { userId: ObjectId (ref: User), role: 'owner' | 'maintainer', grantedAt: Date }
  ],
  createdAt: Date,
  updatedAt: Date,
}

// runeVersions — every publish is a new immutable doc.
RuneVersion {
  _id: ObjectId,
  runeId: ObjectId (ref: Rune, indexed),
  version: string,                      // semver; (runeId, version) unique
  language: 'typescript' | 'wasm' | ...,
  manifestHash: Buffer (sha256 of the manifest blob, indexed),
  archiveSizeBytes: number,
  readmeBlobHash?: Buffer,
  capabilities: string[],
  blobHashes: Buffer[],                 // every blob this version references; for GC
  publishedAt: Date,
  publishedBy: ObjectId (ref: User),
  yankedAt?: Date,
  yankedReason?: string,

  // compound unique
  index: { runeId: 1, version: 1 } unique,
}
```

**Indexes:**

- `runes.name` unique
- `users.locksmithSub` unique
- `users.username` unique sparse (a brand-new user has no username
  until the welcome step; sparse keeps the unique constraint without
  forcing every doc to populate it)
- `apiTokens.tokenHash` unique
- `runeVersions.{runeId, version}` unique compound
- `runeVersions.manifestHash` (lookup by hash)
- `runeVersions.blobHashes` multikey (GC: "which versions reference blob X?")
- Atlas Search index on `runes` over `name + description` plus
  `latestReadmeText` (denormalised at publish time for indexability).

**Why embed owners into `runes`** rather than a separate collection:
ownership is small (~1–3 entries per Rune), always read alongside the
Rune doc on publish auth, and never queried independently. Embedding
saves a join per write and matches the document model.

**What we DO NOT embed:** versions. They grow over time and have to
be queried independently for the versions list and per-version pages.

### 5.2 R2 layout

```
blobs/<hex-sha256>            # every file ever published, once
manifests/<hex-sha256>        # manifest JSON; itself addressed by its own hash
```

That's the entire R2 layout. No per-Rune folder. Content addressing
makes the bucket boring on purpose: deduplication is implicit,
permissioning is "anyone with the hash can read", and GC is "blobs
with zero referring versions".

Optional `sourcemaps/<archive-hash>/<file-path>.map` if we end up
storing sourcemaps separately (open question, §10).

### 5.3 Manifest schema

JSON, sorted keys, no trailing whitespace, UTF-8 — so the same logical
content hashes to the same SHA-256 every time.

```jsonc
{
  "name": "@alice/welcome-msg",
  "version": "1.2.0",
  "language": "typescript",
  "entry": "src/index.ts",
  "files": [
    { "path": "src/index.ts", "hash": "sha256:abc…", "size": 1428 },
    { "path": "src/handlers/join.ts", "hash": "sha256:def…", "size": 612 },
    { "path": "rune.toml", "hash": "sha256:ghi…", "size": 184 }
  ],
  "capabilities": ["host:bukkit", "host:player.message"],
  "dependencies": {
    "@rune/sdk": "^0.4.0"
  },
  "metadata": {
    "description": "Sends a welcome message on player join.",
    "license": "MIT",
    "homepage": "https://github.com/alice/welcome-msg",
    "authors": [{ "name": "Alice", "github": "alice" }],
    "keywords": ["chat", "welcome"]
  },
  "compiler": {
    "esbuild": "0.21.5",
    "target": "es2022",
    "preset": "publish"
  }
}
```

The whole archive's identity is `sha256(manifest.json)`. The version
detail page can show `archive_hash: <manifestHash>` and the CLI can
verify by re-hashing the manifest after fetch.

---

## 6. Publish API (CLI contract)

Bearer auth via `Authorization: Bearer rune_pat_<token>`. All bodies
JSON unless noted. Versions are atomic: a half-uploaded publish is
either finalised or never registered.

### `POST /api/v1/runes/:name/versions`

Author → registry: "I want to publish version X. Here's the
manifest." Server validates ownership, version uniqueness, semver
shape, capability shape; returns which blobs are missing.

```jsonc
// request
{ "manifest": { /* see §5.3 */ } }

// 200 OK
{
  "manifest_hash": "sha256:…",
  "missing_blobs": [
    { "hash": "sha256:def…", "upload_url": "https://r2…", "expires_at": "…" }
  ],
  "version_id": "uuid"   // version is in "pending" state until finalize
}
```

`upload_url`s are pre-signed PUTs to R2 with `expires` in ~15 min.
Already-present blobs are omitted, so dedupe happens at the protocol
layer, not just storage.

### `POST /api/v1/blobs/check`

Fast pre-check the CLI runs before uploading to skip blobs already
known. Useful when the author has published similar Runes before.

```jsonc
{ "hashes": ["sha256:abc…", "sha256:def…"] }
// 200
{ "present": ["sha256:abc…"], "missing": ["sha256:def…"] }
```

### `PUT <signed url>` (direct to R2)

CLI uploads raw bytes. Server doesn't proxy.

### `POST /api/v1/runes/:name/versions/:version/finalize`

CLI: "all blobs are in R2; please commit." Server verifies every blob
in the manifest is now present, marks the version active, busts
caches, returns the canonical install string.

```jsonc
// 200
{
  "name": "@alice/welcome-msg",
  "version": "1.2.0",
  "manifest_hash": "sha256:…",
  "install": "rune add @alice/welcome-msg@1.2.0"
}
```

### `POST /api/v1/runes/:name/versions/:version/yank`

Soft-delete a published version. Manifest + blobs remain accessible
(otherwise we'd break anyone who already installed); future `rune add`
warns. Reason required.

### Read endpoints

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/runes/:name` | Rune metadata + version list. |
| GET | `/api/v1/runes/:name/v/:version` | Version metadata. |
| GET | `/api/v1/runes/:name/v/:version/manifest` | Returns the manifest JSON (or 302 to its R2 URL). |
| GET | `/api/v1/blobs/:hash` | Redirects to the R2 URL. |
| GET | `/api/v1/search?q=…&lang=…` | Search. |

All read endpoints are cacheable forever once a version is finalised.
Set `Cache-Control: public, max-age=31536000, immutable` on
version-scoped responses.

---

## 7. Auth & token model

Two auth surfaces share one user. Web sessions go through
**Locksmith**; the CLI uses **our own personal access tokens**. Both
resolve to the same `User` document in Mongo.

### 7.1 Web auth — Locksmith (`@getlocksmith/nextjs`)

Locksmith is identity-as-a-service: RS256 JWTs issued from their
project keys, BFF route handler on our side sets httpOnly cookies,
and the package ships pre-built themeable forms so we don't roll our
own sign-in UI.

**What lives where:**

| In Locksmith | In our DB |
|---|---|
| Email, password, OAuth bindings, MFA secrets | Registry-specific profile (username, scope, owners) |
| Sign-in / sign-up flows | Username picker on first login, dashboard, PATs |
| Magic links, password reset, session invalidation | Rune metadata, manifests, blob references |
| JWT issuance + refresh | Server-side authorization (does `userId` own this Rune?) |

**Env vars (server-side only):**

- `LOCKSMITH_API_KEY` — `lsm_live_…` in prod, `lsm_sbx_…` in dev.
  Browser must never see it.
- `LOCKSMITH_BASE_URL` — optional override; defaults to
  `https://getlocksmith.dev`.

**Files we own:**

1. **BFF route handler** at `src/app/api/locksmith/[[...path]]/route.ts`:

   ```ts
   import {
     createLocksmithRouteHandlers,
     locksmithServerClientFromEnv,
   } from "@getlocksmith/nextjs/server";

   const { GET, POST } = createLocksmithRouteHandlers({
     ...locksmithServerClientFromEnv(),
     routeBasePath: "/api/locksmith",
   });

   export { GET, POST };
   ```

   Handles every Locksmith endpoint (session, login, oauth/exchange,
   refresh) under one catch-all. We never proxy through Locksmith
   from the browser directly.

2. **Provider** in `src/app/providers.tsx`:

   ```tsx
   "use client";
   import { LocksmithAuthProvider } from "@getlocksmith/nextjs/client";

   export function Providers({ children }: { children: React.ReactNode }) {
     return (
       <LocksmithAuthProvider routePrefix="/api/locksmith">
         {children}
       </LocksmithAuthProvider>
     );
   }
   ```

   Wraps the root layout. The provider polls `GET /api/locksmith/session`
   to populate `useLocksmithAuth()`.

3. **Middleware (optional)** at `middleware.ts` — validates bearer
   tokens on API routes and injects `x-locksmith-user-*` headers
   for downstream handlers. Useful for the `/api/v1/*` registry
   endpoints when called from logged-in web users (rare; CLI uses
   PATs).

4. **Pre-built forms** on `/login` and `/signup`. Use them; don't
   build our own. Configure the `theme` prop and `socialProviders`
   list. Example:

   ```tsx
   import { LocksmithSignInForm } from "@getlocksmith/nextjs/client";

   <LocksmithSignInForm
     theme="locksmith"
     oauthRedirectUrl="https://runemc.dev/auth/callback"
     socialProviders={["github", "google"]}
   />
   ```

   The `theme` prop is the Impeccable seam: pass a theme object that
   matches the rest of the Runebook design tokens once `impeccable
   teach` settles them. Don't rebuild the forms as custom shadcn —
   that's wasted work and a security-surface delta.

   `<LocksmithTotpForm />` mounts conditionally when MFA is required;
   include it on the login page and let it render itself.

**Server-side user resolution** (in Route Handlers or server actions):

```ts
import { locksmithServerClientFromEnv } from "@getlocksmith/nextjs/server";
import { cookies } from "next/headers";
import { User } from "@/lib/db/models/user";

export async function currentUser() {
  const token = (await cookies()).get("locksmith_at")?.value;
  if (!token) return null;
  const client = locksmithServerClientFromEnv();
  const lsUser = await client.getUser(token);   // verifies JWT locally
  if (!lsUser) return null;
  // Bridge to our domain user; upsert on first encounter.
  return User.findOneAndUpdate(
    { locksmithSub: lsUser.sub },
    { $setOnInsert: { locksmithSub: lsUser.sub, createdAt: new Date() },
      $set: { displayName: lsUser.name, avatarUrl: lsUser.avatarUrl } },
    { upsert: true, new: true },
  );
}
```

Cache this helper per request — JWT verification is local (uses the
project public key), but the Mongo round-trip isn't.

**Client-side user state:**

```tsx
"use client";
import { useLocksmithAuth } from "@getlocksmith/nextjs/client";

const { user, loading, signOut } = useLocksmithAuth();
```

Don't mirror this into Zustand. Locksmith's provider is the source of
truth for "am I signed in"; Zustand is for app-specific state that
isn't auth (token-copy banner state, command palette, etc.).

### 7.2 First-login flow (username pick)

Locksmith doesn't know our username space, so first-login lands the
user on `/dashboard/welcome` which:

1. Resolves their `User` doc (created by `currentUser()` above).
2. If `username` is unset, shows a one-step form: pick a username
   between 3–32 chars, lowercase, alphanumeric + `-`, unique.
3. On submit, sets `users.username` and grants `@<username>/*` scope
   ownership. From then on, every publish to `@<username>/*` must be
   by this user. Other users can't claim that scope.
4. Redirects to `/dashboard`.

Until a username is picked, the user can browse but can't publish or
take ownership of an unscoped name.

### 7.3 CLI auth — our PATs

Locksmith **does not issue long-lived user tokens** (access tokens
default to ~15 min, refresh tokens are rotated). For the CLI we issue
our own:

- Generated on `/dashboard/tokens` (web session required to land
  here; Locksmith gates entry). Form is a shadcn `Dialog` + `Input`
  for the token name, e.g. `"my-laptop"`.
- Format: `rune_pat_<24-byte url-safe random>`. Shown **once**, on
  the success screen, with a copy button. Then the raw value is
  thrown away; we keep only `tokenHash = sha256(token)`.
- CLI saves it under `~/.config/rune/token`. Sent on publish requests
  as `Authorization: Bearer rune_pat_…`.
- Server-side: hash the incoming token, look up by `tokenHash` in the
  `apiTokens` collection (unique index does the work), check `userId`
  + `scopes`, bump `lastUsedAt`. Revoked tokens (non-null `revokedAt`)
  reject immediately.

PATs are a separate revocation surface from the web session: signing
out of the web doesn't revoke CLI tokens, and revoking a CLI token
doesn't sign the user out. The dashboard lists every active token
with `lastUsedAt` so users can spot rogue tokens.

### 7.4 Publish authorization

On publish: bearer-token resolves to a `userId`; the registry checks
that the Rune's `owners[].userId` includes them, OR the Rune doesn't
exist yet (claim-on-first-publish for unscoped names, or scope-match
for scoped names). Scope match is strict: `@alice/foo` can only be
published by the user whose `username` is `alice`.

### 7.5 Webhooks (later)

Locksmith ships a webhook channel for events like password resets and
user deletion. Wire up `/api/locksmith/webhook` to delete (or soft-
disable) the local `User` doc on `user.deleted`. HMAC-verify with the
secret from the Locksmith dashboard. Not required for v1; flag as a
phase-6 polish item.

---

## 8. Frontend structure

### 8.1 Route groups

```
src/
  app/
    (rune)/                # marketing register — long-form, big type
      page.tsx             # /
      docs/[...slug]/page.tsx
      install/page.tsx
      changelog/page.tsx
      about/page.tsx
    (runebook)/            # product register — dense, scan-friendly
      runebook/
        page.tsx
        search/page.tsx
        r/[name]/
          page.tsx
          v/[version]/
            page.tsx
            files/page.tsx
            install/page.tsx
        u/[username]/page.tsx
        publish/page.tsx
    (account)/
      login/page.tsx
      dashboard/
        page.tsx
        tokens/page.tsx
        settings/page.tsx
    api/
      v1/
        runes/[name]/...
        blobs/check/route.ts
        search/route.ts
```

Two route groups → two layouts → two registers (in Impeccable terms).
Marketing pages are **brand register**, Runebook + dashboard are
**product register**. They share design tokens but use them differently.

### 8.2 Component conventions

- **shadcn/ui is the strict baseline.** Every primitive (Button,
  Input, Dialog, Tooltip, Popover, Tabs, Toast, …) comes from
  `npx shadcn add`. Custom components LIVE under
  `src/components/ui-extra/` and **compose** shadcn primitives —
  they don't replace them and they don't reach for Radix directly.
- **No `Card` everywhere reflex.** Most Rune detail tiles aren't
  cards — they're typographic blocks with hairline dividers. The
  shadcn `Card` exists; use it sparingly.
- **One container component**, not nested. Marketing pages use it
  sparingly; Runebook uses a wider variant.
- **Server components by default.** Client components only when they
  need: TanStack Query, Zustand, GSAP, or DOM-only APIs. Mark
  `'use client'` at the smallest island that needs it.
- **No global Redux/Context-blob.** Zustand stores are scoped per
  feature (`useTokenCopyStore`, `useCommandPaletteStore`). URL is
  the state for search/filter; `useSearchParams` reads it.
- **TanStack Query lives in `src/lib/query/`.** A single
  `QueryClientProvider` wraps the runebook + dashboard route groups.
  Hydration: prefetch on the server, hand the cache to the client
  via `HydrationBoundary`.
- **GSAP** is loaded via `next/dynamic` with `ssr: false` for
  page-level intros so it doesn't bloat the server bundle. Hover
  micro-interactions stay in CSS.
- **Forms** use `react-hook-form` + Zod resolvers. shadcn `Form`
  primitives wrap it.

### 8.3 Design tokens

Set up via `impeccable teach` once the brand direction is settled.
Don't seed colors here — let the design pass own that decision.
Reserve `globals.css` for: CSS reset, Tailwind 4 `@theme` block,
font face declarations. Nothing else.

Fonts: `next/font` for at most two families — one display, one body.
Hosting them locally; no Google Fonts at runtime.

---

## 9. Integrity & trust model

The website is the trust mediator between authors and operators
installing Runes on production servers. Everything below is a
load-bearing contract:

1. **Manifest hash is the version identity.** A published version is
   `(name, version, manifest_hash)`. Change one byte → different
   version. Different hash on the same `(name, version)` is rejected.
2. **Blob hashes are immutable.** Once `blobs/<hash>` exists in R2,
   it's never overwritten. Reuploads with mismatched content are
   rejected at the R2 layer (pre-signed PUT with `If-None-Match: *`).
3. **Manifest stored in R2** (not just Postgres) so an operator can
   re-verify by hash without trusting our DB.
4. **README is a blob, indexed in Postgres** for search. Detail page
   renders the blob, not a DB row, so the rendered README is
   bit-for-bit what the author packed.
5. **Capabilities are part of the manifest.** Surface them clearly on
   the detail page — operators decide based on this list. A Rune
   asking for `fs:write` should look heavier than one asking for
   `host:player.message`.
6. **Yank is soft.** Yanked versions remain installable for anyone
   who's pinned them but disappear from default install (`rune add
   <name>` resolves to highest non-yanked). Yanked versions show a
   prominent warning banner.

Future: detached signatures, sigstore-style transparency log.

---

## 10. Open decisions

These need an answer before code lands; left here so the implementer
can flag them, not to slow this doc down.

| # | Question | Suggested default |
|---|---|---|
| 1 | MongoDB hosting | Atlas free tier for dev; M10 or larger before launch (gives us Atlas Search). |
| 1b | Locksmith project tier + enabled social providers | Production + Sandbox projects in Locksmith; at minimum enable GitHub + Google + email/password. MFA optional in v1, enable in dashboard before launch. |
| 2 | Email service for security notifications | Locksmith for auth-flow email (sign-up confirmation, password reset, magic link); Resend for our domain notifications (token created, ownership transferred, version yanked). |
| 3 | Sourcemaps in archive or separate R2 path | **Separate.** Don't pay the install-size cost; expose under `/api/v1/runes/:name/v/:version/sourcemap/:path` for dev tooling. |
| 4 | Scope claim rules | `@<github-login>/*` claimed on first publish. Unscoped names first-come-first-served, reservable via DM until self-serve lands. |
| 5 | Rate limits | 60 publish/hour, 600 reads/min per token. Behind Cloudflare; tweak after launch. |
| 6 | CDN in front of R2 | Cloudflare's R2 public bucket already CDN-fronted. Just confirm cache TTLs match the immutable contract. |
| 7 | Username/scope rename | Forbid in v1; namespaces are forever. Maintainers can transfer instead. |
| 8 | Multi-region | Not before traffic justifies it. |
| 9 | Atlas Search vs `$text` index | Atlas Search where the tier allows; degrade gracefully to `$text` so local dev with a self-hosted Mongo still functions. |

---

## 11. Phased rollout

| Phase | Surface | Done when |
|---|---|---|
| 0 | Scaffold | Project boots, Tailwind themed, biome clean. (Already done.) |
| 1 | Marketing pages | `/`, `/install`, `/docs` shell render and pass `impeccable audit`. |
| 2 | Auth + tokens | Locksmith BFF route handler installed, `<LocksmithSignInForm>` themed on `/login`, first-login `/dashboard/welcome` username picker, `currentUser()` server helper bridging Locksmith sub → `User` doc, dashboard issues CLI PATs end-to-end. |
| 3 | Publish flow | `POST /api/v1/runes/...`, blob upload, finalize, dedupe. CLI can publish end-to-end. |
| 4 | Browse + detail | `/runebook`, `/runebook/r/[name]`, manifest viewer. |
| 5 | Search | `/runebook/search` with Postgres FTS. |
| 6 | Polish | Empty states, error pages, sitemap, OG images. |

Each phase ends with an Impeccable pass (`audit` + `polish`) before
moving on. No phase has stub UI from a previous phase still live.

---

## 12. Repo conventions

- Filenames: kebab-case for routes (Next.js convention), PascalCase
  for components, camelCase for everything else.
- Server actions go in `src/lib/actions/`. Pure helpers in `src/lib/`.
- Mongoose connection + models live in `src/lib/db/`. One file per
  model under `src/lib/db/models/`; `src/lib/db/index.ts` exports the
  connection helper used by every Route Handler. Cache the
  connection across hot reloads (the standard Mongoose-in-Next pattern).
- R2 client in `src/lib/r2/`. Signed URL helpers separate from hashing
  helpers (`src/lib/hash.ts`).
- Manifest schema validation in one place: `src/lib/manifest.ts`
  exports the Zod schema, the inferred type, AND the canonical-JSON
  serializer used for hashing. Anything else that touches a manifest
  goes through it.
- Zustand stores: `src/stores/<feature>.ts`. Each exports a single
  hook and the bare store. No selectors stored in the file — callers
  pick fields with `useStore(s => s.foo)`.
- TanStack Query: query keys live in `src/lib/query/keys.ts` (one
  export per resource). Mutations live next to the components that
  fire them, not in a global file.
- shadcn components: kept under `src/components/ui/` (the default
  install path). Don't edit them directly; if a primitive needs
  modification, wrap it in `src/components/ui-extra/`.
- Locksmith integration lives in `src/lib/auth/`:
  - `src/lib/auth/server.ts` — `currentUser()` helper (bridges
    Locksmith sub → our `User` doc), the server client singleton.
  - `src/lib/auth/middleware.ts` — re-exports `createLocksmithMiddleware`
    config so `middleware.ts` at the project root stays a one-liner.
  - The BFF catch-all route is the only Locksmith touch in
    `src/app/api/`. Don't sprinkle Locksmith imports across feature
    routes — go through `currentUser()`.

---

## 13. Cross-references

- **CLI (separate repo)** — implements `pack` and `publish`. Source
  of truth for what blobs get uploaded, what the manifest looks like
  at the byte level, and what hashing function is used. Any change
  here must be mirrored there.
- **Rune runtime (separate repo)** — verifies hashes at install time.
  The website serves what the runtime expects; never the reverse.
- **`@rune/sdk` package** — shipped as a Rune itself (eventually).
  Listed in the Runebook like any other package.

When the publish API or manifest schema change, all three repos move
together. Tag versioned RFCs in `docs/rfcs/` once we have more than
two contributors.
