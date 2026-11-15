# Design System — Rune

## Visual theme

Rune is a workbench for building on Paper. The public site pairs paper-colored surfaces and editorial spacing with a charcoal editor that demonstrates actual Rune code. App pages use the same colors and type at a tighter density. The mark and copper controls carry the brand.

## Palette

| Role | Light | Dark |
| --- | --- | --- |
| Paper canvas | #f8f5ef | #161412 |
| Primary surface | #f1ece3 | #1e1b18 |
| Display and body ink | #211b17 | #f6eee5 |
| Secondary copy | #62564d | #b8a99c |
| Dividers | #ded4c7 | #3b322c |
| Copper action and focus | #a74722 | #ec9d74 |
| Editor frame | #201a16 | #201a16 |
| Editor interior | #151210 | #151210 |

Copper is the single brand accent. Reserve stronger semantic color for error and privilege states. Keep headings and body copy solid. Code tokens come from the syntax theme.

## Typography

Geist is the display and body family. Use weight 550–650 for headings, compact leading, and modest negative tracking. Main headings scale from 2.75rem to 5rem. Body copy uses 1rem to 1.125rem with line height of 1.6 and a maximum measure near 65ch. Geist Mono is for code, paths, and install commands.

## Components

- The header puts Install, Docs, and Runebook in the same order everywhere. The active area has a weight and underline cue. A single navigation list becomes a native popover when space runs out.
- The editor shows real code for the same event in each supported language. Use labeled tabs and one clear copy control. Its height stays stable as users switch languages.
- Cards are reserved for choices or contained examples. Draw structure with one-pixel borders and tonal surfaces. Use a copper fill for the primary action.
- Search fields use visible labels or an accessible name, strong focus, and a clear submit action. Results use scannable rows with version and language metadata.
- Documentation uses breadcrumbs, a searchable topic list, and headings that work as anchor targets. Keep the article narrow enough for reading, with independent horizontal scrolling for code.

## Layout and motion

Use a shared 78rem page container and fluid gutters. The home hero uses an offset two-column layout for copy and a code sample. Collapse to one column at narrow widths. Navigation and touch controls are at least 44px high. Use restrained opacity, color, and small transform changes for interaction feedback. Respect reduced motion and avoid scroll-dependent reveals.

## Avoid

Avoid stock gaming art, voxel type, decorative numbering, glowing gradients, equal feature-card grids, and animations that make content wait to appear. Label runtime features according to their actual availability. Preserve the same findable tasks on mobile and desktop.
