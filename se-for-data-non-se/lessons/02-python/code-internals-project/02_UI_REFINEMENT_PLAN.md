# Code Internals Explorer - UI Refinement Plan

> Advanced visual refinement inspired by Palantir (codex_plan_shot), adapted to the "Code Matrix" theme.

## Prerequisite

This plan assumes that `01_CORE_PLAN.md` has already been implemented with a basic functional UI. The refinements described here are applied **on top of** the core implementation, without altering functionality - only visuals and animations.

---

## Visual Theme: "Code Matrix"

Dark cyberpunk/terminal aesthetic with green (terminal), blue (memory), amber (compilation), and red (errors) tones.

### Custom Tailwind Palette

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ci: {
          bg: "#0a0e14",        // deep background (near-black blue)
          panel: "#141a22",     // elevated panels
          surface: "#1c2333",   // interactive surface (hover, cards)
          border: "#2d3548",    // subtle borders
          green: "#39d353",     // terminal / success (Matrix green)
          blue: "#58a6ff",      // memory / info
          amber: "#d4a72c",     // warnings / compilation
          red: "#f85149",       // errors / stderr
          cyan: "#56d4dd",      // bytes / hex values
          purple: "#bc8cff",    // Python-specific highlights
          text: "#c9d1d9",      // primary text
          muted: "#6e7681",     // secondary text
          dim: "#484f58",       // tertiary text / disabled
        },
      },
      fontFamily: {
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "grid-pattern":
          "linear-gradient(rgba(45,53,72,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(45,53,72,0.04) 1px, transparent 1px)",
        "radial-green": "radial-gradient(ellipse at 50% 0%, rgba(57,211,83,0.08) 0%, transparent 60%)",
        "radial-blue": "radial-gradient(ellipse at 50% 0%, rgba(88,166,255,0.08) 0%, transparent 60%)",
        "radial-cyan": "radial-gradient(ellipse at 50% 0%, rgba(86,212,221,0.08) 0%, transparent 60%)",
        "radial-amber": "radial-gradient(ellipse at 50% 0%, rgba(212,167,44,0.08) 0%, transparent 60%)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
      animation: {
        "scan-line": "scanLine 4s linear infinite",
        shimmer: "shimmer 2s linear infinite",
        "fade-up": "fadeUp 0.5s ease-out",
        "cursor-blink": "cursorBlink 1s step-end infinite",
        "glow-pulse": "glowPulse 2s ease-in-out infinite",
        "count-up": "countUp 1s ease-out",
      },
      keyframes: {
        scanLine: {
          "0%": { transform: "translateY(-100%)" },
          "100%": { transform: "translateY(100vh)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        cursorBlink: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0" },
        },
        glowPulse: {
          "0%, 100%": { boxShadow: "0 0 4px currentColor" },
          "50%": { boxShadow: "0 0 12px currentColor" },
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### Global CSS

```css
/* src/index.css */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap");

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-ci-bg text-ci-text font-sans antialiased;
  }

  ::selection {
    @apply bg-ci-green/20 text-ci-green;
  }

  /* Custom scrollbar */
  ::-webkit-scrollbar {
    @apply w-1.5;
  }
  ::-webkit-scrollbar-track {
    @apply bg-transparent;
  }
  ::-webkit-scrollbar-thumb {
    @apply bg-ci-border rounded-full;
  }
  ::-webkit-scrollbar-thumb:hover {
    @apply bg-ci-muted;
  }
}

/* Global background grid */
.bg-grid {
  background-image:
    linear-gradient(rgba(45, 53, 72, 0.04) 1px, transparent 1px),
    linear-gradient(90deg, rgba(45, 53, 72, 0.04) 1px, transparent 1px);
  background-size: 24px 24px;
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Visual Components

### 1. GlassPanel

Equivalent to the Palantir glass-panel. Main container for each section.

```tsx
// components/shared/GlassPanel.tsx
import { motion } from "framer-motion";

interface GlassPanelProps {
  children: React.ReactNode;
  accent?: "green" | "blue" | "cyan" | "amber" | "red";
  className?: string;
}

export function GlassPanel({ children, accent = "blue", className }: GlassPanelProps) {
  const accentGradients = {
    green: "from-ci-green/5 to-transparent",
    blue: "from-ci-blue/5 to-transparent",
    cyan: "from-ci-cyan/5 to-transparent",
    amber: "from-ci-amber/5 to-transparent",
    red: "from-ci-red/5 to-transparent",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`
        relative rounded-xl
        bg-ci-panel/80 backdrop-blur-md
        border border-ci-border/50
        shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]
        bg-gradient-to-b ${accentGradients[accent]}
        ${className ?? ""}
      `}
    >
      {children}
    </motion.div>
  );
}
```

**Usage per panel:**
- Bytes Explorer: `accent="cyan"`
- Shell Explorer: `accent="green"`
- Compiler: `accent="amber"`
- Memory: `accent="blue"`

### 2. PageTitleBlock

Reuses the Palantir pattern for section titles.

```tsx
// components/shared/PageTitleBlock.tsx
import { motion } from "framer-motion";

interface PageTitleBlockProps {
  eyebrow: string;     // e.g., "PANEL 01"
  title: string;       // e.g., "Bytes Explorer"
  subtitle?: string;   // e.g., "Bits, Bytes & Languages"
  accentColor?: string; // e.g., "ci-cyan"
}

export function PageTitleBlock({ eyebrow, title, subtitle, accentColor = "ci-blue" }: PageTitleBlockProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-6"
    >
      {/* Eyebrow */}
      <p className={`text-xs font-medium uppercase tracking-[0.2em] text-${accentColor} mb-2`}>
        {eyebrow}
      </p>

      {/* Title */}
      <h1 className="text-2xl font-bold text-ci-text drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
        {title}
      </h1>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-sm text-ci-muted mt-1">{subtitle}</p>
      )}

      {/* Decorative gradient line */}
      <div className={`mt-3 h-px w-24 bg-gradient-to-r from-${accentColor} to-transparent`} />
    </motion.div>
  );
}
```

### 3. TopNav

Main navigation inspired by the Palantir TopNav.

```tsx
// components/layout/TopNav.tsx
import { motion, LayoutGroup } from "framer-motion";
import { Binary, Terminal, Cpu, Layers } from "lucide-react";

