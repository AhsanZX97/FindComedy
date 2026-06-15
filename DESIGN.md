# Design

Visual system for FindComedy. Captured from the existing codebase (amber accent, serif display, zinc dark scale, class-based light/dark) and tightened against the brand: **gritty, honest, local**, optimized for fast scanning on a phone. See [PRODUCT.md](PRODUCT.md) for strategy.

## Color

Color strategy: **restrained** — a near-neutral surface carrying the data, with a single committed accent (amber) doing the brand work. The accent is the circuit's stage-light warmth against a dark, backstage neutral; it is not decoration and should stay scarce enough to mean "this matters."

Use OKLCH for any new tokens. Existing hexes kept for continuity.

### Light mode

| Role | Value | Notes |
|---|---|---|
| `bg` | `#ffffff` | Page background. |
| `surface` | `#ffffff` | Cards sit on a subtle ring, not a fill. |
| `surface-muted` | `#f4f4f5` (zinc-100) | Secondary panels, inputs. |
| `border` | `#e4e4e7` (zinc-200) | Hairline rings/dividers. |
| `ink` | `#18181b` (zinc-900) | Primary text. Hits AA on white. |
| `ink-muted` | `#52525b` (zinc-600) | Secondary text — NOT lighter than this for body. |
| `accent` | `#f59e0b` (amber-500) | Headings, key actions, brand. |
| `accent-strong` | `#b45309` (amber-700) | Accent text on light bg (amber-500 fails AA as text). |

### Dark mode

| Role | Value | Notes |
|---|---|---|
| `bg` | `#09090b` (zinc-950) | Backstage near-black. |
| `surface` | `#18181b` (zinc-900) | Card fill. |
| `border` | `#27272a` (zinc-800) | Rings/dividers. |
| `ink` | `#fafafa` (zinc-50) | Primary text. |
| `ink-muted` | `#a1a1aa` (zinc-400) | Secondary text. |
| `accent` | `#fbbf24` (amber-400) | Brighter amber for contrast on dark. |

### Semantic / category colors

Night-type badges (keep, they aid scanning): open-mic = blue, showcase = violet, pro = amber, mixed = neutral gray. Bringer = amber-600 (warn), No bringer = emerald-600 (good). Keep these muted (50/700 light, 950/300 dark), never saturated fills.

### Contrast rules

- Body text ≥ 4.5:1; large/bold text ≥ 3:1; placeholders ≥ 4.5:1.
- **Amber-500 is NOT a text color on white** — use `accent-strong` (amber-700) for amber text in light mode. Amber as a heading color on dark (amber-400 on zinc-950) is fine.
- No gray-on-tint body text.

## Typography

| Role | Family | Notes |
|---|---|---|
| Display / headings | **Georgia, serif** (`font-display`) | The serif against a utilitarian sans is the contrast axis — it carries "local, made-by-people" warmth. Keep it for night names, page titles, hero. |
| Body / UI | System sans (Tailwind default stack) | Listings, labels, controls. Fast, legible, no webfont penalty on mobile. |

Rules:
- Pair on contrast (serif display + sans body) — never two sans families.
- Body line length capped 65–75ch.
- `text-wrap: balance` on h1–h3; `text-wrap: pretty` on prose.
- Hero clamp max ≤ 6rem; display letter-spacing floor ≥ -0.04em (current `tracking-tight` is fine).
- Hierarchy by weight + serif/sans switch, not by color alone.

## Layout & Spacing

- Mobile-first. The primary view is a single-column scannable list on a phone.
- Listings: responsive grid `repeat(auto-fit, minmax(280px, 1fr))` — no manual breakpoint juggling.
- Cards are used here because a night IS a discrete scannable unit — but keep them flat (a ring, not a heavy shadow), never nested. Card radius `rounded-2xl`, padding `p-5`.
- Vary vertical rhythm between sections; don't apply one uniform gap everywhere.
- Z-index: use a named scale (dropdown < sticky < modal-backdrop < modal < toast < tooltip). No `9999`.

## Components

- **NightCard** — the atom of the product. Type/level badges, serif night name (accent), venue + area + station, schedule, bringer status footer, favourite toggle. Optimize this first; it's repeated everywhere.
- **FilterBar** — must stay fast and obvious; performers filter by day/area/type/level constantly.
- **Badges** — pill, `text-xs font-medium`, muted tint + border. The category color system above.
- **Modals** (Feedback, Report) — native `<dialog>`/portal to escape stacking contexts.

## Elevation

Flat by default. Depth via a 1px ring (`ring-1`) and a faint `hover:shadow-sm`, not stacked shadows or glass. Backstage, not showroom.

## Motion

- Purposeful and cheap. Ease-out (quart/quint/expo), no bounce/elastic.
- Don't animate layout properties; prefer transform/opacity.
- Every animation needs a `prefers-reduced-motion: reduce` fallback (crossfade or instant).
- Staggered list entrances are OK; a uniform reveal slapped on every section is not. Default content must be visible without JS.

## Absolute bans (enforced)

Side-stripe borders · gradient text · default glassmorphism · hero-metric template · identical icon-card grids · uppercase tracked eyebrows on every section · numbered section markers as scaffolding · text that overflows its container. If about to write one, restructure instead.
