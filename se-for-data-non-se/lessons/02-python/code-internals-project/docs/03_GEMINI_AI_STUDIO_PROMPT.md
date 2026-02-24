# Google AI Studio Prompt (UI-only, copy/paste)

```text
<objective>
Generate a single consolidated UI/UX specification (page-by-page) for the project "Code Internals Explorer" by merging:
1) a Core Plan (features, architecture, endpoints, components)
2) a UI Refinement Plan (visual theme, reusable UI patterns, animations, advanced interaction polish)

Important:
- Do not use persona.
- Do not redesign backend architecture or APIs.
- Do not change core functionality.
- Focus only on UI/UX: pages, layouts, visual hierarchy, reusable components, states, interactions, animations, responsiveness, and accessibility.
- Write the answer in English.
- Assume current design expectations are late February 2026 (modern but practical, implementation-ready).
</objective>

<project_context>
This is an educational interactive app with 4 panels that teach computing concepts:
- Bytes / encodings / memory representation
- Shell / Linux / processes / streams / pipes
- Compiled vs interpreted execution
- Stack vs heap memory behavior

Tech stack (context only, to keep UI spec realistic):
- Frontend: React 19 + TypeScript + Vite + Tailwind CSS
- Backend: FastAPI
- Communication: REST + SSE (Server-Sent Events)
- Execution environment: secure Docker sandboxes

Expected app flow:
- Landing / Welcome page first
- Persistent top navigation
- 4 main panel pages

Non-regression rule:
- The refinement plan is layered on top of the core plan.
- Core functionality remains unchanged; refinement improves visuals, interactions, and motion.
</project_context>

<visual_theme>
Theme: "Code Matrix" (technical cyberpunk terminal aesthetic).

Visual direction:
- Deep dark background (near-black blue)
- Glass-like panels (subtle blur, subtle borders)
- Accent colors by domain:
  - Bytes = cyan
  - Shell/Process = green
  - Compiler = amber
  - Memory = blue
  - Errors / stderr = red
  - Python-specific highlight can use purple when relevant (secondary accent only)
- Typography:
  - Clean sans-serif for UI copy
  - Monospace for code, terminal, bytes, addresses, metrics
- Global subtle grid background
- Per-page radial glow/gradient accents
- Landing page background uses a LetterGlitch-style animated character canvas

Design rules:
- Technical, intentional, readable, high-signal UI
- Strong contrast and legibility first
- Avoid vague style language (e.g., "make it modern") without implementation detail
- No persona-based framing
</visual_theme>

<scope_ui_pages_and_globals>
Describe the UI for:
1. Landing Page (Welcome)
2. Page / Panel 1: Bytes Explorer
3. Page / Panel 2: Shell & Process Explorer
4. Page / Panel 3: Compiled vs Interpreted
5. Page / Panel 4: Stack vs Heap Visualizer

Also describe global/shared UI concerns:
- App shell structure
- Sticky TopNav with active state
- PageTitleBlock pattern (eyebrow + title + subtitle + decorative rule)
- GlassPanel reusable container pattern
- Shared states (loading / empty / error / success)
- Responsiveness (mobile / tablet / desktop)
- Accessibility and reduced motion
- Motion consistency patterns across the app
</scope_ui_pages_and_globals>

<core_features_that_must_be_reflected_in_the_ui>
Panel 1 - Bytes Explorer:
- Interactive input with type detection (int, float, string, char)
- Multi-base display (binary / hex / decimal)
- C vs Python size comparison
- Interactive ASCII table (16x8)
- UTF-8 vs ASCII encoding comparison

Panel 2 - Shell & Process Explorer:
- Linux filesystem tree with permissions/ownership cues
- Simulated terminal with a safe command subset
- User switching (alice / bob / root)
- Stream visualization (stdin / stdout / stderr)
- Layer diagram: User → Shell → Kernel → Hardware
- Pipe visualization
- Environment variables + $PATH search visualization

Panel 3 - Compiled vs Interpreted:
- Split view for C vs Python
- C compilation pipeline by stages
- Python interpretation/bytecode/PVM pipeline
- Execution metrics (timing, sizes, etc.)
- Editors + snippets + outputs

Panel 4 - Stack vs Heap:
- Dual stack/heap memory visualization
- Step-by-step controls (play/pause/step/reset/speed)
- Stack frames
- Heap allocations / frees
- Pointer arrows from stack to heap
- C vs Python mode (including Python refcount visibility)
</core_features_that_must_be_reflected_in_the_ui>

<ui_refinement_requirements_basic_and_advanced>
Global reusable patterns:
- GlassPanel with subtle border, blur, and accent-tinted gradient layer
- Sticky TopNav with animated active pill/tab indicator
- PageTitleBlock pattern reused across pages
- Landing navigation cards for the 4 panels

Panel-specific refinements:

Panel 1 (Bytes / cyan):
- Bit blocks with animated state changes
- C vs Python size comparison as "memory tanks" / fill-level visual containers
- ASCII table cells with hover glow
- Terminal-style hex dump layout (offset / hex / ASCII columns)

Panel 2 (Shell / green):
- Filesystem tree with lock icons, permission cues, ownership states, dotfiles styling
- User comparison cards (user vs root)
- Bash startup chain as a visual stepper/timeline
- Environment variables panel + animated $PATH search sequence
- Terminal scanline overlay, blinking cursor, typewriter-style streamed output
- Pipe visualization with moving particles/data chunks
- Layer diagram with nodes that light up during command execution flow

Panel 3 (Compiler / amber):
- Horizontal pipeline stepper with states: pending / active / done / error
- Source-to-bytecode/opcode correspondence (visual diff/highlight mapping)
- Metric cards with animated counters

Panel 4 (Memory / blue):
- Stack frames with spring-based push/pop transitions
- Heap blocks with alloc/free animations (materialize/dissolve)
- Refined step controls (buttons + speed + step counter)
- Pointer arrows as curved SVG connectors with hover emphasis

Ambient effects (advanced):
- Global background grid across app shell
- Per-panel radial accent glow mapped to panel color
- Landing page uses LetterGlitch character-canvas background (replaces aurora/blob style)
- Ambient effects must never reduce content readability

Animation and motion system (advanced):
- Consolidate motion patterns across the app (shared rules, not ad hoc)
- Use consistent motion semantics:
  - layout transitions for nav/tab state changes
  - spring motion for stack/heap/block transitions
  - staggered reveal for repeated items (bits, table cells, opcodes)
  - hover lift/hover glow for cards and actionable cells
- Clearly define which interactions animate and which should remain instant

Reduced motion (advanced and mandatory):
- Every animation must respect prefers-reduced-motion
- Provide explicit fallbacks:
  - no particle movement
  - no typewriter delay
  - static backgrounds (or motion disabled)
  - instant transitions instead of spring/stagger animations

Advanced UI behavior expectations (for implementation realism):
- Mention UI-level hook responsibilities (not full code), including:
  - SSE stream consumption for terminal output
  - step execution state management for memory playback
  - polling pattern for refreshing visual state where needed
- Describe how these behaviors affect UI states and transitions
- Do not write full hook implementations

Assets and dependency constraints (UI planning):
- Prefer CSS/SVG/Framer Motion style effects over heavy bitmap assets
- Minimal asset requirements (logo / optional patterns)
- Note likely UI dependencies only as implementation assumptions (e.g., motion/icons/fonts), without turning the answer into package setup instructions

Refinement sequencing (advanced):
- Include a recommended order for applying visual refinements on top of the core UI:
  1) base theme
  2) reusable glass/title/nav primitives
  3) landing page
  4) per-panel refinements
  5) ambient effects
  6) accessibility/reduced-motion validation
</ui_refinement_requirements_basic_and_advanced>

<task>
Produce a consolidated, implementation-ready UI/UX specification that describes only the interface.

The output must:
- merge core + refinement plans without conflicts
- preserve all core features
- convert the refinement plan into a practical screen/component specification for frontend work
- make layout, visual hierarchy, states, interactions, motion, and responsiveness explicit
- clearly separate global/shared patterns from page-specific decisions

Do NOT include:
- persona
- generic prompt-engineering advice
- full code implementations
- backend/API redesign
- scope expansion with new features
</task>

<required_output_format>
Follow EXACTLY this structure:

1. Visual Direction Summary (short)
2. Global Application Structure
3. Global Reusable Components
4. Global Motion and Interaction System
5. Page 0: Landing Page
6. Page 1: Bytes Explorer
7. Page 2: Shell & Process Explorer
8. Page 3: Compiled vs Interpreted
9. Page 4: Stack vs Heap Visualizer
10. Shared States (loading / empty / error / success)
11. Responsiveness (mobile / tablet / desktop)
12. Accessibility and Reduced Motion
13. UI Behavior Notes (SSE / step playback / polling impact on UI)
14. Refinement Rollout Order (core → advanced refinement)
15. Final Consistency Checklist (core vs refinement)

For each page section (Pages 0-4), use these exact subsections:
- Page Goal
- Layout (macro structure)
- Visual Sections / Blocks
- Primary Components
- Interactions and Microinteractions
- Visual States (idle/loading/error/success/empty)
- Responsiveness
- Accessibility
- Core-Consistency Notes
</required_output_format>

<quality_constraints>
- Be concrete and operational: describe what appears on screen and how it behaves.
- Avoid vague phrases without specifics.
- Do not invent features outside the provided scope.
- If there is any conflict between core and refinement, preserve core behavior and apply refinement as a visual/interaction layer only.
- Clearly distinguish:
  - reusable component
  - global visual pattern
  - page-specific UI decision
  - motion system rule
- Maintain strict color consistency by panel (cyan/green/amber/blue).
- Keep the specification implementation-ready for a frontend team.
</quality_constraints>

<success_criteria>
The final answer should allow a frontend engineer/designer to implement the UI pages and shared patterns without needing to reread the original two plans to understand:
- what each page contains
- how each page is visually structured
- how components behave
- which advanced refinements are mandatory vs optional polish
- how motion/accessibility rules apply across the app
</success_criteria>
```
