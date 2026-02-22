# Source Traceability Matrix

## Summary

This matrix shows where the plan-pack requirements came from and where they are captured in the new docs.

Sources used:

- `../../04-APIS/cozinhas-chat-pt` (primary frontend layout/navigation reference)
- `../PLAN.md`
- `../REFERENCES.md`
- `../FRONTEND_SAMPLES.md`
- `../PROMPT_ASSETS.md`
- `../../03-OPP/solid_project/solid-refactory` (internal UI artifact patterns only)

## Traceability Matrix

| Requirement / Decision | Primary Source | Secondary Source(s) | Captured In |
|---|---|---|---|
| Palantir integrated project concept and LOTR metaphor mapping | `../PLAN.md` | none | `01_MASTER_PLAN.md` |
| Core stack (React/FastAPI/Nginx/Redis/Postgres/Celery/Docker) | `../PLAN.md` | `../REFERENCES.md` | `01_MASTER_PLAN.md` |
| 7-service compose topology | `../PLAN.md` | `../REFERENCES.md` | `01_MASTER_PLAN.md`, `05_IMPLEMENTATION_PHASES_AND_TASKS.md` |
| Route model (landing + top nav, no sidebar) | `../PLAN.md` | `../FRONTEND_SAMPLES.md`, `../REFERENCES.md` (Le Philot pattern) | `01_MASTER_PLAN.md`, `02_FRONTEND_REFERENCE_SYNTHESIS.md` |
| Page set (Welcome, Dashboard, Missions, Library, Architecture) | `../PLAN.md` | `../FRONTEND_SAMPLES.md` | `01_MASTER_PLAN.md`, `06_TESTS_AND_ACCEPTANCE.md` |
| Page-specific feature requirements | `../PLAN.md` | `../FRONTEND_SAMPLES.md` | `01_MASTER_PLAN.md`, `05_IMPLEMENTATION_PHASES_AND_TASKS.md`, `06_TESTS_AND_ACCEPTANCE.md` |
| LOTR visual theme and palette direction | `../PLAN.md` | `../FRONTEND_SAMPLES.md` | `01_MASTER_PLAN.md`, `02_FRONTEND_REFERENCE_SYNTHESIS.md` |
| Image asset inventory and intended semantics | `../PROMPT_ASSETS.md` | `../PLAN.md` | `03_ASSET_COVERAGE_MATRIX.md` |
| Requirement to use all image assets | User instruction + `../PROMPT_ASSETS.md` inventory | `../PLAN.md` image integration sections | `03_ASSET_COVERAGE_MATRIX.md`, `07_DECISIONS_AND_ASSUMPTIONS.md`, `06_TESTS_AND_ACCEPTANCE.md` |
| API endpoint families and paths | `../PLAN.md` | `../REFERENCES.md` (patterns) | `04_API_CONTRACTS_AND_TYPES.md`, `01_MASTER_PLAN.md` |
| Gunicorn worker PID visibility concept | `../REFERENCES.md` (practice 01) | `../PLAN.md` gate endpoints | `04_API_CONTRACTS_AND_TYPES.md`, `06_TESTS_AND_ACCEPTANCE.md` |
| Redis cache/rate-limit/leaderboard patterns | `../REFERENCES.md` (practice 02) | `../PLAN.md` Library page/endpoints | `04_API_CONTRACTS_AND_TYPES.md`, `05_IMPLEMENTATION_PHASES_AND_TASKS.md` |
| Celery task progress + retry patterns | `../REFERENCES.md` (practice 03) | `../PLAN.md` Missions page/endpoints | `04_API_CONTRACTS_AND_TYPES.md`, `05_IMPLEMENTATION_PHASES_AND_TASKS.md`, `06_TESTS_AND_ACCEPTANCE.md` |
| Le Philot frontend navigation/layout reference | `../REFERENCES.md` section 4 | `../FRONTEND_SAMPLES.md` | `02_FRONTEND_REFERENCE_SYNTHESIS.md`, `01_MASTER_PLAN.md` |
| Frontend component inspiration list (ReactBits / 21st.dev) | `../FRONTEND_SAMPLES.md` | none | `02_FRONTEND_REFERENCE_SYNTHESIS.md` (as inspiration constraints, not hard deps) |
| Need for polished but controlled animation system | `../FRONTEND_SAMPLES.md` | SOLID frontend patterns | `02_FRONTEND_REFERENCE_SYNTHESIS.md`, `07_DECISIONS_AND_ASSUMPTIONS.md` |
| Top nav pattern (landing + internal top nav baseline) | `../../04-APIS/cozinhas-chat-pt` | `../REFERENCES.md` section 4, `../PLAN.md` `MainShell` requirement | `02_FRONTEND_REFERENCE_SYNTHESIS.md`, `01_MASTER_PLAN.md` |
| Top nav entrance micro-animation idea (optional) | SOLID `Navbar.tsx` | `../../04-APIS/cozinhas-chat-pt` top nav baseline | `02_FRONTEND_REFERENCE_SYNTHESIS.md` |
| Reusable spotlight card interaction pattern | SOLID `src/components/ui/spotlight-card.tsx` | `../FRONTEND_SAMPLES.md` card inspirations | `02_FRONTEND_REFERENCE_SYNTHESIS.md` |
| Animated title split/reveal pattern | SOLID `src/components/ui/split-text.tsx` | `../FRONTEND_SAMPLES.md` text animation suggestions | `02_FRONTEND_REFERENCE_SYNTHESIS.md` |
| Layered ambient glows behind app content | SOLID `src/App.tsx` | `../FRONTEND_SAMPLES.md` backgrounds | `02_FRONTEND_REFERENCE_SYNTHESIS.md` |
| Lightweight global UI progress/context pattern | SOLID `src/context/CompletionContext.tsx` | none | `02_FRONTEND_REFERENCE_SYNTHESIS.md` (adapted, optional) |
| Original phased implementation order | `../PLAN.md` | none | `05_IMPLEMENTATION_PHASES_AND_TASKS.md` (expanded) |
| Verification checklist baseline | `../PLAN.md` | none | `06_TESTS_AND_ACCEPTANCE.md` (expanded) |
| Multi-agent workflow suggestion | `../PLAN.md` | none | `05_IMPLEMENTATION_PHASES_AND_TASKS.md` |

## SOLID Frontend Influence Boundaries (Explicit)

Used:

- frontend code organization patterns
- reusable animated UI primitive patterns
- micro-animation ideas that may be applied to existing Palantir UI elements (including nav entrance)
- ambient visual layering approach

Not used:

- SOLID course content/sections
- single-page content IA
- SOLID theme/palette/branding
- any backend/runtime behavior

## Completeness Checks

- Module-05 core concept preserved: yes
- Module-05 page scope preserved: yes
- Module-05 references incorporated: yes
- SOLID frontend selectively integrated: yes
- Asset inventory fully mapped elsewhere: yes (`03_ASSET_COVERAGE_MATRIX.md`)
