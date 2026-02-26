# DESCOBERTA DE FRONTEND: CODEX PLAN SHOT (PALANTIR)

## 1. ESTRUTURA DO PROJETO

### Stack:
- **React 19.0.0** + **TypeScript 5.7.3** + **Vite 6.1.0**
- **Tailwind CSS 3.4.17** + CSS customizado (glass morphism)
- **Framer Motion 12.5.0** (animações avançadas)
- **Lucide React 0.511.0** (ícones)
- **React Router DOM 7.2.0** (routing)

### Arquitetura:
```
frontend/src/
├── pages/ (Welcome, Dashboard, Missions, Library, Architecture)
├── components/
│   ├── layout/ (MainShell, TopNav)
│   └── shared/ (PageTitleBlock, PageCard)
├── hooks/ (usePollingResource)
├── lib/ (api.ts, assets.ts, types.ts)
├── App.tsx, main.tsx, index.css
public/images/ (heróis, locações, backgrounds LOTR)
```

---

## 2. PALETA DE CORES

```
pal-bg: #1a1714 (escuro quente)
pal-panel: #2a2520 (panel)
pal-gold: #c9a84c (ouro primário)
pal-green: #4a9e6e (success)
pal-blue: #5b8fb9 (secundário cool)
pal-red: #c0392b (error)
pal-text: #e8dcc8 (texto claro)
pal-muted: #8a7e6b (texto secundário)
```

---

## 3. PADRÃO VISUAL: GLASS MORPHISM

```css
.glass-panel {
  background: rgba(42, 37, 32, 0.82);
  border: 1px solid rgba(201, 168, 76, 0.15);
  backdrop-filter: blur(8px);
}
```

---

## 4. PÁGINAS E COMPONENTES

### Welcome:
- Orbe "Palantir" animado (glow radial, rotação, escala 10s loop)
- Título com gradient animado + shimmer
- Grid de 4 cards de entrada (gold, green, blue)
- Painel de estatísticas

### Dashboard (Mapa Terra-Média):
- Imagem de fundo com gradients overlay
- 5 markers pulsantes no mapa
- 3 Widgets: Missions (progresso circular conic-gradient + avatares), Library (Hit/Miss), Infra Pulse (círculos concêntricos)
- Quick Read Cards (4 métricas com shimmer)
- Live Registros (timeline com AnimatePresence)
- 3 Painéis inferiores (missões ativas, biblioteca/cache, resumo)

### Missões:
- Convocador com 4 tipos (recon, consult, raven, fellowship)
- Lista de missões com status badge + progress bar
- Trace viewer: terminal simulado vs JSON

### Biblioteca:
- Regions panel (botões regiões LOTR + card resultado)
- Gate Knock (formulário interativo)
- SQL Query Builder com presets + tabela resultados + leaderboard

### Arquitetura:
- Diagrama SVG animado com nodes/edges
- Trace replay step-by-step
- Highlight dinâmico

---

## 5. ANIMAÇÕES (Framer Motion avançado)

- Spring physics (stiffness, damping, mass)
- Stagger em listas, layout animations (layoutId)
- Loop infinito (pulse, rotate, scale)
- AnimatePresence com popLayout
- Respeita prefers-reduced-motion

---

## 6. RESPONSIVIDADE

- Mobile-first, breakpoints: sm(640), md(768), lg(1024), xl(1280)
- Grid layouts dinâmicos
- TopNav sticky com backdrop blur + border gradient

---

## 7. PADRÕES DE CÓDIGO

- Hooks: useState, useEffect, useMemo
- Custom hook: usePollingResource (polling 1000-3500ms)
- TypeScript interfaces: TelemetryEvent, MissionSummary, MissionTraceRecord, LeaderboardEntry, DiagramEnvelope
- Fetch API nativo

---

## 8. NÍVEL DE SOFISTICAÇÃO: MUITO ALTO (9/10)

**Forças:**
- Glass morphism consistente em toda app
- Animações sofisticadas com spring physics
- Temática LOTR unificada como metáfora para observabilidade de produção
- Múltiplos layers de shadow (outer + inset), gradientes complexos (radial, linear, conic)
- Componentes reutilizáveis (PageTitleBlock, PageCard)
- Acessibilidade: ARIA labels, focus-visible, color contrast, reduced-motion
- Real-time polling com estados visuais (loading, error, success)

**É essencialmente:** Painel de controle/observabilidade de produção disfarçado de aventura Middle-earth, com telemetria real-time, mission tracking, cache stats, architecture visualization e gamification.
