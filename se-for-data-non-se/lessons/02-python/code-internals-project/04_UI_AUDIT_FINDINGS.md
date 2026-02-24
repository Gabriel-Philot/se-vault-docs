# UI Refinement Plan - Findings & Visual Audit

> This section documents all issues found during Playwright UI validation and code review.
> To be used as input for executing `02_UI_REFINEMENT_PLAN.md`.
> **Status**: Findings only - NOT yet executed.

## Playwright Screenshots (Visual Evidence)

All screenshots taken on 2026-02-23 via Playwright MCP after `npm run dev` on `http://localhost:5173`.

| Panel | Screenshot | Key Visual Issues |
|-------|-----------|-------------------|
| Bytes Explorer | [`bytes-panel.png`](bytes-panel.png) | Flat cards, no depth/shadows. ASCII table shows "CT" (truncated control chars). Inputs are bare. No results visible (just forms). |
| Shell & Process | [`shell-panel.png`](shell-panel.png) | Terminal prompt works but plain. Bash startup chain truncated on right ("~/.bash" cut off). Environment Variables section EMPTY (API not running). Process layers are basic flat boxes with no depth. |
| Compiled vs Interpreted | [`compiler-panel.png`](compiler-panel.png) | Split C/Python editors functional. Code is plain monospace text in textareas - no syntax coloring inside editors. Snippet selectors are small buttons. Assembly Output section says "Compile C code to see assembly output" - placeholder. |
| Stack vs Heap | [`memory-panel.png`](memory-panel.png) | Minimal - just C/Python toggle + code editor. No stack/heap columns visible until trace runs. Big empty space below editor. |

## Critical Bugs (Will Break in Production)

### 1. Dynamic Tailwind Classes - Won't Compile
Tailwind CSS statically analyzes class names. Template literals like `` `bg-${color}/10` `` produce classes Tailwind never sees.

| File | Line Pattern | Broken Classes |
|------|-------------|----------------|
| `SnippetSelector.tsx` | `` bg-${color}/10, text-${color}, border-${color}/30 `` | All accent colors |
| `ProcessDiagram.tsx` | `` bg-${color}/20, text-${color}, border-${color}/30 `` | All layer colors |
| `StreamVisualizer.tsx` | `` text-${color} `` | Stream pipe colors |

**Fix**: Replace with static class maps like `{ "ci-green": "bg-ci-green/10 text-ci-green border-ci-green/30" }`.

### 2. AsciiTable `grid-cols-16`
Tailwind only ships grid-cols-1 through grid-cols-12 by default. `grid-cols-16` is undefined.

**Fix**: Add to index.css `@theme` or use inline `style={{ gridTemplateColumns: 'repeat(16, minmax(0, 1fr))' }}`.

## Per-Panel Visual Issues

### Bytes Explorer (`bytes-panel.png`)

**What we see**: Three flat sections stacked vertically. Forms with basic inputs. ASCII table with tiny "CT" labels for control characters.

