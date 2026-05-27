---
name: Rune & Runebook
description: Marketing and registry for Rune at runemc.dev. Engineered, terse, trustworthy.
---

<!-- SEED: re-run /impeccable document once there's code to capture the actual tokens, hex values, and components. -->

# Design System: Rune & Runebook

## 1. Overview

**Creative North Star: "The Manifest"**

A manifest is a faithful record of what is inside an archive: verifiable,
content-addressed, immutable, and terse. The design system extends this
contract to the surface. Every claim a marketing page makes is backed by code
shown inline. Every signal a registry page surfaces (version, hash, capability)
is weighted by the cost of trusting it. The site is shipped by the same person
shipping the platform, and it feels as engineered as the thing it markets.

The palette is restrained: tinted warm neutrals carry every page, and a single
burnished amber/copper accent appears on no more than five percent of any
screen. Two type families, no more: one humanist sans for display and body,
one monospace that carries any string a verifier would re-hash (version
numbers, SHA-256 prefixes, capability identifiers, install commands). The
motion budget is small and purposeful. State changes feel immediate.
Page-level transitions are reserved for marketing surfaces.
`prefers-reduced-motion` disables everything decorative without breaking
meaning.

This system explicitly rejects the four reflex traps from PRODUCT.md: gaming
neon, Minecraft blocky/voxel, the bland Linear-knockoff "modern" template, and
generic SaaS landing tropes (hero-metric template, three-column features
grids, gradient-text headlines, side-stripe-bordered callouts, identical card
grids).

**Key Characteristics:**

- Warm, low-chroma neutrals tinted toward the brand hue, never flat gray.
- One burnished amber/copper accent, used rarely so its appearance reads as a
  signal, not a decoration.
- Exactly two type families: display/body sans + mono. Mono is a trust
  affordance, not stylistic emphasis.
- Hierarchy through scale and weight contrast (ratio at least 1.25 between
  steps), never through color.
- Flat at rest. Depth via tonal layering and hairline borders, not shadows.
- Motion is feedback, not choreography. No scroll-driven hero sequences.

## 2. Colors: The Burnished Palette

The palette is restrained: warm tinted neutrals plus a single burnished
accent. Exact OKLCH values land during Phase 1 implementation; the hues,
roles, and ratios are committed now.

### Primary

- **Burnished Amber/Copper** (hue family approximately 40 to 60 degrees,
  mid-to-low chroma; OKLCH value to be resolved during implementation): the
  one brand accent. Appears on call-to-action surfaces, the single accent link
  variant in long-form copy, the active state in the landing page's language
  matrix, and the install one-liner's prompt glyph. Never used for body text.
  Never used twice in the same viewport unless those uses are part of the
  same logical element.

### Neutral

A six-step warm-tinted scale, all sharing the brand hue at chroma 0.005 to
0.01 so the neutrals never read as cold gray.

- **Page Surface** (background): the lightest neutral, a warm off-white tinted
  toward the brand hue.
- **Raised Surface**: a fraction warmer or darker than the page surface, for
  hairline-bordered cards and the registry's detail-page sidebar. Tonal
  layering carries depth, not shadow.
- **Border Hairline**: 1px borders, very low contrast against the surface they
  edge.
- **Muted Text**: secondary copy, version metadata, timestamps. Anything below
  4.5:1 contrast against the page surface is forbidden.
- **Body Text**: the workhorse, approximately 12:1 against the page surface.
- **Display Text**: a touch darker than body, used only at display sizes.

Specific hex and OKLCH values resolve during Phase 1 implementation. The dark
mode variant inverts the scale around the same hue, preserving the warm
tinting; no neutral in the system is `#fff` or `#000`.

### Named Rules

**The One Accent Rule.** The burnished accent appears on no more than five
percent of any rendered viewport. Its rarity is the trust signal. If a draft
needs the accent in two places, the second use is wrong; rework the layout
before adding the second use.

**The Tinted Neutral Rule.** Every neutral carries a hint of the brand hue at
chroma between 0.005 and 0.01. There is no cold gray in the system, no `#fff`,
no `#000`. Cold gray reads as the bland-modern reflex trap.