const tabs = [
  { id: "bytes", label: "Bytes Explorer", icon: Binary, accent: "ci-cyan" },
  { id: "shell", label: "Shell & Process", icon: Terminal, accent: "ci-green" },
  { id: "compiler", label: "Compiled vs Interpreted", icon: Cpu, accent: "ci-amber" },
  { id: "memory", label: "Stack vs Heap", icon: Layers, accent: "ci-blue" },
];

interface TopNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  return (
    <nav className="
      sticky top-0 z-50
      bg-ci-bg/80 backdrop-blur-lg
      border-b border-ci-border/30
      px-6 py-3
    ">
      <LayoutGroup>
        <div className="flex items-center gap-1 max-w-7xl mx-auto">
          {/* Logo */}
          <span className="text-sm font-mono font-semibold text-ci-green mr-6 tracking-tight">
            {"<Code Internals />"}
          </span>

          {/* Tabs */}
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`
                  relative flex items-center gap-2 px-4 py-2 rounded-lg
                  text-sm font-medium transition-colors
                  ${isActive ? "text-ci-text" : "text-ci-muted hover:text-ci-text/80"}
                `}
              >
                <Icon size={16} />
                <span className="hidden md:inline">{tab.label}</span>

                {/* Animated pill background */}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className={`absolute inset-0 rounded-lg bg-ci-surface border border-ci-border/50`}
                    style={{ zIndex: -1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </LayoutGroup>
    </nav>
  );
}
```

### 4. Welcome / Landing Page

Hero page with **LetterGlitch** full-screen background and navigation cards.

#### MUST-HAVE: LetterGlitch Background

The landing page **must** use the [LetterGlitch](https://www.reactbits.dev/backgrounds/letter-glitch) component from `@react-bits` as a full-screen animated background. This creates a Matrix-like canvas of randomly glitching characters that perfectly fits the "Code Matrix" theme.

**Install:**
```bash
npx shadcn@latest add @react-bits/LetterGlitch-JS-CSS
```

**Component props reference:**

| Prop | Type | Default | Our value |
|------|------|---------|-----------|
| `glitchColors` | `string[]` | `['#2b4539', '#61dca3', '#61b3dc']` | `['#0a2e1a', '#39d353', '#58a6ff']` (dark green, ci-green, ci-blue) |
| `glitchSpeed` | `number` | `50` | `50` |
| `centerVignette` | `boolean` | `false` | `true` (darkens center so hero text is readable) |
| `outerVignette` | `boolean` | `true` | `true` (fades edges to ci-bg) |
| `smooth` | `boolean` | `true` | `true` (smooth color interpolation) |
| `characters` | `string` | A-Z + symbols | `ABCDEFGHIJKLMNOPQRSTUVWXYZ01{}[]<>#!/$%&*()+=;:.,10` (code-like chars) |

