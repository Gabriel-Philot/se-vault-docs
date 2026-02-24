# Frontend Reference Synthesis (Module 05 + Cozinhas/Le Philot Baseline + SOLID UI Artifact Reuse)

## Summary

This document merges frontend guidance from:

- `../../04-APIS/cozinhas-chat-pt` (primary frontend layout/navigation reference)
- `../FRONTEND_SAMPLES.md` (visual direction and component inspirations)
- `../PLAN.md` (page architecture and feature scope)
- `../PROMPT_ASSETS.md` (asset intent and placement)
- `../../03-OPP/solid_project/solid-refactory` (internal UI artifact patterns only)

Goal: produce an implementation-ready frontend architecture without overwriting the existing Palantir concept.

## Frontend Reference Precedence (Locked)

Use sources in this order for frontend decisions:

1. `cozinhas-chat-pt` / Le Philot pattern for layout, navigation model, and page UX baseline (landing + internal top nav)
2. `../PLAN.md` for Palantir feature scope, page responsibilities, and teaching flow
3. `../PROMPT_ASSETS.md` for mandatory image inventory and intended semantics
4. `../FRONTEND_SAMPLES.md` for visual/component inspiration options
5. SOLID frontend only for isolated internal UI artifacts (micro-interactions, card internals, motion primitives), never page structure

## What the Existing Module-05 Plan Already Gets Right

Keep as-is:

- Landing page + top nav internal pages (no sidebar)
- Thematic page breakdown (Dashboard, Missions, Library, Architecture)
- Didactic mapping between infrastructure and LOTR metaphor
- Tailwind + Framer Motion + Lucide stack
- Strong visual language and asset planning
- Clear implementation phases

What was missing (and is added here):

- More explicit component boundaries and ownership
- Motion standards (what to animate vs not)
- Shared state patterns for polling/progress UX
- Accessibility and reduced-motion constraints
- Concrete "use all assets" enforcement in frontend planning
- Selective reuse of small internal UI artifact patterns from SOLID (micro-interactions/primitives only)

## SOLID UI Artifact Pattern Review (Adopt / Adapt / Reject)

| Source Pattern | Decision | How Used in Palantir |
|---|---|---|
| Navbar entrance micro-animation (`Navbar.tsx`) | Adapt | Apply only the entrance animation idea to the already-defined `MainShell`/top-nav pattern from `cozinhas-chat-pt` / Le Philot |
| `SpotlightCard` mouse/focus spotlight | Adopt (with theming) | Base interaction model for `GlowCard` and service cards; preserve focus support |
| `SplitText` staged title reveal | Adapt | Use on landing/page headers with toned-down shimmer for readability |
| Layered background glows in `App.tsx` | Adopt | Ambient page glows/background shapes behind content, themed to Gondor gold/elf green/Palantir blue |
| `Waves` background effect | Adapt (limited) | Optional hero/section backdrop for Welcome or page dividers only; not for every page |
| Section-by-section component composition | Adopt | Keep page features broken into focused components under `components/{feature}` |
| Global completion context (`CompletionContext`) | Adapt | Use a lightweight UI/session context only if needed for "visited sections" / demo state hints, not as primary data layer |
| Single-page long-scroll content rhythm | Reject (structure) | Palantir remains route-based multi-page app |
| SOLID theme colors/fonts | Reject | Palantir keeps LOTR visual system from module-05 plan |

## Frontend Information Architecture (Locked)

### App-Level

- Router-based app
- `MainShell` wraps internal pages only
- Landing page is standalone full-bleed experience

### Proposed Frontend Folders (Implementation Target)

```text
src/
  app/
    router.tsx
    providers.tsx
  components/
    layout/
      MainShell.tsx
      Header.tsx
      TopNav.tsx
      MobileNavMenu.tsx
    shared/
      GlowCard.tsx
      StatusBadge.tsx
      AnimatedCounter.tsx
      SectionHeader.tsx
      TexturePanel.tsx
      EmptyState.tsx
      ErrorState.tsx
      LoadingState.tsx
    dashboard/
      MiddleEarthMap.tsx
      ServiceNode.tsx
      LiveMetrics.tsx
      ServiceStatus.tsx
    missions/
      MissionLauncher.tsx
      MissionTracker.tsx
      MissionHistory.tsx
      MissionStatusCard.tsx
      MissionStepper.tsx
    library/
      CacheDemo.tsx
      RateLimitDemo.tsx
      LeaderboardDemo.tsx
      HeroCard.tsx
      RegionCard.tsx
    architecture/
      FlowDiagram.tsx
      RequestTracer.tsx
      TraceTimeline.tsx
      DiagramLegend.tsx
  pages/
    Welcome.tsx
    Dashboard.tsx
    Missions.tsx
    Library.tsx
    Architecture.tsx
  lib/
    api.ts
    polling.ts
    format.ts
    assets.ts
    motion.ts
  hooks/
    usePollingResource.ts
    useReducedMotionPreference.ts
```

## UI System Decisions

### Design Tokens (Theme Direction)

Use module-05 LOTR palette and typography direction; define CSS variables early:

- Backgrounds: dark parchment / earth tones
- Accents: Gondor gold, elven green, Palantir blue, Mordor red
- Typography: readable sans + fantasy display for headings + mono for terminal/code

Do not copy SOLID's palette directly.

