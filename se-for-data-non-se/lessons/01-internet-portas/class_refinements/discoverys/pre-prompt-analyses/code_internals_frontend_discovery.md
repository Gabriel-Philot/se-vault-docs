# DESCOBERTA DE FRONTEND: CODE INTERNALS PROJECT

## 1. ESTRUTURA DO PROJETO

### Stack:
- **React 19.0.0** + **TypeScript 5.7.0** + **Vite 6.0.0**
- **Tailwind CSS 4.0.0** (versão mais nova!) + CSS customizado
- **Framer Motion 12.23.24** (animações spring physics)
- **Lucide React 0.575.0** (ícones)
- **Prism React Renderer 2.4.1** (syntax highlighting)
- **Fonts:** JetBrains Mono (monospace), Inter (sans-serif)

### Arquitetura (37 arquivos TSX + CSS):
```
frontend/src/
├── components/
│   ├── bytes/ (5) - BytesExplorer, MultiBaseDisplay, SizeCompare, AsciiTable, EncodingCompare
│   ├── compiler/ (6) - CompileView, CodeEditor, SnippetSelector, PipelineAnimation, AssemblyView, BytecodeView, TimingComparison
│   ├── memory/ (9) - StackHeapVisualizer, StackColumn, HeapColumn, StackFrameComponent, HeapBlockComponent, MemoryCodeEditor, StepControls, PointerArrow, RefCountBadge
│   ├── shell/ (7) - ShellSimulator, FilesystemTree, UserCompare, BashStartupChain, EnvVariablesPanel, ProcessDiagram, PipeVisualizer
│   ├── landing/ (2) - LandingPage, LetterGlitch (canvas glitch background)
│   ├── layout/ (2) - AppShell, TabNav
│   └── shared/ (6) - GlassPanel, PageTitleBlock, CodeBlock, StreamOutput, LoadingSpinner, CompareBar
├── hooks/ (5) - useSSE, useMemoryTrace, useBytesCompare, useReducedMotion, useCompile
├── lib/ (3) - api.ts, constants.ts, types.ts
```

---

## 2. PALETA DE CORES (Cyberpunk/Terminal)

```
ci-bg: #0a0e14 (azul-escuro profundo)
ci-panel: #141a22 (painéis)
ci-surface: #1c2333 (superfícies)
ci-border: #2d3548 (bordas)
ci-green: #39d353 (terminal/sucesso - Matrix green)
ci-blue: #58a6ff (memória/info)
ci-amber: #d4a72c (compilação/avisos)
ci-red: #f85149 (erros/stderr)
ci-cyan: #56d4dd (bytes/hex)
ci-purple: #bc8cff (Python)
ci-text: #c9d1d9 (texto primário)
ci-muted: #6e7681 (texto secundário)
```

**Tema:** Cyberpunk/Terminal escuro com acentos coloridos por função (cada painel tem sua cor)

---

## 3. PADRÃO VISUAL: GLASS MORPHISM + GLOW

```css
GlassPanel: border-ci-border/70 + bg-ci-panel/70 + backdrop-blur(1.5px) + shadow 24px 90px
Accent glow: border-ci-cyan/35 + glow shadow por cor do painel
Linha gradiente no topo: from-transparent via-color/70 to-transparent
```

**Background global:** ambient-grid (36x36px) + ambient-radial (cyan + purple glow nos cantos)

---

## 4. PAINÉIS (4 áreas educacionais)

### Bytes Explorer (CYAN):
- C vs Python Size Compare (barras animadas lado-a-lado)
- Multi-Base Display (decimal, hex, binário com bits animados rotateY flip)
- ASCII Table interativa (16x8, clicável, hover glow)
- Encoding Compare (UTF-8 vs ASCII com bytes hex)

### Shell Simulator (GREEN):
- Terminal interativo com SSE streaming (prompt alice@localhost)
- FilesystemTree expandível com permissões e ícones lock
- UserCompare (alice vs root, lado-a-lado)
- BashStartupChain (stepper horizontal animado)
- EnvVariablesPanel ($HOME, $PATH etc como badges)

### Compiler (AMBER):
- CodeEditor split pane (C ou Python) + SnippetSelector
- PipelineAnimation stepper: C(6 stages) vs Python(4 stages)
- AssemblyView + BytecodeView com Prism highlight
- TimingComparison com AnimatedCounter

### Memory Visualizer (BLUE):
- StackColumn + HeapColumn lado-a-lado
- Stack frames empilados (main na base), heap blocks com tamanho proporcional
- PointerArrow: SVG cubic bezier conectando variáveis → heap
- StepControls: play/pause/step + speed slider
- MemoryCodeEditor com linha atual destacada
- RefCountBadge para garbage collection

---

## 5. LANDING PAGE

- **LetterGlitch:** Canvas HTML5 com ~1.2k caracteres glitchando em tempo real
- Cores: verde escuro → ci-green → ci-blue com vignette
- 4 cartões de entrada em grid 2x2 (cada um com cor do painel)
- Hover: translate Y -2px + border glow

---

## 6. ANIMAÇÕES

**Framer Motion:**
- layoutId para pills de navegação (spring: stiffness 420, damping 34)
- AnimatePresence mode="popLayout" para stack frames
- staggerChildren 0.03s para bits, opcodes, ASCII
- whileHover y: -2 para cards

**CSS Keyframes:** scanLine (8s), shimmer (2.8s), fadeUp (0.7s), cursorBlink (1.1s), glowPulse (2.4s)

**SSE Streaming:** useSSE hook para shell output em tempo real

---

## 7. RESPONSIVIDADE

- Grid adaptativo (1 col mobile, 2 col desktop)
- ScrollBar em TabNav para overflow
- prefers-reduced-motion respeitado via useReducedMotion hook

---

## 8. NÍVEL DE SOFISTICAÇÃO: ALTO (8/10)

**Forças:** Coesão visual total, spring physics fluidas, 4 painéis com identidade visual própria (cor), glass morphism consistente, SSE para real-time, syntax highlighting com Prism, TypeScript strict, acessibilidade considerada

**É:** Aplicação educacional interativa que visualiza conceitos de SE (bytes, shell, compilação, memória) através de 4 painéis especializados com tema cyberpunk/terminal