The component renders a `<canvas>` that fills its parent container. It goes in an `absolute inset-0 z-0` wrapper behind all landing page content. The vignettes ensure text remains readable on top.

Must respect `prefers-reduced-motion`: when reduced motion is preferred, pass `glitchSpeed={0}` or render a static snapshot instead.

```tsx
// components/landing/LandingPage.tsx
import { motion } from "framer-motion";
import { Binary, Terminal, Cpu, Layers } from "lucide-react";
import LetterGlitch from "./LetterGlitch";

const panels = [
  {
    id: "bytes",
    icon: Binary,
    title: "Bytes Explorer",
    description: "Visualize bits, bytes, encodings, and real type sizes in C vs Python",
    accent: "ci-cyan",
    gradient: "from-ci-cyan/10 to-transparent",
  },
  {
    id: "shell",
    icon: Terminal,
    title: "Shell & Process",
    description: "Interactive terminal with pipe visualization, streams, and OS layers",
    accent: "ci-green",
    gradient: "from-ci-green/10 to-transparent",
  },
  {
    id: "compiler",
    icon: Cpu,
    title: "Compiled vs Interpreted",
    description: "C compilation vs Python interpretation pipeline, step-by-step",
    accent: "ci-amber",
    gradient: "from-ci-amber/10 to-transparent",
  },
  {
    id: "memory",
    icon: Layers,
    title: "Stack vs Heap",
    description: "Visualize memory allocations, stack frames, and garbage collection",
    accent: "ci-blue",
    gradient: "from-ci-blue/10 to-transparent",
  },
];

export function LandingPage({ onNavigate }: { onNavigate: (tab: string) => void }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* ============================================================
          MUST-HAVE: LetterGlitch background (from @react-bits)
          Full-screen canvas of glitching characters behind all content.
          Install: npx shadcn@latest add @react-bits/LetterGlitch-JS-CSS
          Source: https://www.reactbits.dev/backgrounds/letter-glitch
          ============================================================ */}
      <div className="absolute inset-0 z-0">
        <LetterGlitch
          glitchColors={["#0a2e1a", "#39d353", "#58a6ff"]}  // ci-bg-dark-green, ci-green, ci-blue
          glitchSpeed={50}
          centerVignette={true}
          outerVignette={true}
          smooth={true}
          characters="ABCDEFGHIJKLMNOPQRSTUVWXYZ01{}[]<>#!/$%&*()+=;:.,10"
        />
      </div>

      {/* Hero text */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 relative z-10"
      >
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-ci-green mb-4">
          Module 02 - Python Internals
        </p>
        <h1 className="text-5xl font-bold mb-4">
          <span className="bg-gradient-to-r from-ci-cyan via-ci-green to-ci-blue bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
            Code Internals Explorer
          </span>
        </h1>
        <p className="text-ci-muted text-lg max-w-xl mx-auto">
          Visually explore how computers represent data, execute programs, and manage memory.
        </p>
      </motion.div>

      {/* Stats bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex gap-6 text-sm text-ci-muted mb-10"
      >
        <span>4 Panels</span>
        <span className="text-ci-border">|</span>
        <span>2 Languages</span>
        <span className="text-ci-border">|</span>
        <span>Real Execution</span>
        <span className="text-ci-border">|</span>
        <span>Secure Sandbox</span>
      </motion.div>

      {/* Navigation cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl w-full relative z-10"
      >
        {panels.map((panel, i) => {
          const Icon = panel.icon;
          return (
            <motion.button
              key={panel.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.1 }}
              whileHover={{ y: -4 }}
              onClick={() => onNavigate(panel.id)}
              className={`
                group relative p-6 rounded-xl text-left
                bg-ci-panel/60 backdrop-blur-sm
                border border-ci-border/30
                hover:border-${panel.accent}/40
                transition-colors duration-300
              `}
            >
              {/* Hover radial gradient */}
              <div className={`
                absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100
                bg-gradient-to-br ${panel.gradient}
                transition-opacity duration-300
              `} />

              <div className="relative z-10">
                <Icon size={24} className={`text-${panel.accent} mb-3`} />
                <h3 className="text-lg font-semibold text-ci-text mb-1">{panel.title}</h3>
                <p className="text-sm text-ci-muted">{panel.description}</p>
              </div>
            </motion.button>
          );
        })}
      </motion.div>
    </div>
  );
}
```