**The Capability Color Rule.** Capability badges on Runebook detail pages may
never convey trust cost through color alone. Weight, label text, and icon
shape carry the signal jointly. A user with full color blindness, or with CSS
disabled, must still read which Rune asks for `fs:write`.

## 3. Typography

**Display / Body:** humanist sans (family to be chosen at implementation;
running candidates are Geist, IBM Plex Sans, and Inter, all locally hostable
via `next/font` per SPEC.md §8.3).

**Mono:** geometric or humanist monospace paired with the display family
(running candidates: Geist Mono, JetBrains Mono, IBM Plex Mono).

**Character:** the sans carries hierarchy through weight and scale alone. The
mono is not a stylistic choice. It is a trust affordance: any string a
verifier would re-hash (version, hash, capability identifier, install command,
manifest key) renders in mono. Diluting the mono with stylistic uses breaks
the affordance, so mono outside the verifiable-string role is forbidden.

### Hierarchy

Scale ratio at least 1.25 between steps. Exact sizes resolved at
implementation.

- **Display**: weight 400 to 500 (never 700 or higher; heavy weights at
  display size read as marketing-shout and break the terse voice). Used on
  the landing page hero and major section openers. Tight line-height (about
  1.05). Title case, not uppercase.
- **Headline**: weight 500. Used on docs page titles and secondary section
  openers. Line-height about 1.15.
- **Title**: weight 500. Used on registry detail page headers and dashboard
  section headers.
- **Body**: weight 400. The workhorse. Line length capped at 65 to 75ch on
  marketing pages; tighter on registry pages where density wins.
- **Label**: mono, weight 400, slightly tighter tracking. Used for capability
  badges, version numbers, hashes, status indicators, install snippets.
- **Eyebrow**: mono, weight 500. If uppercase, the source string is uppercase
  in the markup (never `text-transform: uppercase`; screen readers need the
  real string).

### Named Rules

**The Mono-Is-Trust Rule.** Monospace marks anything verifiable. Versions,
hashes, capabilities, install commands, manifest keys all render in mono. If
something renders mono but is not verifiable, the mono is wrong. Mono is
never used for stylistic emphasis.

**The Weight-Not-Color Rule.** Hierarchy emerges from scale and weight
contrast, never from color. The burnished accent is reserved for actions, not
for emphasis. If a paragraph needs emphasis, weight or italic carries it.

**The No Gradient Text Rule.** `background-clip: text` combined with a
gradient is forbidden. Display text is solid, single-color. Emphasis arrives
via weight or size. (Carried from the shared design laws.)

## 4. Elevation

Flat at rest. Depth is conveyed through tonal layering (the raised surface is
a fraction warmer or darker than the page surface) and hairline 1px borders,
not through shadows. The only ambient shadow in the system is on
portal-rendered popovers and tooltips, and it is subtle: low spread, low
opacity, tinted toward the brand hue.

The registry surface (Runebook plus the dashboard) is the densest part of the
site. Piling shadows on dense surfaces is the bland-modern reflex trap. Stay
flat.

### Shadow Vocabulary

- **Popover Shadow** (exact values to be resolved at implementation): the
  only ambient shadow in the system. Used for the shadcn `Popover`,
  `DropdownMenu`, `Tooltip`, and `Command` palette portals. Subtle, low
  spread, tinted toward the brand hue.
- **Focus Ring**: not a shadow. Implemented as a 2px outset border in the
  burnished accent at reduced opacity, with a 1px offset so it sits clear of
  the focused element's own border.

### Named Rules

**The Flat-By-Default Rule.** Surfaces are flat at rest. Cards, list items,
callouts, and inputs carry no shadow at rest. If a draft has more than one
elevation level visible in a single viewport, the layout is wrong; rework it
before adjusting shadows.

**The No Side-Stripe Rule.** `border-left` or `border-right` greater than 1px
as a colored accent on cards, list items, callouts, or alerts is forbidden.
This is the single most common UI reflex that breaks the system. Carried from
the shared design laws and worth repeating.

## 5. Components

Components and their exact tokens land during Phase 1 implementation. The
component philosophy is committed now.

