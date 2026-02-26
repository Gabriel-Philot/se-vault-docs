# DESCOBERTA DE FRONTEND: COZINHAS CHAT PT

## 1. ESTRUTURA DO PROJETO

### Stack Frontend:
- **React 19.0.0** + **TypeScript 5.7** + **Vite 6.0**
- **Tailwind CSS 3.4.17** + CSS customizado (tema maison)
- **Framer Motion 12.4.2** (animações)
- **Lucide React 0.400** (ícones SVG)
- **@xyflow/react 12.8.5** (diagramas interativos)
- **React Router DOM 7.0.0** (routing)
- **Fonts:** Playfair Display (serif), Inter (sans), JetBrains Mono (mono)

### Arquitetura de arquivos:
```
frontend/
├── src/
│   ├── main.tsx, App.tsx, index.css
│   ├── styles/maison-theme.css (tema completo)
│   ├── components/
│   │   ├── layout/ (MainShell, CodeShell, Sidebar, CodeTopNav, Layout)
│   │   ├── dishes/ (DishCard)
│   │   └── api/ (CodeTerminal)
│   └── pages/
│       ├── Welcome.tsx (landing)
│       ├── Salao.tsx (gestão de mesas)
│       ├── Cardapio.tsx (menu/pedidos)
│       ├── Cozinha.tsx (kanban cozinha)
│       ├── ApiExplorer.tsx (teste de APIs)
│       ├── Arquitetura.tsx (diagrama interativo)
│       └── BrigadaCode, CodeModels, CodeCrud, CodeActions, CodeCache
├── public/images/ (dishes/ + ui/)
├── Dockerfile + nginx.conf
```

---

## 2. TEMA E PALETA DE CORES

### Tema Warm (Maison Décorée):
- `--walnut-900`: #2c1810 (marrom escuro)
- `--oak-400`: #b8956a (bronze)
- `--oak-100`: #f3ebe0 (creme claro)
- `--linen`: #fdfcfa (off-white)
- `--burgundy`: #722f37 (vinho)
- `--cta-primary`: #8f1f2e (crimson)

### Tema Kitchen (técnico):
- `--steel-900`: #1b1f23 (cinza escuro)
- `--flame`: #d4641a (laranja)
- `--herb-green`: #3d7a4a (verde)

### Badges por categoria:
- entree: #6f5331 | plat: #722f37 | dessert: #8f5e2c | fromage: #4f5f3c

---

## 3. PÁGINAS E COMPONENTES VISUAIS

### Welcome: Landing com imagem de fundo + overlay gradient, logo animado (Framer Motion), 3 CTAs
### Salão: Grid de mesas (2-5 colunas responsive), status visual (livre/ocupada/aguardando), side panel animado com pedidos
### Cardápio: Grid de DishCards com imagem, badge categoria, preço, tempo, rating. Filtros por categoria (tabs), modal de confirmação
### Cozinha: Layout Kanban 4 colunas (Fila→Preparando→Pronto→Servido), tickets estilo papel, auto-refresh 5s
### API Explorer: Grid 2 colunas (endpoints sidebar + editor), resposta JSON formatada
### Arquitetura: React Flow interativo com 6 serviços, 4 modos de visualização, minimap

---

## 4. COMPONENTES UI (Atomic Design)

**Atoms:** Buttons (.btn, .btn-primary, .btn-secondary, .btn-danger), Badges, Progress bars, Forms
**Moléculas:** Cards (.card), Grids (.grid-2, .grid-4), Status badges, Dish cards
**Organismos:** Modal animado, Sidebar (248px fixa), Main layout, Code terminal

---

## 5. INTERATIVIDADE E ANIMAÇÕES

- **Framer Motion:** fade-in logo, staggered text, spring slide-in panel, AnimatePresence
- **CSS:** hover translateY -1px, fade-in 0.35s, background transitions 0.25s
- **Interações:** click mesa → panel slide, filtros cardápio, drag em React Flow, auto-refresh cozinha

---

## 6. RESPONSIVIDADE

- Breakpoints: md:768px, lg:1024px, xl:1280px
- Grid pratos: `repeat(auto-fit, minmax(350px, 420px))`
- Grid mesas: `grid-cols-2 md:grid-cols-4 xl:grid-cols-5`
- Sidebar: sticky desktop, collapse mobile

---

## 7. PADRÕES DE CÓDIGO

- useState + useEffect + useMemo hooks
- Fetch API nativo para HTTP
- Auto-refresh com setInterval + cleanup
- NavLink com className dinâmico ({isActive})
- TypeScript interfaces: Dish, HallTable, KitchenTicket

---

## 8. NÍVEL DE SOFISTICAÇÃO: ELEVADO

**Forças:** Tema coeso e elegante, tipografia premium, animações sutis, layouts complexos (Kanban, diagrama), responsividade sólida, componente educativo integrado
**Oportunidades:** Sem framework UI (shadcn etc), sem dark mode toggle, sem lazy loading, sem Context API/Redux

---

## 9. UX FLOW

**Cliente:** Welcome → Salão (ver mesas) → Selecionar mesa → Adicionar pedido → Liberar para cozinha
**Cardápio:** Grid de pratos → Filtrar categoria → Selecionar → Confirmar
**Cozinha:** Kanban → Fila → Preparando → Pronto → Servido
**Dev:** API Explorer → Testar endpoints → Arquitetura → Code labs