---

## Per-Panel Refinements

### Panel 1: Bytes Explorer (accent: cyan)

#### Bits as animated blocks

```tsx
// components/bytes/BitBlock.tsx
import { motion } from "framer-motion";

interface BitBlockProps {
  value: 0 | 1;
  index: number;
}

export function BitBlock({ value, index }: BitBlockProps) {
  return (
    <motion.div
      key={value} // force re-render on change
      initial={{ rotateY: 90 }}
      animate={{ rotateY: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 20, delay: index * 0.03 }}
      className={`
        w-8 h-10 rounded flex items-center justify-center
        font-mono text-sm font-semibold
        border transition-colors duration-200
        ${value === 1
          ? "bg-ci-cyan/20 border-ci-cyan/40 text-ci-cyan shadow-[0_0_6px_rgba(86,212,221,0.2)]"
          : "bg-ci-panel border-ci-border/30 text-ci-dim"
        }
      `}
    >
      {value}
    </motion.div>
  );
}
```

#### C vs Python comparison as "memory tanks"

```tsx
// components/bytes/MemoryTank.tsx
import { motion } from "framer-motion";

interface MemoryTankProps {
  language: "C" | "Python";
  sizeBytes: number;
  maxBytes: number; // for scale
  color: string;    // "ci-amber" for C, "ci-purple" for Python
}

export function MemoryTank({ language, sizeBytes, maxBytes, color }: MemoryTankProps) {
  const fillPercent = (sizeBytes / maxBytes) * 100;

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-mono text-ci-muted uppercase tracking-wider">{language}</span>

      {/* Tank container */}
      <div className="relative w-20 h-40 rounded-lg border border-ci-border/30 bg-ci-bg overflow-hidden">
        {/* Fill */}
        <motion.div
          initial={{ height: 0 }}
          animate={{ height: `${fillPercent}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`absolute bottom-0 w-full bg-${color}/20 border-t border-${color}/40`}
        />

        {/* Value label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-mono font-bold text-${color}`}>
            {sizeBytes}B
          </span>
        </div>
      </div>
    </div>
  );
}
```

#### ASCII table with GlowCard hover

```tsx
// Pattern for hover on each ASCII table cell:
// hover:bg-ci-cyan/10 hover:shadow-[0_0_12px_rgba(86,212,221,0.15)] transition-all duration-150
```

#### Terminal-style hex dump

```tsx
// components/bytes/HexDump.tsx
// Layout:
// OFFSET    HEX                                          ASCII
// 00000000  48 65 6c 6c 6f 20 57 6f  72 6c 64 00 00 00  Hello World...
//
// - Monospace font (JetBrains Mono)
// - Offset in ci-muted
// - Hex values in ci-cyan
// - Printable ASCII in ci-text, non-printable as "." in ci-dim
// - Color-coded byte ranges: null bytes in ci-red/30, high bytes in ci-amber/30
```

---

### Panel 2: Shell & Linux Explorer (accent: green)

#### Filesystem tree visualization

```tsx
// components/shell/FilesystemTree.tsx
// Interactive tree with directory nodes that expand/collapse
//
// /
// ├── bin/        ← "System binaries" tooltip, ci-amber icon
// ├── etc/        ← "Configuration files" tooltip, ci-amber icon, lock icon
// ├── home/
// │   ├── alice/  ← ci-green highlight (current user), unlocked
// │   │   ├── .bashrc       ← dotfile, ci-muted italic, eye icon
// │   │   ├── .profile
// │   │   ├── .ssh/
// │   │   └── Documents/
// │   └── bob/    ← ci-blue, lock icon if not current user
// ├── tmp/        ← "Temporary files" tooltip, world-writable badge
// ├── usr/
// └── var/
//
// Each node:
// - Folder icon colored by access level: green (owned), blue (readable), red (no access)
// - Permission string on hover: "drwxr-xr-x alice alice"
// - Click to expand; double-click to `cd` into it in the terminal
// - Dotfiles (.*) rendered in ci-muted/italic with reduced opacity
// - Current user's home has a subtle ci-green left border / glow
// - "Lock" badge (Lucide Lock icon) on directories user can't write to
```

#### User context switcher

```tsx
// components/shell/UserCompare.tsx
// Side-by-side comparison or toggle between users
//
// ┌─────────────────────┐    ┌─────────────────────┐
// │  👤 alice            │    │  🔑 root             │
// │  /home/alice         │    │  /root               │
// │  $SHELL: /bin/bash   │    │  $SHELL: /bin/bash   │
// │                      │    │                      │
// │  Can access:         │    │  Can access:         │
// │  ✅ ~/Documents      │    │  ✅ Everything        │
// │  ✅ /tmp             │    │  ✅ /etc/shadow       │
// │  ❌ /etc/shadow      │    │  ✅ /home/alice       │
// │  ❌ /home/bob        │    │                      │
// └─────────────────────┘    └─────────────────────┘
//
// - Cards use GlassPanel with accent="green"
// - Active user has bright border, inactive has dim border
// - Access list items animate in with staggerChildren
// - Clicking "Switch to bob" updates terminal prompt and file access
```

#### Bash startup chain visualization

```tsx
// components/shell/BashStartupChain.tsx
// Horizontal stepper showing what happens when a user logs in:
//
// [User logs in] → [/etc/passwd lookup] → [/etc/profile] → [~/.bash_profile] → [~/.bashrc] → [Shell ready]
//
// Each step:
// - Circle node with icon (User, FileText, Settings, Terminal)
// - Lights up in sequence with ci-green glow when "simulating login"
// - Clicking a step shows the file content in a GlassPanel below
// - e.g., clicking "~/.bashrc" shows the bashrc content with syntax highlighting
// - Editable: user can add `alias ll='ls -la'` to .bashrc, "re-login", and see it take effect
//
// Animation: spring transition between steps, 300ms delay per step
// Below the chain: code preview panel showing current step's file content
```

#### Environment variables & $PATH visualization

```tsx
// components/shell/EnvVariablesPanel.tsx
// Two sections:
//
// 1. Key Variables (grid of small GlassPanels):
//    $HOME = /home/alice     (ci-green)
//    $USER = alice           (ci-green)
//    $SHELL = /bin/bash      (ci-cyan)
//    $PWD = /home/alice      (ci-blue)
//    $PATH = /usr/bin:/bin   (ci-amber)
//
// 2. $PATH Search Animation:
//    When user types a command (e.g., "grep"), shows:
//    [Searching $PATH...]
//    /usr/local/bin/grep  ← ❌ not found (ci-red, dim)
//    /usr/bin/grep        ← ✅ found! (ci-green, glow)
//    /bin/grep            ← (skipped)
//
//    Animated: each path entry lights up sequentially until found
//    Arrow from found binary back to the terminal
//
// 3. Export demo:
//    Shows `MY_VAR=hello` as shell-only (ci-muted, stays in box)
//    Shows `export MY_VAR=hello` as env variable (ci-green, floats up to env panel)
//    Animated transition: variable "promotes" from local to environment
```

#### Terminal with scan-line effect

```css
/* Scan-line overlay for the terminal */
.terminal-scanline::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    transparent 50%,
    rgba(0, 0, 0, 0.03) 50%
  );
  background-size: 100% 4px;
  pointer-events: none;
  z-index: 10;
}
```

#### Blinking cursor

```tsx
// In the terminal prompt:
<span className="animate-cursor-blink text-ci-green">_</span>
```

#### Typewriter effect for SSE output

```tsx
// hooks/useTypewriter.ts
// Receives chars from SSE and renders one at a time with 10-20ms delay
// Creates "typing" effect in the terminal
// Respects prefers-reduced-motion (renders all at once)
```

#### Pipe visualization with particles

```tsx
// components/shell/PipeParticle.tsx
import { motion } from "framer-motion";