- Every primitive (Button, Input, Dialog, Tooltip, Popover, Tabs, Toast, Form)
  comes from shadcn/ui per SPEC.md §8.2. Custom components compose shadcn
  primitives; they do not reach for Radix directly and they do not roll fresh
  primitives.
- Buttons are rectangular with a small radius (likely 4 to 6px, resolved at
  implementation). No pill shapes outside the registry's capability badges,
  which earn the pill through different shape semantics.
- Cards are rare. The shadcn `Card` exists and is used sparingly. Most "tile"
  UI is a typographic block with hairline dividers, not a card. Nested cards
  are always wrong.
- Inputs are stroke-based: 1px border, no fill at rest, focus expressed via
  the accent ring (see Elevation) rather than a fill shift.
- Capability badges (registry-specific): pill shape, mono label, leading icon,
  weight-graded by trust cost. See **The Capability Color Rule** in §2.

Full component spec, including HTML and CSS snippets for the
`.impeccable/design.json` sidecar, is deferred to the next `/impeccable
document` pass after Phase 1 lands the actual components in `src/components/`.

## 6. Do's and Don'ts

Every Don't below corresponds either to a PRODUCT.md anti-reference or to a
shared design-law ban. The visual spec carries the strategic line through.

### Do:

- **Do** tint every neutral toward the burnished hue at chroma 0.005 to 0.01.
- **Do** use monospace as a trust affordance: every verifiable string
  (version, hash, capability identifier, install command, manifest key)
  renders in mono.
- **Do** reserve the burnished accent for no more than five percent of any
  rendered viewport.
- **Do** stay flat at rest. Reach for tonal layering and hairline borders
  before reaching for shadow.
- **Do** carry hierarchy through scale and weight contrast (ratio at least
  1.25 between steps).
- **Do** honor `prefers-reduced-motion` everywhere, including GSAP page-level
  transitions. Designs must not rely on motion to convey meaning.
- **Do** ship exactly two font families across the entire site:
  display/body sans plus mono (SPEC.md §8.3).

### Don't:

- **Don't** seed colors from category reflex. No gaming neon, no Minecraft
  green, no SaaS purple gradient, no fintech navy-and-gold. (PRODUCT.md
  anti-refs 1 and 2; shared category-reflex check.)
- **Don't** use pixelated or voxel typography, isometric block illustrations,
  or Mojang-palette greens. (PRODUCT.md anti-ref 2.)
- **Don't** ship a Linear-knockoff that copied the geometry but missed the
  typographic restraint that makes Linear work. The aesthetic that looks
  minimal but is actually just empty is the bland-modern reflex trap.
  (PRODUCT.md anti-ref 3.)
- **Don't** use the SaaS hero-metric template (big number, small label,
  supporting stats), three-column features grids with icon-heading-body cards
  repeated endlessly, gradient-text headlines, side-stripe-bordered callouts,
  or identical card grids. (PRODUCT.md anti-ref 4; shared design laws.)
- **Don't** use `#fff` or `#000` anywhere in the palette.
- **Don't** use `background-clip: text` with a gradient. Display text is
  solid, single-color.
- **Don't** use `border-left` or `border-right` greater than 1px as a colored
  accent on cards, list items, callouts, or alerts. (Shared design law.)
- **Don't** use glassmorphism as a default. Backdrop blur is rare and
  purposeful, or nothing.
- **Don't** animate CSS layout properties. Transform and opacity only.
- **Don't** use ease curves with bounce or elastic. The system default is
  exponential ease-out (quart, quint, or expo).
- **Don't** use the burnished accent for body-text emphasis. Weight and
  italic carry that role.
- **Don't** convey capability trust cost through color alone. Weight, label,
  and icon shape carry the signal jointly.
- **Don't** use `text-transform: uppercase` for an eyebrow that needs to read
  cleanly with a screen reader. Use letter-spacing on already-uppercase
  source strings, or accept lowercase.
- **Don't** ship more than two font families across the entire site
  (SPEC.md §8.3).
- **Don't** use em dashes in user-visible copy. Use commas, colons, or
  rephrase. (PRODUCT.md voice constraint; carried directly from PROMPT.md.)
