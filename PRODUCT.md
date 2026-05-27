# Product

## Register

brand

## Users

Two audiences, sharing one site, both already developers:

1. **Plugin authors** evaluating Rune for the first time. They have built Paper plugins
   before, evaluated JS embeddings before, and have read enough Hacker News to be
   skeptical of "TypeScript in your Minecraft server" until proven otherwise. They
   want to know, in the first ten seconds: is an embedded V8 inside the Paper JVM
   real engineering, or marketing varnish over a process boundary.

2. **Server operators** deciding whether to install a published Rune on production.
   They have already chosen Paper over vanilla, written `server.properties`, and run
   ten other plugins. They need capability disclosure they can trust before running
   someone else's code in-process on their host.

Neither audience wants hand-holding. Both have prior context that should be
respected; neither should be re-taught what a registry or a JVM is.

## Product Purpose

Two surfaces on one site at `runemc.dev`:

- **Rune (marketing)** at `/`, `/docs/*`, `/install`, `/changelog`, `/about`.
  Convince developers that the architectural choice (embedded libnode via Panama
  FFM, no IPC, no sidecar) is a real engineering choice, and show what authoring
  a Rune feels like in code.
- **Runebook (registry)** at `/runebook/*`. Be the trustable middleman between
  authors and operators. Content-addressed blobs, immutable manifests, prominent
  capability disclosure. Faithful enough that an operator can verify by hash
  without trusting the website's database.

Success: a Paper operator installs a Rune in under sixty seconds with full
visibility into what it will do on their host.

(The site lives in two Impeccable registers. PRODUCT.md defaults to `brand`
because Phase 1 is the marketing surface and the brand register reference
governs landing-page craft. The `(runebook)` and `(account)` route groups
override to `product` register per task, as SPEC.md §8.1 declares.)

## Brand Personality

Terse and exacting. Engineered. Quietly confident.

- **Voice.** Short sentences. Code over prose. No hype, no marketing
  weasel-words ("revolutionary", "blazingly fast", "next-generation"). When in
  doubt, cut.
- **Tone.** Respectful of the reader's time and existing knowledge. Assume they
  know what Paper, the JVM, V8, and a package registry are. Don't re-explain
  unless the explanation is the point.
- **Three words:** engineered, terse, trustworthy.
- **Emotional goal.** The site itself feels as well-built as the platform it
  markets. Fast load. Real fonts. No layout shift. The shipping artifact is a
  proof of craft, not a billboard.

## Anti-references

These are rejected by design, not preference. If a draft drifts toward any of
them, rework structure or strategy before adjusting surface details.

1. **Gaming neon / RGB.** The reflex trap for Minecraft-adjacent products. No
   electric-magenta-on-black, no scanning-grid backgrounds, no chromatic
   aberration on hover.
2. **Minecraft blocky / voxel.** The second reflex trap. No pixelated typography,
   no isometric block illustrations, no Mojang-palette greens.
3. **The bland "modern" template.** Gray-on-white with no character. Geometric
   primitives without craft. A Linear-knockoff that copied the geometry but
   missed the typographic restraint that makes Linear work. The aesthetic that
   LOOKS minimal but is actually just empty.
4. **Generic SaaS landing tropes.** The hero-metric template (big number, small
   label, supporting stats). The three-column features grid with icon + heading
   + body, repeated endlessly. Gradient-text headlines. Side-stripe-bordered
   callouts. Identical card grids.

## Design Principles

1. **Show, don't tell.** The marketing hook is the architecture, not adjectives.
   If a claim about Rune can be expressed in code, in a manifest, or in a single
   reproducible install command, show that rather than describe it.
2. **Practice what you preach.** The site is shipped by the person shipping the
   platform. It should feel as engineered (fast, hashable, restrained) as the
   thing it markets. Bundle size, font subsetting, CLS, and hover latency are
   brand surfaces.
3. **Trust is the trust signal.** On registry detail pages, capability disclosure
   outweighs aesthetic appeal. A Rune asking for `fs:write` must visually weigh
   more than one asking for `host:player.message`. Operators decide based on
   this; the page must not hide it under a fold or behind a tab.
4. **No reflex aesthetic.** Reject category-reflex moves at both altitudes:
   gaming-neon, dev-tool-terminal-cliché, SaaS-purple-gradient, "fintech navy".
   Each surface choice earns its place against an explicit alternative.
5. **Two registers, one system.** Marketing pages may breathe; registry and
   dashboard pages stay dense and scan-friendly. Both share design tokens; the
   divergence is in spacing, density, and how often the layout lets the eye
   rest. Don't unify what should diverge.

## Accessibility & Inclusion

WCAG 2.1 AA as the floor, with two non-negotiables specific to this audience:

- `prefers-reduced-motion` is honored everywhere, including GSAP page-level
  intros. Motion is a decoration the platform's audience routinely disables;
  designs cannot rely on it to convey meaning.
- Capability badges on Runebook detail pages may not rely on color alone. The
  trust signal must survive grayscale, color blindness, and the user who turned
  off CSS. Weight, label text, and icon shape carry the signal jointly with
  color.