// Data flowing between processes as small blocks
// Each block = a "chunk" of data passing through the pipe
// Animation: translate from one process-box to the next
// Color: ci-green for valid data, ci-red for errors

// Process boxes connected by lines with particles:
// [echo "hello"] ──●──●──> [grep "h"] ──●──> [wc -c]
```

#### Layer diagram with nodes that light up

```tsx
// components/shell/LayerDiagram.tsx
// 4 vertically stacked layers:
//
// ┌─────────────────┐
// │   User Space     │ ← lights up when user types
// ├─────────────────┤
// │   Shell (bash)   │ ← lights up when command is parsed
// ├─────────────────┤
// │   Kernel         │ ← lights up when syscall happens
// ├─────────────────┤
// │   Hardware       │ ← lights up when I/O happens
// └─────────────────┘
//
// Each layer: bg-ci-panel normally
// When "active": bg-ci-green/10 border-ci-green/40 with subtle glow
// Animated arrow descends/ascends between layers
// Hover tooltip explaining what each layer does
```

---

### Panel 3: Compiler View (accent: amber)

#### Pipeline as horizontal stepper

```tsx
// components/compiler/PipelineStepper.tsx
import { motion } from "framer-motion";

// C Pipeline:
// [Source] → [Preprocessor] → [Compiler] → [Assembler] → [Linker] → [Executable]
//
// Python Pipeline:
// [Source] → [Bytecode] → [PVM] → [Output]
//
// Each stage:
// - Circle with icon + label
// - Connected by line
// - State: pending (ci-dim), active (ci-amber + glow), done (ci-green), error (ci-red)
// - When executing, each step activates sequentially with delay
// - Active step has pulsing glow: shadow-[0_0_12px_rgba(212,167,44,0.3)]
```

#### Code diff: source vs bytecode

```tsx
// components/compiler/CodeDiff.tsx
// Split view with visual correspondence:
// - Python line on the left highlighted in ci-amber/10
// - Corresponding opcodes on the right highlighted in the same color
// - Hover on a Python line → highlights corresponding opcodes
// - Hover on an opcode → highlights the originating Python line
// - Connected by subtle SVG lines (opacity 0.2)
```

#### Timing cards with AnimatedCounter

```tsx
// components/shared/AnimatedCounter.tsx
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useState } from "react";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;   // "ms", "bytes", etc.
  color?: string;
}

