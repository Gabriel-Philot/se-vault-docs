# Decisions and Assumptions Log

## Purpose

This file records planning decisions locked during the Codex plan-pack work so implementers do not need to re-decide core behaviors.

## Locked Decisions

### Scope and Output

1. The work product is a planning package only, created entirely inside `codex_plan_shot/`.
2. No files outside `codex_plan_shot/` are modified as part of this task.
3. The pack expands the existing module-05 plan rather than replacing it in place.

### Source Precedence (When Docs Differ)

1. `../PLAN.md` for feature intent and page scope
2. `../PROMPT_ASSETS.md` for image asset inventory and intended semantics
3. `../FRONTEND_SAMPLES.md` for visual inspiration and interaction options
4. `../REFERENCES.md` for implementation patterns from prior projects
5. `../../04-APIS/cozinhas-chat-pt` as the primary frontend layout/navigation reference when clarifying page UX patterns
6. SOLID frontend project for selective internal UI artifact patterns only (micro-interactions, card internals, motion primitives)

### SOLID Frontend Reuse Policy

1. Use SOLID frontend as a selective reference only.
2. Reuse only internal UI artifact patterns (component internals, motion primitives, card interaction patterns, micro-interactions).
3. Do not reuse SOLID content/sections/theme as product structure.
4. Do not pull backend assumptions from the SOLID project.
5. Do not use SOLID as the source for layout/navigation/page architecture; use `cozinhas-chat-pt` / Le Philot for that.

### Navigation and Page Architecture

1. Keep module-05 navigation model: landing page + internal sticky top nav.
2. No sidebar in the primary Palantir UX.
3. Internal routes remain:
   - `/dashboard`
   - `/missoes`
   - `/biblioteca`
   - `/arquitetura`

### API Contract Conventions

1. JSON response envelope uses `{ data, meta }` or `{ error, meta }`.
2. Mission statuses use explicit enum values:
   - `PENDING`, `STARTED`, `PROCESSING`, `RETRY`, `SUCCESS`, `FAILURE`
3. Polling endpoints should preserve stable shapes even when degraded.
4. Rate limit endpoint must expose remaining/reset details and headers.

### Frontend Engineering Defaults

1. Use reusable shared components for visual consistency (`GlowCard`, `StatusBadge`, etc.).
2. Motion supports learning feedback, not just decoration.
3. `prefers-reduced-motion` support is required.
4. Keep local state by default; avoid heavy global state libraries for MVP.

### Asset Policy

1. All image assets listed in `../PROMPT_ASSETS.md` are mandatory (30/30).
2. Every asset must have at least one required usage and a fallback behavior.
3. Asset mapping source of truth is `03_ASSET_COVERAGE_MATRIX.md`.

## Assumptions (Explicit Defaults)

1. The implementer will create the actual app in the existing `project/` area, not in `codex_plan_shot/`.
2. Image generation may happen before or during implementation, but all names/paths follow `PROMPT_ASSETS.md`.
3. Backend persistence details may vary (e.g., how mission history snapshots are stored), as long as API contracts are preserved.
4. Frontend animation libraries are limited to the repo-planned stack (Framer Motion + CSS/Tailwind) unless intentionally expanded later.
5. The frontend may use placeholder/fallback visuals during early phases, but final acceptance requires real mapped assets.

## Tradeoffs Chosen

### Why Not Mirror the SOLID Frontend More Closely?

- Palantir already has a strong route-based IA and learning flow in module-05.
- The `cozinhas-chat-pt` / Le Philot pattern already provides the correct navigation/layout baseline.
- Directly mirroring SOLID's single-page structure would conflict with the module-05 plan.
- Selective reuse gives implementation quality gains without scope drift.

### Why Add a Strict API Envelope?

- Prevents frontend/backend drift during parallel work
- Makes polling/error handling simpler and consistent
- Supports clearer debugging and UI fallback behavior

### Why Enforce 30/30 Asset Mapping in Planning?

- The user explicitly requested all assets be used
- Avoids "optional later" asset omissions
- Makes frontend implementation and review objective

## Open Questions

No high-impact open questions remain for the planning package itself.

Possible implementation-time choices (low impact, can be decided by implementer):

- exact animation presets/easing values
- whether leaderboard refresh is manual-only or periodic
- whether trace endpoint returns partial traces on dependency failure vs hard fail

These are low-risk because the contracts and UX expectations are already defined.
