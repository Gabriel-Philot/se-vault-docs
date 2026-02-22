# Palantir Codex Plan Pack

Planning-only package for the module 05 integrated project ("Palantir").

This folder consolidates and refines the existing project pre-plan using these read-only sources:

- `../PLAN.md`
- `../REFERENCES.md`
- `../FRONTEND_SAMPLES.md`
- `../PROMPT_ASSETS.md`
- `../../../03-OPP/solid_project/solid-refactory` (frontend patterns only)

## Scope Rules

- Create and edit files only inside `codex_plan_shot/`
- Do not modify any file outside this folder
- This pack is implementation-ready planning, not code scaffolding

## Pack Contents

1. `plan/01_MASTER_PLAN.md` - consolidated project plan
2. `plan/02_FRONTEND_REFERENCE_SYNTHESIS.md` - frontend design/system synthesis + SOLID UI artifact selective reuse
3. `plan/03_ASSET_COVERAGE_MATRIX.md` - mandatory usage map for all image assets (30/30)
4. `plan/04_API_CONTRACTS_AND_TYPES.md` - backend/frontend contracts and DTOs
5. `plan/05_IMPLEMENTATION_PHASES_AND_TASKS.md` - detailed execution breakdown and dependencies
6. `plan/06_TESTS_AND_ACCEPTANCE.md` - validation, edge cases, acceptance gates
7. `plan/07_DECISIONS_AND_ASSUMPTIONS.md` - locked choices, defaults, tradeoffs
8. `plan/08_SOURCE_TRACEABILITY.md` - requirement-to-source traceability matrix
9. `plan/TASK_JOURNAL.md` - live execution/task journal

## Suggested Use Order

1. Read `plan/01_MASTER_PLAN.md`
2. Lock frontend behavior with `plan/02_FRONTEND_REFERENCE_SYNTHESIS.md`
3. Enforce all images with `plan/03_ASSET_COVERAGE_MATRIX.md`
4. Build API/frontend contracts from `plan/04_API_CONTRACTS_AND_TYPES.md`
5. Execute implementation using `plan/05_IMPLEMENTATION_PHASES_AND_TASKS.md`
6. Validate against `plan/06_TESTS_AND_ACCEPTANCE.md`
7. Check rationale in `plan/07_DECISIONS_AND_ASSUMPTIONS.md`
8. Audit completeness with `plan/08_SOURCE_TRACEABILITY.md`
9. Track progress in `plan/TASK_JOURNAL.md`

## Notes

- "Palantir" is written without accent in this plan pack for ASCII consistency.
- Existing route labels/names from the lesson may remain in Portuguese where useful (for learner-facing UI).