| Component | Issue | Severity |
|-----------|-------|----------|
| BytesExplorer.tsx | No card containers around sections, flat backgrounds | HIGH |
| BytesExplorer.tsx | Input fields have no shadows or depth | MEDIUM |
| BytesExplorer.tsx | Section headings (`text-lg font-semibold`) lack visual weight | MEDIUM |
| AsciiTable.tsx | grid-cols-16 breaks layout (see critical bug #2) | CRITICAL |
| AsciiTable.tsx | Control chars show "CT" - truncated, should show "CTL" or code | HIGH |
| AsciiTable.tsx | No glow hover effect, no selected state ring | MEDIUM |
| AsciiTable.tsx | No card container wrapping the grid | MEDIUM |
| MultiBaseDisplay.tsx | Byte blocks too cramped (p-2), all same bg-ci-surface | MEDIUM |
| SizeCompare.tsx | Comparison bars lack depth, no gradient fills | MEDIUM |
| EncodingCompare.tsx | Byte cards too small, no clear multibyte grouping | LOW |

### Shell & Process (`shell-panel.png`)

**What we see**: Terminal input at top, output placeholder, bash chain with truncated last items, empty env vars, stream pipes showing "(empty)", process layers as plain stacked boxes.

| Component | Issue | Severity |
|-----------|-------|----------|
| ShellSimulator.tsx | Terminal prompt area has no scan-line effect or depth | HIGH |
| ShellSimulator.tsx | No blinking cursor animation | MEDIUM |
| BashStartupChain.tsx | Chain truncated - "~/.bashrc" and "Shell Ready" cut off on right | HIGH |
| BashStartupChain.tsx | Arrow separators are plain text `→`, should be styled connectors | MEDIUM |
| EnvVariablesPanel.tsx | Section is completely empty when API not running - no fallback | HIGH |
| StreamVisualizer.tsx | Dynamic Tailwind classes (see critical bug #1) | CRITICAL |
| StreamVisualizer.tsx | "(empty)" state too plain | LOW |
| ProcessDiagram.tsx | Dynamic Tailwind classes (see critical bug #1) | CRITICAL |
| ProcessDiagram.tsx | Layers are flat boxes, no depth/glow/3D effect | HIGH |
| ProcessDiagram.tsx | No animated arrows between layers | MEDIUM |
| FilesystemTree.tsx | Not visible in screenshot (needs API data) | N/A |
| UserCompare.tsx | Not visible in screenshot (needs API data) | N/A |
| PipeVisualizer.tsx | Basic text arrows between command boxes | MEDIUM |

### Compiled vs Interpreted (`compiler-panel.png`)

**What we see**: Split layout works well. C on left with optimization dropdown + Compile button. Python on right with Interpret button. Snippet selectors as small bordered buttons. Code in plain textareas with line numbers. Assembly Output placeholder below.

| Component | Issue | Severity |
|-----------|-------|----------|
| CodeEditor.tsx | Plain textarea - no syntax highlighting colors | HIGH |
| CodeEditor.tsx | No border between line numbers and code area | MEDIUM |
| CodeEditor.tsx | No focus ring on textarea | MEDIUM |
| CompileView.tsx | No card/panel wrapper around editor sections | MEDIUM |
| CompileView.tsx | Output sections have no headers or visual separation | MEDIUM |
| SnippetSelector.tsx | Dynamic Tailwind classes (see critical bug #1) | CRITICAL |
| SnippetSelector.tsx | Buttons too small, no active/pressed visual state | MEDIUM |
| PipelineAnimation.tsx | Not visible until compile runs, no default state shown | HIGH |
| PipelineAnimation.tsx | Named "Animation" but has no animations | HIGH |
| BytecodeView.tsx | Table headers lack background color | LOW |
| BytecodeView.tsx | No alternating row colors | LOW |
| TimingComparison.tsx | Not visible until results available | N/A |
| AssemblyView.tsx | Shows placeholder text, no card wrapper | LOW |

### Stack vs Heap (`memory-panel.png`)

**What we see**: C/Python toggle buttons at top left. Trace button. Code editor with malloc_demo code. Everything below the editor is empty (no trace started).

| Component | Issue | Severity |
|-----------|-------|----------|
| StackHeapVisualizer.tsx | Massive empty space when no trace running | HIGH |
| StackHeapVisualizer.tsx | No visual preview/placeholder for stack+heap columns | HIGH |
| StackHeapVisualizer.tsx | Language toggle buttons are plain, need more visual weight | MEDIUM |
| MemoryCodeEditor.tsx | Line highlighting too subtle (bg-ci-blue/20) | MEDIUM |
| MemoryCodeEditor.tsx | No border between line numbers and code | MEDIUM |
| StepControls.tsx | Range slider is browser-default styling | MEDIUM |
| StepControls.tsx | Buttons too small (p-1.5) | LOW |
| StackFrameComponent.tsx | (Not visible until trace) Inactive frames too plain | MEDIUM |
| HeapBlockComponent.tsx | (Not visible until trace) Freed blocks too transparent | LOW |
| PointerArrow.tsx | Just text spans with `→`, no SVG arrows | MEDIUM |
| RefCountBadge.tsx | text-[10px] too small to read | LOW |

## Global Issues (All Panels)

| Category | Issue | Files Affected |
|----------|-------|---------------|
| **No focus states** | Interactive elements lack visible focus rings for keyboard navigation | ALL buttons, inputs, selects |
| **No shadows/depth** | Entire app is flat - no box-shadow anywhere except StackFrameComponent | ALL panel containers |
| **Inconsistent spacing** | p-3, p-4, p-6 used arbitrarily across components | ALL components |
| **Too-small text** | `text-[10px]` used in RefCountBadge, StackFrameComponent, others | 4+ files |
| **No gradients** | All backgrounds are solid colors, no subtle gradients | ALL panels |
| **No ambient effects** | No radial glows, no grid pattern on backgrounds | AppShell, all panels |
| **Missing hover transitions** | Many interactive elements have no `transition-*` classes | Buttons, cards |
| **Browser-default form elements** | Range slider, select dropdowns use browser defaults | StepControls, BytesExplorer |

## New Dependencies Needed

| Package | Purpose | Version |
|---------|---------|---------|
| `framer-motion` | Spring animations, AnimatePresence, layoutId tabs | ^11.x |
| `@fontsource/jetbrains-mono` | Self-hosted mono font (no Google Fonts CDN) | ^5.x |
| `@fontsource/inter` | Self-hosted sans font | ^5.x |

LetterGlitch for landing page:
```bash
npx shadcn@latest add @react-bits/LetterGlitch-JS-CSS
```

## New Components to Create

| Component | Purpose |
|-----------|---------|
| `shared/GlassPanel.tsx` | Backdrop blur + accent gradient card wrapper (replaces bare divs) |
| `shared/PageTitleBlock.tsx` | Eyebrow + title + subtitle + decorative gradient line |
| `landing/LandingPage.tsx` | Hero page with LetterGlitch background + navigation cards |
| `landing/LetterGlitch.tsx` | Matrix-like canvas background (from reactbits) |
| `hooks/useReducedMotion.ts` | Wrapper around framer-motion's useReducedMotion |

## New CSS Animations for index.css

```css
/* To add to @theme or as keyframes */
scanLine: translateY(-100%) → translateY(100vh) over 4s linear infinite
shimmer: backgroundPosition -200% → 200% over 2s linear infinite
fadeUp: opacity 0 + translateY(12px) → opacity 1 + translateY(0) over 0.5s
cursorBlink: opacity 1→0→1 step-end 1s infinite
glowPulse: boxShadow 4px→12px→4px 2s ease-in-out infinite
```

## Execution Strategy (For When We Execute)

**Batch 1 - Foundation** (sequential):
- Install deps (framer-motion, fontsource, reactbits LetterGlitch)
- Fix critical bugs (dynamic Tailwind classes, grid-cols-16)
- Add new index.css animations
- Create GlassPanel, PageTitleBlock, useReducedMotion

**Batch 2 - Layout** (sequential):
- Landing page + LetterGlitch
- TopNav/TabNav redesign with layoutId animated pill
- AppShell ambient effects (grid pattern, radial gradients)

**Batch 3 - Panel Refinements** (parallelizable - 2 agents):
- Agent A: Bytes panel + Shell panel refinements
- Agent B: Compiler panel + Memory panel refinements

**Batch 4 - Validation**:
- Playwright re-test all panels + landing page
- Screenshot comparison with originals

## Reference: Original Screenshots Location

Files saved during Playwright validation session:
- `bytes-panel.png` - Bytes Explorer (before refinement)
- `shell-panel.png` - Shell & Process (before refinement)
- `compiler-panel.png` - Compiled vs Interpreted (before refinement)
- `memory-panel.png` - Stack vs Heap (before refinement)