### Shared Primitive Strategy (SOLID-Inspired, Palantir-Native)

#### `GlowCard`

- Based on SOLID `SpotlightCard` interaction model
- Must support:
  - keyboard focus spotlight
  - theme color variants
  - reduced-motion fallback (no animated spotlight drift)

#### `AnimatedCounter`

- Use count-up behavior for live metrics and mini-cards
- Freeze animation when values unchanged
- Avoid re-triggering on every poll if value is stable

#### `SectionHeader`

- Optional split/blur/reveal text inspired by SOLID `SplitText`
- Default to readable animation intensity
- Must remain legible under reduced motion and on mobile

### Ambient Effects Policy

Allowed:

- Layered background glows
- Subtle particles/aurora on Welcome
- Mild animated borders for active mission/status emphasis
- Edge/path pulses on architecture diagram

Avoid:

- Constant heavy motion on all pages
- Multiple competing animated backgrounds in same viewport
- Animations that obscure text legibility or cause CPU spikes

## Page-by-Page Frontend Spec Refinements

### Welcome Page

Adopt from `FRONTEND_SAMPLES.md`:

- Hero-first composition
- CTA cluster with staggered entry
- animated text treatment on title/subtitle
- mini-metrics row

SOLID-derived improvement:

- reusable animated header/text primitives instead of one-off motion blocks
- controlled ambient background layering

### Dashboard Page

Module-05 baseline remains primary. Add:

- standardized card shell (`GlowCard`) for all metric panels
- service-node component abstraction for map and diagram reuse
- polling hooks with transition-safe updates

### Missions Page

Add stricter state rendering rules:

- every mission status card renders one of: loading/active/retry/success/failure
- stepper and progress remain deterministic even during polling lag
- batch launch summary state shown separately from individual mission cards

### Library Page

Add UI consistency:

- same `TexturePanel`/`GlowCard` wrappers across cache/rate/leaderboard demos
- region cards use shared image rendering contract (overlay, title placement, fallback)
- leaderboard row animation must be stable across equal scores (tie ordering rule)

### Architecture Page

Add component separation:

- `FlowDiagram` owns layout and SVG rendering
- `RequestTracer` owns trace trigger and data fetch
- `TraceTimeline` owns step list and latency display
- diagram interactions consume a shared node/edge schema from API contract doc

## Frontend State and Data Flow (Decision Complete)

### Local vs Shared State

Use local state by default per page/component.

Shared state is allowed only for:

- global UI preferences (reduced motion override if added)
- session-level "visited pages" or tutorial hints (optional)
- app-wide health snapshot cache (optional optimization)

Do not introduce a heavy global state library for MVP.

### Polling Model

Polling pages:

- Dashboard metrics/health: every 2s
- Mission tracker active missions: every 1-2s while active; pause when none active
- Leaderboard optional refresh: manual + periodic (5-10s) if live mode enabled

Rules:

- Abort stale requests on route change
- Keep last good data visible on transient error
- Render non-blocking error banner instead of clearing the UI
- Use timestamp/meta from API to show freshness if available

### API Client Layer

Implement a typed `lib/api.ts` wrapper with:

- JSON parsing and standardized error handling
- route-specific functions by domain (`missionsApi`, `libraryApi`, `gateApi`, `architectureApi`)
- DTO types imported from a local `types` file generated/maintained from `04_API_CONTRACTS_AND_TYPES.md`

## Accessibility and Usability Requirements

- Keyboard reachable nav and CTAs
- Focus-visible styles on all interactive cards/buttons
- Tooltips have accessible fallback text or visible labels
- Color is not the only status signal (icons/text labels required)
- Reduced-motion support for:
  - title reveals
  - pulsing nodes
  - animated borders
  - leaderboard reorder animations
- Touch-friendly targets on mobile

## Performance Guardrails

- Avoid re-rendering entire dashboard on every poll tick
- Memoization is optional; prefer simple component boundaries first
- Use CSS transforms/opacity for motion where possible
- Avoid heavy WebGL/shader components in MVP unless profiled
- Image assets should be used with sensible sizes and lazy loading when below fold

## Responsive Behavior (Locked Defaults)

### Desktop

- Dashboard: 2-column layout (map + metrics panel)
- Missions: 2-column launcher/tracker
- Library: stacked sections with grid internals
- Architecture: diagram and trace panel side-by-side when space allows

### Mobile

- Top nav collapses to menu or scrollable tabs
- Dashboard map stacks above metrics
- Missions launcher stacks above tracker
- Diagram scales to fit width with simplified labels/legend expansion
- Tooltips convert to tap cards/modal sheet if hover is unavailable

## Frontend Asset Integration Contract (Summary)

All assets from `../PROMPT_ASSETS.md` are mandatory.

Frontend implementation must define a central asset registry (`lib/assets.ts`) listing:

- canonical path
- usage component(s)
- alt text
- loading priority (hero/high/default/lazy)
- fallback behavior

Full mapping is specified in `03_ASSET_COVERAGE_MATRIX.md`.

## Integration with Module-05 References

Keep these established patterns:

- Le Philot API Cuisine navigation pattern (landing + top nav)
- Tailwind + Framer Motion + Lucide frontend stack
- Multi-service dockerized frontend/backend wiring assumptions

Use SOLID only for internal UI artifact ideas and micro-interactions, not for layout/navigation/page architecture.