export function AnimatedCounter({ value, suffix = "ms", color = "ci-text" }: AnimatedCounterProps) {
  const [displayed, setDisplayed] = useState(0);

  useEffect(() => {
    const controls = animate(0, value, {
      duration: 1,
      ease: "easeOut",
      onUpdate: (v) => setDisplayed(Math.round(v * 10) / 10),
    });
    return () => controls.stop();
  }, [value]);

  return (
    <span className={`font-mono text-2xl font-bold text-${color}`}>
      {displayed}
      <span className="text-sm text-ci-muted ml-1">{suffix}</span>
    </span>
  );
}
```

---

### Panel 4: Stack & Heap Visualizer (accent: blue)

#### Stack frames with spring animation

```tsx
// components/memory/StackFrame.tsx (refined version)
import { motion, AnimatePresence } from "framer-motion";

interface StackFrameProps {
  frame: {
    function: string;
    variables: Array<{ name: string; type: string; value: string }>;
  };
  index: number;
  isActive: boolean;
}

export function StackFrame({ frame, index, isActive }: StackFrameProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9, y: -20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={`
        rounded-lg border p-3 font-mono text-sm
        ${isActive
          ? "bg-ci-blue/10 border-ci-blue/40 shadow-[0_0_8px_rgba(88,166,255,0.15)]"
          : "bg-ci-panel border-ci-border/30"
        }
      `}
    >
      {/* Function name */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-ci-blue font-semibold">{frame.function}()</span>
        {isActive && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-ci-blue/20 text-ci-blue">
            ACTIVE
          </span>
        )}
      </div>

      {/* Variables */}
      {frame.variables.map((v) => (
        <div key={v.name} className="flex items-center gap-2 text-xs ml-2">
          <span className="text-ci-muted">{v.type}</span>
          <span className="text-ci-text">{v.name}</span>
          <span className="text-ci-dim">=</span>
          <span className="text-ci-cyan">{v.value}</span>
        </div>
      ))}
    </motion.div>
  );
}
```

#### Heap block with allocation/deallocation animation

```tsx
// components/memory/HeapBlock.tsx (refined version)
import { motion } from "framer-motion";

interface HeapBlockProps {
  block: {
    address: string;
    size: number;
    type: string;
    status: "allocated" | "freed" | "allocating";
  };
  isNew: boolean; // recently allocated (trail glow)
}

