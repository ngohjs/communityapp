# Terra Trust System — Delivery Blueprint

## Purpose
- Translate the Terra Trust concept into a production-ready, award-calibre design system.
- Provide a single reference for tokens, component coverage, motion, accessibility, cross-platform rules, and performance targets.
- Guide implementation across web (React + Tailwind), with extensibility toward native and other surfaces.

## Current State Snapshot
- **Visual language**: Terra palette wired into global CSS and Tailwind; ledger card motif and serif/sans pairing live in key routes.
- **Available primitives**: Surfaces, ink scale, a small set of spacing/radius tokens, `ease-terra` timing, KPI animation hook.
- **Component coverage**: Card, ledger section, badge, button (primary/ghost), alert, toggle, KPI.
- **Documentation**: Visual exploration mockup at `design/mockups/index.html`, narrative captured in the Terra Trust System Audit (previous notes).
- **Gaps**: No comprehensive primitive/semantic token taxonomy, limited component variants, missing motion choreography, sparse accessibility instrumentation, no documented cross-platform adaptation or performance strategy.

## Target Experience Principles
1. **Grounded reliability** — calm surfaces for dense data, controlled contrast, precise typography.
2. **Data-forward clarity** — hierarchy that lets metrics, states, and audit details surface quickly.
3. **Performance confidence** — responsive, accessible interactions with predictable motion and minimal runtime cost.

## System Expansion Goals

### 1. Token Architecture
- **Primitive sets**: Establish color (neutral 0–1000, accent family, semantic reds/ambers/greens), typography scale (display/headline/title/body/data), spacing (4px base with named steps), radii (`xs → pill`), elevation (`level-0 → level-4`), opacity, z-index, and motion (durations + easings).
- **Semantic mapping**: Derive intent tokens (`--terra-action-primary-bg`, `--terra-surface-danger`, `--terra-text-muted`, `--terra-border-focus`, `--terra-graph-positive`) for component consumption.
- **Variants**: Provide density modes (comfortable, cozy, compact), dark mode values, and high-contrast overrides.
- **Tooling**: Encode primitives in CSS custom properties with fallbacks; mirror them via `tailwind.config.ts` `theme.extend` to keep utility classes token-driven.

### 2. Component Library
- **Buttons**: Primary, secondary, ghost, destructive, quiet; size scale (`xs`–`xl`); icon-leading/trailing, icon-only; loading/disabled/pressed states with `aria-*` wiring.
- **Form controls**: Text input, textarea, select, date, checkbox, radio, segmented control; inline validation, helper text, success/error semantics, skeleton states.
- **Feedback structures**: Alerts (info/warning/danger/success), toast/snackbar system, progress bar, skeleton loader, status badges.
- **Navigation**: Topbar, side navigation, breadcrumbs, tabs, accordions, pagination, command palette.
- **Layouts**: Card matrix, data table, metric dashboard, modals/sheets, drawers, overlay scrims with focus management.
- **Documentation**: Storybook (or similar) with anatomy diagrams, variant tables, accessibility notes, responsive behavior callouts, and code snippets.

### 3. Motion & Interaction
- **Tokens**: `--motion-snappy` (120ms), `--motion-productive` (180ms), `--motion-expressive` (320ms), global easing curves (`terra-standard`, `terra-decelerate`, `terra-accelerate`).
- **Patterns**: Entry/exit keyframes for modals, sheets, dropdowns; hover elevation ramps; focus transitions; KPI counting timeline; notification toast choreography.
- **Reduced motion**: Honour `prefers-reduced-motion` by swapping to fade/scale with shorter durations, disabling non-essential counters.

### 4. Accessibility Commitments
- **Contrast**: Maintain ≥4.5:1 for text, ≥3:1 for non-text; validate accent usage (Clay on Verdant combinations), provide tokenized contrast pairs.
- **Focus & keyboard**: Unified focus ring token, larger tappable targets (44×44 minimum), skip-links, keyboard trap handling for overlays, `aria-live` regions for async states.
- **Assistive copy**: Inline `aria-label`/`aria-describedby` for icon-only controls, error explanations, and toggle states; ensure heading hierarchy within cards/sections.
- **Audits**: Integrate axe automated testing + manual keyboard/AT checks into CI.

### 5. Cross-Platform Guidance
- **Responsive grid**: Document layout behavior for desktop (12-col, 112px margins), tablet (8-col, 24px gutters), mobile (single-column stacking, reduced ledger density).
- **Density modes**: Define token adjustments (padding, font step) for compact/tablet/mobile contexts.
- **Platform notes**: Provide mapping for React Native (StyleSheet tokens), email templates (fallback palette), and dark mode roadmap.
- **Brand assets**: Specify gradients, logomarks, illustrative motifs for marketing and presentation decks.

### 6. Performance & Ops
- **Fonts**: Host Roboto/Source Serif Pro with `font-display: swap`, preload key weights, offer system font fallback stack.
- **CSS delivery**: Purge unused Tailwind utilities, code-split component styles, leverage CSS variables to reduce duplication.
- **Runtime**: Memoize animated components, lazy-load heavy dashboards, prefer `transform`/`opacity` animations, profile interactions.
- **Tooling**: Automated visual regression (Chromatic/Playwright), lint rules enforcing token usage (`@media` guard for breakpoints, `var(--terra-*)` requirement).

## Implementation Roadmap

| Phase | Focus | Key Outputs |
| --- | --- | --- |
| 1 | Token Deep Dive | Primitive + semantic token map, Tailwind wiring, density + dark-mode scaffolding |
| 2 | Core Components | Buttons, fields, alerts, layouts with Storybook coverage and snapshot tests |
| 3 | Motion System | Duration/easing tokens, keyframes, reduced-motion patterns, applied to overlays/nav |
| 4 | Accessibility Sweep | Skip links, focus strategy, aria instrumentation, automated axe suite |
| 5 | Cross-Platform & Performance | Responsive rules, mobile/density tokens, font loading plan, perf budgets |
| 6 | Portfolio Polish | Documentation site, usage guidelines, motion demos, audit + review checklist |

## Milestones & Metrics
- **Design sign-off**: Token inventory and component anatomy reviewed with design stakeholders.
- **Engineering baseline**: CI passes with lint enforcing token usage; Storybook publishes live docs.
- **Quality gates**: 100% component coverage in accessibility audit, 0 outstanding contrast violations, motion review against choreography spec.
- **Portfolio readiness**: Capture production-ready visuals, motion reels, and case study narrative for awards submissions.

## Next Steps
1. Schedule token workshop to validate primitive palette, motion curves, and density needs.
2. Stand up shared Storybook environment; bootstrap token JSON and design token pipeline.
3. Assign component owners per phase and begin documenting interaction/state diagrams alongside implementation.

---

### Progress Log
- **2024-10-24** – Phase 1 initiated: primitive + semantic tokens encoded in CSS variables, Tailwind theme consumes new tokens, Work Sans data font added to baseline typography stack, dark-mode scaffolding gated behind `data-theme="dark"` for future opt-in.
- **2024-10-25** – Phase 2 underway: button system gains size/variant matrix, loading states, full-width + icon plumbing; badges/toggles updated; field scaffolding now supports statuses, helper/validation copy, and forwardRef input primitives.
- **2024-10-25** – Auth flows re-skinned with Terra primitives (buttons, inputs, badges), reinforcing form status messaging and loading states.
