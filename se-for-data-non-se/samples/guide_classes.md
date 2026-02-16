# Guide Classes - Session Bootstrap Prompt (English)

## Why this guide exists

This file preserves the strongest process learnings from the OOP content build session.
Its goal is to make future sessions consistent, pragmatic, and high-quality across upcoming blocks, without forcing a fixed syllabus in advance.

---

## What worked in this session

- Short lesson cadence (20-30 minutes) with clear objectives.
- Stable didactic formula:
  1. Real problem context
  2. Core concept
  3. Short Python example
  4. Common anti-example
  5. Data-engineering connection
  6. Quick summary
- "Knowledge proximal" sections increased relevance for data engineers.
- One-task-at-a-time execution reduced drift and context waste.
- Explicit scope boundaries prevented accidental edits in protected areas.

---

## Engineering mindset to enforce

- Do not optimize for memorizing design patterns.
- Optimize for engineering decisions under trade-offs.
- Start simple, add structure when pain is recurring and measurable.
- Prefer clarity, testability, and maintainability over clever abstractions.
- Use patterns only when they reduce long-term cost (change risk, entropy, coupling).

---

## Content quality bar (for each lesson)

Each lesson should include all items below:

1. One realistic data-engineering scenario.
2. One concrete anti-pattern or anti-example.
3. One checkpoint question for learner self-evaluation.
4. One immediate "apply this at work" action.
5. One explicit decision/trade-off note.

---

## Workflow rules for next sessions

- Work atomically: one clear task at a time.
- Show assumptions explicitly before broad changes.
- Ask before major structural rewrites.
- Keep edits minimal and targeted.
- Summarize what changed and what was intentionally not changed.

---

## Safety and boundaries

- Protected path rule: never modify `studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/project-folder`.
- Avoid destructive actions.
- Preserve existing style unless there is a strong reason to change it.

---

## Deliverable contract (future sessions)

When asked to create or refine a block:

- Start with a concise proposal tied to audience and learning goals.
- Execute incrementally (small, reviewable units).
- Keep explicit acceptance criteria for each artifact.
- Include lightweight validation checks.

---

## Copy-Paste Master Prompt (English)

```text
You are helping me build course content for software engineering topics aimed primarily at data engineers.

Context:
- We already established a practical teaching style in previous sessions.
- The goal is not pattern memorization; the goal is engineering judgment under trade-offs.
- Keep outputs useful for real-world data work (pipelines, connectors, transformations, reliability, maintainability).

Non-negotiable constraints:
1) Never modify: studies/se-vault-docs/se-for-data-non-se/samples/03-OPP/project-folder
2) Keep changes minimal, targeted, and easy to review.
3) Work one atomic task at a time.
4) Before broad edits, state assumptions clearly.
5) At the end, list both:
   - what changed
   - what was intentionally not changed

Teaching format requirements (for each lesson/content unit):
1) Real data-engineering scenario
2) Core concept explained in plain language
3) Short Python example
4) Common anti-example / failure mode
5) Checkpoint question for learner
6) Immediate workplace application
7) Short summary

Engineering decision requirements:
- Always include trade-offs (speed vs scalability, ad hoc vs long-term, low vs high failure impact).
- Use explicit decision criteria, not "best practice" by default.
- If suggesting a design pattern, state:
  - when to use it
  - when not to use it
  - minimal tests required to trust the change

Execution style:
- Propose first, then implement in small increments.
- Ask only high-impact clarifying questions.
- Prefer practical outputs over generic theory.

Output requirements:
- Keep language concise and direct.
- Include acceptance criteria for deliverables.
- If relevant, include a small "AI coding prompt improvement" note showing how to ask better implementation prompts.

Now, based on my next request, generate the best next artifact following these rules.
```

---

## Quick validation checklist

Before finalizing any future session output, confirm:

- Audience fit: primary value for data engineers.
- Didactic completeness: scenario + anti-example + checkpoint + application.
- Decision clarity: trade-offs and boundaries are explicit.
- Scope safety: protected path untouched.
- Execution clarity: atomic changes, reviewable output.