export function HeapBlock({ block, isNew }: HeapBlockProps) {
  const statusStyles = {
    allocated: "bg-ci-blue/15 border-ci-blue/40 text-ci-blue",
    freed: "bg-ci-red/10 border-ci-red/30 text-ci-red opacity-50",
    allocating: "bg-ci-green/15 border-ci-green/40 text-ci-green",
  };

  return (
    <motion.div
      // Allocation: materializes with scale + fade
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      // Deallocation: dissolves
      exit={{
        opacity: 0,
        scale: 0.8,
        filter: "blur(4px)",
        transition: { duration: 0.3 },
      }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`
        relative rounded-md border p-2 font-mono text-xs
        ${statusStyles[block.status]}
        ${isNew ? "shadow-[0_0_12px_rgba(88,166,255,0.25)]" : ""}
      `}
      style={{
        width: `${Math.max(60, Math.min(200, block.size * 2))}px`,
      }}
    >
      <div className="truncate">{block.address}</div>
      <div className="text-[10px] opacity-70">{block.size}B - {block.type}</div>

      {/* Trail glow for recently allocated */}
      {isNew && (
        <motion.div
          initial={{ opacity: 0.6 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 2 }}
          className="absolute inset-0 rounded-md bg-ci-blue/10 pointer-events-none"
        />
      )}
    </motion.div>
  );
}
```

#### Refined step controls

```tsx
// components/memory/StepControls.tsx (refined version)
import { Play, Pause, SkipForward, SkipBack, RotateCcw } from "lucide-react";

// Layout:
// [⟲ Reset] [◄ Back] [▶ Play/Pause] [► Forward]   Speed: [──●──] 1.0x
//
// Buttons with:
// - bg-ci-surface hover:bg-ci-border/50
// - border border-ci-border/30
// - Active (playing): bg-ci-green/10 border-ci-green/30 text-ci-green
// - Speed slider: accent-ci-blue
// - Step counter: "Step 3 / 15" in ci-muted
```

#### Pointer arrows (Stack → Heap)

```tsx
// components/memory/PointerArrow.tsx
// SVG overlay connecting stack variable to heap block
// - Curved line (cubic bezier) in ci-cyan/40
// - Arrowhead (marker-end)
// - Animation: dasharray + dashoffset to "draw" the line
// - Hover on variable: arrow becomes ci-cyan/80 (more visible)
// - Hover on block: all arrows pointing to it become more visible
```

---

## Ambient Effects

### Global background grid

Applied to body/main container:

```tsx
<div className="min-h-screen bg-ci-bg bg-grid">
  {/* app content */}
</div>
```

### Per-section radial gradients

Each panel has a subtle radial gradient at the top:

```tsx
// Applied to each panel's container
<div className="relative">
  <div className="absolute inset-x-0 top-0 h-60 bg-radial-green pointer-events-none" />
  {/* Shell panel content */}
</div>
```

Mapping:
- Bytes: `bg-radial-cyan`
- Shell: `bg-radial-green`
- Compiler: `bg-radial-amber`
- Memory: `bg-radial-blue`

### Landing page: LetterGlitch background (REPLACES aurora effect)

The aurora blobs are **removed** in favor of the LetterGlitch canvas background (see Section 4 above). LetterGlitch already provides the ambient animated background for the landing page with better thematic fit (code characters glitching = "Code Matrix" theme).

No additional aurora/blob effects needed on the landing page.

---

## Accessibility: prefers-reduced-motion

**Absolute rule**: every animation respects `prefers-reduced-motion`.

### Standard hook

```tsx
// hooks/useReducedMotion.ts
import { useReducedMotion } from "framer-motion";

// Use in every component that animates:
export function useMotionConfig() {
  const prefersReduced = useReducedMotion();

  return {
    // For Framer Motion
    initial: prefersReduced ? false : undefined,
    transition: prefersReduced ? { duration: 0 } : undefined,

    // For CSS
    animationClass: prefersReduced ? "motion-reduce:animate-none" : "",
  };
}
```

### Application

```tsx
// In every animated component:
const { initial } = useMotionConfig();

<motion.div
  initial={initial ?? { opacity: 0, y: 12 }}
  animate={{ opacity: 1, y: 0 }}
