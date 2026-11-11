# Design System — "Passbook"

Sourced directly from `client/src/index.css` and actual component usage (not aspirational — every value here is live in the codebase).

---

## Concept

A shared household savings tracker, designed around the physical bank passbook: warm paper, ledger-ink navy, a gold stamp for savings, a rose ledger-ink for withdrawals. Sharp corners (not soft/rounded), hairline rules, tabular numerals — the visual language of a hand-updated ledger, not a generic SaaS dashboard.

## Color system

All colors are defined as CSS custom properties in `@theme` (Tailwind v4 CSS-first config), plus semantic `:root`/`.dark` variables for surfaces.

| Role | Token | Light value | Usage |
|---|---|---|---|
| Primary / ink | `--color-primary-600` | `#2B2E4A` | Headers, primary buttons, nav active icon |
| Primary scale | `primary-50` → `primary-900` | `#EEEDF5` → `#100F1C` | Full scale available for hover/active/disabled states |
| Paper | `--color-paper-100` | `#FBF7EC` | Base background |
| Gold | `--color-gold-400` | `#C88719` | Savings / positive amounts, active nav state, primary chart accent |
| Rose | `--color-rose-400` | `#A84B3F` | Withdrawals / negative amounts, destructive actions |
| Sage | `--color-sage-400` | `#5C7A5E` | Goal-achieved state, positive growth indicator |

### Semantic surface variables (theme-aware, swap automatically in `.dark`)

| Variable | Light | Dark | Usage |
|---|---|---|---|
| `--background` | `#FBF7EC` | `#1A1B2E` | Page background |
| `--surface` | `#F4EED9` | `#22233A` | Card/panel background (`.ledger-surface`) |
| `--surface-hover` | `#EBE1C4` | `#2A2C46` | Hover state on rows/cards |
| `--foreground` | `#2B2E4A` | `#F4F1E8` | Primary text |
| `--foreground-muted` | `#5B5690` | `#ABA8CE` | Secondary text, labels, metadata |
| `--border-hairline` | `#DED2AE` | `#35374F` | All hairline borders/dividers |

**Rule:** never hardcode a light-mode hex for text/background/border in a component — always reference the semantic `var(--foreground)` etc., so dark mode is automatic. Only the accent colors (gold/rose/sage/primary) are referenced directly by name, since those are deliberately identity-consistent across themes.

## Typography

| Role | Font | Usage |
|---|---|---|
| Display | `Fraunces` (serif) | Page headings (`h1`), currency amounts, card titles — anything with "ledger" character |
| Body / UI | `Inter` (sans) | Body text, labels, nav, buttons, form inputs |

All monetary figures use `.font-display` which sets `font-variant-numeric: tabular-nums lining-nums` — figures never wobble in a list.

## Shape language

- **Border radius:** `rounded-sm` everywhere by convention (sharp, ledger-like) — confirmed as the dominant pattern (75 uses). `rounded-full` reserved for avatars and pill badges. `rounded-md` only on modal shells.
- **Borders:** 1px hairline (`var(--border-hairline)`), never a heavier default gray.

## Signature utility classes (`index.css` `@layer utilities`)

| Class | Effect | Used for |
|---|---|---|
| `.ledger-surface` | `background: var(--surface)` + 1px hairline border | Every card, table wrapper, modal |
| `.rule-double` | 3px double border-bottom in foreground color | Page-header underline (masthead effect) |
| `.stamp-frame` | Absolute-positioned 1px dashed inset border | Achieved-goal cards, auth card, dashboard balance card |

## Component conventions

- **Primary button:** `bg-primary-600 hover:bg-primary-500`, `text-paper-50`, `rounded-sm`, gold focus ring
- **Destructive button:** `bg-rose-400 hover:bg-rose-500` (used only for withdrawal creation, matching its accent)
- **Ghost/secondary button:** transparent, `text-[var(--foreground)]`, `hover:bg-[var(--surface-hover)]`
- **Tables:** header row uses `text-[11px] uppercase tracking-wider text-[var(--foreground-muted)]`; rows separated by hairline borders, not zebra-striping
- **Charts (Recharts):** gold for savings trend, rose for withdrawal analysis, a 6-color gold/sage/ink/rose cycle for multi-series (contribution-by-user) — never the default rainbow palette

## What to avoid

- Default Tailwind grays (`slate-*`, `gray-*`) — always use the semantic surface variables instead
- Rainbow status colors (`bg-blue-100`, `bg-green-100`, etc.) — map every status to gold/rose/sage/primary instead
- Rounded-xl/2xl cards — this identity is deliberately sharp-cornered