>
```

---

## Consolidated Framer Motion Patterns

| Pattern              | Where to use                       | Config                                          |
| -------------------- | ---------------------------------- | ----------------------------------------------- |
| `layoutId`           | TopNav pill, tab transitions       | `type: "spring", stiffness: 300, damping: 30`   |
| `AnimatePresence`    | Stack frame push/pop, heap alloc/free | `mode="popLayout"`                          |
| `spring`             | Stack push/pop, memory blocks      | `stiffness: 300-400, damping: 20-30`            |
| `staggerChildren`    | Bit list, opcodes, ASCII table     | `staggerChildren: 0.03`                         |
| `useMotionValue`     | AnimatedCounter, progress bars     | With `useTransform` for interpolation            |
| `whileHover`         | Cards, buttons, table cells        | `{ y: -2 }` or `{ scale: 1.02 }`               |

---

## Advanced Hooks

### useSSE

```tsx
// hooks/useSSE.ts
// Reuses pattern from data-race/useRaceSSE
//
// function useSSE<T>(url: string, options?: { enabled?: boolean }) {
//   const [data, setData] = useState<T[]>([]);
//   const [status, setStatus] = useState<"idle" | "streaming" | "done" | "error">("idle");
//
//   // EventSource with reconnect
//   // SSE data field parsing
//   // Cleanup on unmount
//   // Error handling with retry (max 3)
//
//   return { data, status, latest: data.at(-1) };
// }
```

### useStepExecution

```tsx
// hooks/useStepExecution.ts
//
// function useStepExecution(sessionId: string, totalSteps: number) {
//   const [currentStep, setCurrentStep] = useState(0);
//   const [isPlaying, setIsPlaying] = useState(false);
//   const [speed, setSpeed] = useState(1);
//   const [stepData, setStepData] = useState<StepData | null>(null);
//
//   // Auto-advance with setInterval when isPlaying
//   // Interval = 1000ms / speed
//   // Fetch step data from backend: GET /api/memory/step/{sessionId}?step={currentStep}
//   // Cache of already-loaded steps (Map<number, StepData>)
//
//   return {
//     currentStep, totalSteps, stepData,
//     isPlaying, speed,
//     play: () => setIsPlaying(true),
//     pause: () => setIsPlaying(false),
//     stepForward: () => ...,
//     stepBack: () => ...,
//     reset: () => ...,
//     setSpeed,
//   };
// }
```

### usePollingResource

```tsx
// hooks/usePollingResource.ts
// Inspired by the Palantir pattern
//
// function usePollingResource<T>(
//   fetcher: () => Promise<T>,
//   options: { interval: number; enabled?: boolean }
// ) {
//   const [data, setData] = useState<T | null>(null);
//   const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
//
//   // Poll with setInterval
//   // Deduplicates in-flight requests
//   // Pauses when tab is not visible (document.hidden)
//
//   return { data, status, refetch };
// }
```

---

## Required Assets

| Asset                    | Format  | Usage                            |
| ------------------------ | ------- | -------------------------------- |
| Project logo             | SVG     | TopNav, favicon, landing         |
| Circuit-board pattern    | SVG/CSS | Landing page background          |
| Grid pattern             | CSS     | Global background (already in Tailwind config) |

**Note**: No heavy images needed. All visual effects are done with CSS/SVG/Framer Motion. No large bitmap assets.

---

## Additional Dependencies (beyond core)

```json
{
  "dependencies": {
    "framer-motion": "^11.x",
    "lucide-react": "^0.400",
    "@fontsource/jetbrains-mono": "^5.x",
    "@fontsource/inter": "^5.x"
  }
}
```

**LetterGlitch** (landing page background - MUST HAVE):
```bash
npx shadcn@latest add @react-bits/LetterGlitch-JS-CSS
```
This installs the component source directly into the project (no npm package). See [react-bits docs](https://www.reactbits.dev/backgrounds/letter-glitch).

Core dependencies (React, Vite, Tailwind, highlight.js/prism) are already in `01_CORE_PLAN.md`.

---

## Refinement Application Order

1. **Base theme**: Install fonts, configure Tailwind palette, global CSS (grid, scrollbar, selection)
2. **GlassPanel + PageTitleBlock**: Replace basic cards with glass components
3. **TopNav**: Replace simple tabs with TopNav with animated pill
4. **Landing page**: Add welcome page as initial route
5. **Panel by panel**: Apply visual refinements to each panel in order:
   - Bytes (bit flip animations, memory tanks, hex dump)
   - Shell (scanline, cursor, typewriter, pipe particles)
   - Compiler (stepper, code diff, animated counters)
   - Memory (spring stack frames, heap blocks, pointer arrows)
6. **Ambient effects**: Radial gradients, aurora on landing
7. **Accessibility**: Validate `prefers-reduced-motion` across all components
