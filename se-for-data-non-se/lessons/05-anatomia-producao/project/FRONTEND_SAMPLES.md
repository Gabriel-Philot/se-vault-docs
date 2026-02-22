# Frontend Samples — Palantír UI Design Prompt

Prompt de design para pré-visualização das páginas no Google Data Studio e referência para implementação.

---

## Navegação: Landing Page Hero + Top Nav (Padrão Restaurante)

**SEM SIDEBAR.** Seguir o padrão do Le Philot API Cuisine:
- `/` = Landing page hero com mapa SVG da Terra-Média e botões para cada seção
- Páginas internas = Top nav bar sticky com backdrop-blur e links para todas as seções
- Logo "Palantír" à esquerda, links à direita na top bar

---

## Fontes Externas de Componentes Modernos

### ReactBits.dev (https://reactbits.dev)
Biblioteca open source de componentes animados para React. Todos disponíveis em 4 variantes: JS-CSS, JS-TW, TS-CSS, TS-TW.

#### Text Animations (recomendados para Palantír)
| Componente | Uso no Palantír | URL |
|---|---|---|
| **Blur Text** | Títulos de seção aparecendo com blur | `/text-animations/blur-text` |
| **Shiny Text** | "Palantír" no header com efeito brilhante | `/text-animations/shiny-text` |
| **Decrypted Text** | Status de missões revelando resultado | `/text-animations/decrypted-text` |
| **Count Up** | Métricas animadas (requests/s, cache hits) | `/text-animations/count-up` |
| **Glitch Text** | Erros/failures com efeito glitch | `/text-animations/glitch-text` |
| **Gradient Text** | Headers com gradiente dourado | `/text-animations/gradient-text` |
| **Scrambled Text** | Loading states temáticos | `/text-animations/scrambled-text` |
| **Rotating Text** | Status alternando (PENDING/STARTED/SUCCESS) | `/text-animations/rotating-text` |
| Split Text | Títulos de página entrando letra por letra | `/text-animations/split-text` |
| Circular Text | Badge circular "Palantír Active" | `/text-animations/circular-text` |
| Text Cursor | Terminal-like typing effect | `/text-animations/text-cursor` |
| Fuzzy Text | Hover em elementos misteriosos | `/text-animations/fuzzy-text` |
| Scroll Float | Texto flutuando no scroll | `/text-animations/scroll-float` |
| Scroll Reveal | Seções aparecendo ao scrollar | `/text-animations/scroll-reveal` |
| ASCII Text | Terminal vibes nos code blocks | `/text-animations/ascii-text` |
| True Focus | Foco em palavras-chave | `/text-animations/true-focus` |
| Variable Proximity | Texto reagindo ao mouse | `/text-animations/variable-proximity` |

#### Animations (recomendados para Palantír)
| Componente | Uso no Palantír | URL |
|---|---|---|
| **Electric Border** | Cards de missão ativa com borda elétrica | `/animations/electric-border` |
| **Star Border** | Card de missão completada com sucesso | `/animations/star-border` |
| **Animated Content** | Transições entre estados de missão | `/animations/animated-content` |
| **Fade Content** | Page transitions suaves | `/animations/fade-content` |
| **Pixel Transition** | Transição entre páginas estilo portal | `/animations/pixel-transition` |
| **Glare Hover** | Hover nos cards de serviço | `/animations/glare-hover` |
| **Ribbons** | Background decorativo na landing page | `/animations/ribbons` |
| **Noise** | Textura de ruído no background | `/animations/noise` |
| Click Spark | Feedback visual ao clicar botões | `/animations/click-spark` |
| Magnet Lines | Efeito magnético nos nodes do diagrama | `/animations/magnet-lines` |
| Metallic Paint | Efeito metálico no mapa SVG | `/animations/metallic-paint` |
| Laser Flow | Conexões animadas no diagrama de arquitetura | `/animations/laser-flow` |
| Cubes | Loading state 3D | `/animations/cubes` |
| Shape Blur | Shapes decorativas no background | `/animations/shape-blur` |
| Gradual Blur | Blur progressivo em elementos de fundo | `/animations/gradual-blur` |

#### Components (recomendados para Palantír)
| Componente | Uso no Palantír | URL |
|---|---|---|
| **Spotlight Card** | Cards de serviço no dashboard com spotlight | `/components/spotlight-card` |
| **Animated List** | Lista de missões atualizando em tempo real | `/components/animated-list` |
| **Counter** | Contadores animados de métricas | `/components/counter` |
| **Stepper** | Progress steps das missões Celery | `/components/stepper` |
| **Pixel Card** | Cards com efeito pixel para serviços | `/components/pixel-card` |
| Fluid Glass | Cards com efeito glass morphism | `/components/fluid-glass` |
| Glass Surface | Superfície glass para painéis | `/components/glass-surface` |
| Tilted Card | Cards inclinados para heróis do leaderboard | `/components/tilted-card` |
| Decay Card | Card de missão que falhou | `/components/decay-card` |
| Stack | Stack de cards para missões na fila | `/components/stack` |
| Bounce Cards | Cards dos heróis no leaderboard | `/components/bounce-cards` |
| Reflective Card | Cards com reflexo para top 3 heróis | `/components/reflective-card` |
| Profile Card | Card de herói individual | `/components/profile-card` |
| Card Swap | Animação ao reordenar leaderboard | `/components/card-swap` |
| Carousel | Carousel de regiões da Terra-Média | `/components/carousel` |
| Staggered Menu | Menu mobile com stagger | `/components/staggered-menu` |

#### Backgrounds (recomendados para Palantír)
| Componente | Uso no Palantír | URL |
|---|---|---|
| **Aurora** | Background da landing page — aurora boreal élfica | `/backgrounds/aurora` |
| **Particles** | Partículas flutuando no dashboard | `/backgrounds/particles` |
| **Dark Veil** | Overlay escuro sobre o mapa | `/backgrounds/dark-veil` |
| **Lightning** | Background na página de missões (tempestade) | `/backgrounds/lightning` |
| **Galaxy** | Background alternativo — estrelas | `/backgrounds/galaxy` |
| Threads | Conexões thread-like no diagrama | `/backgrounds/threads` |
| Liquid Chrome | Efeito líquido metálico | `/backgrounds/liquid-chrome` |
| Beams | Feixes de luz no Palantír | `/backgrounds/beams` |
| Waves | Ondas no footer ou divisores | `/backgrounds/waves` |
| Grid Distortion | Grid distorcido como fundo | `/backgrounds/grid-distortion` |
| Iridescence | Efeito iridescente no Palantír orb | `/backgrounds/iridescence` |
| Silk | Textura de seda para backgrounds suaves | `/backgrounds/silk` |
| Floating Lines | Linhas flutuantes no background | `/backgrounds/floating-lines` |
| Light Pillar | Pilares de luz (Faróis de Gondor!) | `/backgrounds/light-pillar` |
| Dither | Efeito dither vintage | `/backgrounds/dither` |
| Dot Grid | Grid de pontos sutil | `/backgrounds/dot-grid` |
| Hyperspeed | Efeito hyperspeed para "trace a request" | `/backgrounds/hyperspeed` |

### 21st.dev (https://21st.dev/community/components)
Componentes community-made de alta qualidade. Destaques relevantes:

| Categoria | Quantidade | Relevância para Palantír |
|---|---|---|
| **Shaders** | 15 componentes | Backgrounds imersivos, efeitos WebGL |
| **Cards** | 79 variantes | Cards de serviço, missão, herói |
| **Buttons** | 130 opções | CTAs temáticos com animação |
| **Sidebars** | Diversos | Se precisar de nav alternativa |
| **Navigation Menus** | Diversos | Top nav animada |
| **Spinner Loaders** | Diversos | Loading states temáticos |
| **Badges** | Diversos | Status badges (PENDING, SUCCESS, etc) |
| **Tabs** | Diversos | Tabs para seções do Library |
| **Tooltips** | Diversos | Info popups no diagrama |
| **Toggles** | Diversos | Switches para configurações |
| **Backgrounds** | Diversos | Hero backgrounds |

---

## Páginas — Descrição Visual Detalhada

### Página 1: Landing Page — O Palantír (/)

**Layout:** Full-screen hero, sem top nav (aparece só nas internas)

**Background:**
- ReactBits `Aurora` ou `Particles` com cores douradas (#c9a84c, #ffd700) sobre fundo escuro (#1a1714)
- Alternativa: `Light Pillar` para simular os Faróis de Gondor
- Overlay gradient: `from-black/60 via-transparent to-black/80`

**Centro da tela:**
- Orbe do Palantír: SVG circular com `Iridescence` ou glow pulsante (#ffd700)
- Efeito de `Shiny Text` no título "Palantír" com fonte Cinzel
- Subtítulo "Central de Comando da Terra-Média" com `Blur Text` fade-in
- Container com `backdrop-blur-md` e `border border-white/20`

**Botões de navegação (CTAs):**
```
[ Mapa da Terra-Média ]  [ Missões ]  [ Biblioteca ]  [ Arquitetura ]
     (dourado)             (verde)      (azul)          (pergaminho)
```
- Botão principal: `bg-[#c9a84c] hover:bg-[#d4b85a]` (Ouro de Gondor)
- Botões secundários: `border border-[#c9a84c]/40 bg-black/20 hover:bg-black/35`
- Tipografia: `text-sm font-semibold uppercase tracking-[0.18em]`
- Animação: `motion.div` com `initial={{ opacity: 0, y: 14 }}` staggered

**Métricas rápidas (abaixo dos CTAs):**
- 4 mini-cards em row: "6 Serviços", "4 Workers", "Cache: 89%", "5 Missões"
- ReactBits `Counter` para animar os números
- Cards com `Glare Hover` ou `Spotlight Card`

**Footer da landing:**
- Texto sutil: "docker compose up --build" com `Text Cursor` animation
- Link "Ver Arquitetura Completa" em Azul Palantír

---

### Página 2: Dashboard — Mapa da Terra-Média (/dashboard)

**Layout:** Top nav (MainShell) + conteúdo full-width

**Top nav bar:**
- Sticky, `bg-[#1a1714]/85 backdrop-blur border-b border-[#c9a84c]/15`
- Logo Palantír à esquerda (orbe pequeno + "Palantír")
- Links: Dashboard | Missões | Biblioteca | Arquitetura
- Active state: `bg-[#c9a84c]/20 text-[#c9a84c]`

**Mapa SVG (2/3 da tela):**
- SVG estilizado minimalista da Terra-Média
- Locais como nodes interativos:
  - **Minas Tirith** (esquerda): ícone de portão, pulsa com requests
    - Badge: "Gateway: 10 req/s"
    - Cor: Ouro quando ativo, cinza quando idle
  - **A Cidadela** (centro-esquerda): ícone de torre, mostra workers
    - Badge: "4 Workers Ativos"
    - Cor: Verde Élfico quando todos up
  - **Rivendell** (norte): ícone de livro, cache stats
    - Badge: "Cache: 89% hit rate"
    - Cor: Azul Palantír
  - **Erebor** (leste): ícone de forja, celery stats
    - Badge: "2 Tasks na fila"
    - Cor: Laranja quando processando
- Linhas conectando os locais (SVG paths) com `Laser Flow` animation
- Background do mapa: `Dot Grid` ou `Grid Distortion` sutil

**Painel de métricas (1/3 da tela, lado direito):**
- Cards empilhados com `Spotlight Card`:
  - Requests/segundo (ReactBits `Count Up`)
  - Cache hit rate (barra de progresso circular)
  - Workers ativos (ícones de escudo)
  - Tasks na fila (animação de contagem)
  - Uptime dos serviços
- Polling a cada 2s com transição suave

**Service Health (bottom):**
- Row de semáforos:
  ```
  [Nginx ●] [Gunicorn ●] [Redis ●] [Celery ●] [Postgres ●] [Frontend ●]
  ```
- Verde = up, Vermelho = down, Amarelo = degraded
- `Electric Border` no card com problemas

---

### Página 3: Missões — Filas com Celery (/missoes)

**Layout:** Top nav + 2 colunas (launcher + tracker)

**Coluna esquerda — Mission Launcher:**
- Header: "Enviar Missão" com ícone de águia (Lucide `Bird` ou `Send`)
- 3 cards de missão com `Glare Hover`:
  - **Reconhecimento em Mordor** (vermelho escuro)
    - "Missão perigosa. ~5 segundos."
    - Ícone: olho (Lucide `Eye`)
    - Tag: "Longa"
  - **Consultar os Elfos** (azul)
    - "Sabedoria ancestral. ~3 segundos."
    - Ícone: árvore (Lucide `TreePine`)
    - Tag: "Média"
  - **Enviar Corvo Mensageiro** (cinza claro)
    - "Mensagem rápida. ~1 segundo."
    - Ícone: pássaro (Lucide `Bird`)
    - Tag: "Rápida"
- Cada card é clicável para lançar a missão
- Botão especial: "Convocar a Sociedade" (lança 5 de uma vez)
  - `bg-gradient-to-r from-[#c9a84c] to-[#d4b85a]`
  - Ícone: escudo (Lucide `Shield`)

**Coluna direita — Mission Tracker:**
- `Animated List` do ReactBits para missões ativas
- Cada missão é um card com:
  - Nome da missão + ícone
  - `Stepper` do ReactBits mostrando etapas:
    ```
    PENDING → STARTED → PROCESSING → SUCCESS
       ○         ●          ◐           ○
    ```
  - Progress bar com % e nome do step atual
  - Worker que pegou (hostname)
  - Tempo decorrido
- Estados visuais:
  - PENDING: card com borda cinza, `Scrambled Text` no status
  - STARTED: card com borda azul, ícone girando
  - PROCESSING: card com `Electric Border`, progress bar animada
  - SUCCESS: card com borda verde, `Star Border`, check mark
  - FAILURE: card com borda vermelha, `Decay Card`, "Orc interceptou!"
  - RETRY: card piscando, "Tentando novamente..."

**Bottom — Mission History:**
- Tabela com últimas 10 missões completadas
- Colunas: Missão | Status | Duração | Worker | Retries
- Linhas com `Fade Content` ao aparecer

---

### Página 4: Biblioteca de Rivendell — Redis Patterns (/biblioteca)

**Layout:** Top nav + 3 seções verticais (tabs ou scroll)

**Tabs ou seção headers:**
```
[ Cache ]  [ Rate Limiting ]  [ Leaderboard ]
```

#### Seção 1: Cache Demo
- **Card "Consultar Pergaminhos":**
  - Dropdown para selecionar região: "Mordor", "Rohan", "Gondor", "Shire", "Rivendell"
  - Botão "Consultar" com ícone de livro
  - **Resultado — Cache MISS:**
    - Card opaco, borda cinza
    - Loading: "Consultando pergaminhos antigos..." (2s spinner)
    - Badge vermelho: "MISS — 2.1s"
    - Texto: "Fonte: Pergaminhos (lento)"
  - **Resultado — Cache HIT:**
    - Card brilhante com `Spotlight Card` glow dourado
    - Instantâneo, sem spinner
    - Badge verde: "HIT — 3ms"
    - Texto: "Fonte: Biblioteca de Rivendell (cache!)"
  - **TTL Countdown:**
    - Barra de progresso diminuindo (30s → 0)
    - ReactBits `Count Up` (invertido) mostrando segundos restantes
    - Quando expira: "Pergaminho expirou da biblioteca"
    - Cor muda de verde → amarelo → vermelho conforme TTL diminui

#### Seção 2: Rate Limiting Demo
- **Card "O Grande Portão":**
  - Botão grande: "Bater no Portão" com ícone de porta
  - Contador visual:
    ```
    Batidas: ███░░ 3/5
    ```
  - A cada clique: animação de impacto, contador sobe
  - Headers mostrados:
    ```
    X-RateLimit-Remaining: 2
    X-RateLimit-Reset: 45s
    ```
  - **Ao exceder (6a batida):**
    - Card fica vermelho com `Electric Border` vermelha
    - Mensagem: "O portão está fechado! Aguarde..."
    - Countdown visual até reset (ReactBits `Count Up`)
    - HTTP 429 response mostrado em mini-terminal
  - **Após reset:**
    - Card volta ao normal com `Fade Content`
    - "O portão foi reaberto"

#### Seção 3: Leaderboard Demo
- **Formulário "Registrar Feito":**
  - Input para nome do herói (pre-filled: "Aragorn", "Legolas", "Gimli", etc.)
  - Input para pontos (+10, +25, +50, +100)
  - Botão "Registrar Feito" com ícone de espada
- **Leaderboard:**
  - Top 10 com `Animated List` do ReactBits
  - Cada entry:
    ```
    #1  Aragorn     ████████████ 250 pts
    #2  Legolas     █████████    180 pts
    #3  Gimli       ███████      140 pts
    ```
  - Top 3 com cores especiais: ouro, prata, bronze
  - `Card Swap` animation quando posições mudam
  - `Bounce Cards` ou `Tilted Card` para o top 3
  - Novo registro: item aparece e "sobe" na lista com animação

---

### Página 5: Arquitetura — Diagrama Completo (/arquitetura)

**Layout:** Top nav + diagrama full-width + painel lateral

**Diagrama (SVG interativo):**
```
┌─────────────┐     ┌───────────────────┐     ┌──────────────────┐
│  Usuário     │────▶│  Nginx            │────▶│  Gunicorn        │
│  (Browser)   │     │  Grande Portão    │     │  A Cidadela      │
│  :5173       │     │  :80              │     │  :8000           │
└─────────────┘     └───────────────────┘     └──────┬───────────┘
                                                      │
                                               ┌──────▼───────────┐
                                               │  FastAPI          │
                                               │  Conselho Branco  │
                                               └──┬────┬──────────┘
                                                  │    │
                          ┌───────────────────────┘    └────────────────┐
                          ▼                                             ▼
                   ┌──────────────┐                              ┌──────────────┐
                   │  Redis        │                              │  PostgreSQL   │
                   │  Rivendell    │                              │  Minas Tirith │
                   │  :6379        │                              │  :5432        │
                   └──────┬───────┘                              └──────────────┘
                          │ (broker)
                          ▼
                   ┌──────────────┐     ┌──────────────┐
                   │  Celery Queue │────▶│  Workers      │
                   │  Faróis       │     │  As Águias    │
                   └──────────────┘     └──────────────┘
```

- Cada node é um card/box com:
  - Ícone temático (Lucide)
  - Nome do serviço
  - Porta
  - Status badge (verde/vermelho)
  - Hover: mostra detalhes (PID, uptime, etc.)
- Conexões: SVG lines com animação de partículas fluindo
  - `Laser Flow` do ReactBits nas conexões
  - Partículas douradas seguindo o path
- ReactBits `Hyperspeed` como efeito de fundo sutil

**Botão "Trace a Request":**
- Botão grande no topo: "Trace a Request" com ícone de rota
- Ao clicar:
  1. Dispara request real para `/api/architecture/trace`
  2. Anima cada etapa no diagrama:
     - Usuário → Nginx: "12ms" (highlight amarelo)
     - Nginx → Gunicorn: "3ms" (highlight verde)
     - Gunicorn → FastAPI: "1ms"
     - FastAPI → Redis: "2ms" (cache hit/miss destaque)
     - Worker PID mostrado no node do Gunicorn
  3. Total: "18ms total" badge no final
- Partícula dourada percorre todo o path com timing real
- ReactBits `Electric Border` nos nodes conforme o trace passa

**Painel lateral — "Conexões com Aulas":**
- Cards didáticos:
  - "Lembra das portas? Nginx:80, API:8000, Redis:6379, Postgres:5432"
  - "Lembra do REST? Mesmo FastAPI, agora com todas as camadas"
  - "Cache-aside é o mesmo padrão da Biblioteca de Rivendell"

---

## Componentes Shared

### GlowCard
```
Card com borda sutil dourada (#c9a84c/20), backdrop-blur,
hover: borda brilha mais (#ffd700/40), sombra dourada expande.
Variantes: default, success (verde), danger (vermelho), info (azul).
```

### StatusBadge
```
Badge pequeno com dot colorido + texto.
Variantes: online (verde), offline (vermelho), warning (amarelo),
           pending (cinza pulsante), processing (azul giratório).
```

### AnimatedCounter
```
Número que anima de 0 até o valor final.
Usa ReactBits Counter ou Count Up.
Props: value, duration, prefix ("$"), suffix ("%", "ms", "req/s").
```

---

## Paleta CSS (Tailwind Custom)

```ts
// tailwind.config.ts — extend colors
colors: {
  parchment: {
    50: '#f5efe5',
    100: '#e8dcc8',
    200: '#d4c4a8',
    700: '#8a7e6b',
    900: '#1a1714',
    950: '#0d0d0d',
  },
  gondor: {
    400: '#d4b85a',
    500: '#c9a84c',
    600: '#b8953f',
    glow: '#ffd700',
  },
  elven: {
    400: '#5cb87a',
    500: '#4a9e6e',
    600: '#3d8a5e',
  },
  palantir: {
    400: '#6e9ec8',
    500: '#5b8fb9',
    600: '#4d7da6',
  },
  mordor: {
    400: '#d44637',
    500: '#c0392b',
    600: '#a63125',
  },
  earth: {
    800: '#2a2520',
    900: '#1a1714',
    950: '#0f0c0a',
  },
},
fontFamily: {
  display: ['Cinzel', 'serif'],      // Headings medievais
  body: ['Inter', 'sans-serif'],      // UI legível
  mono: ['JetBrains Mono', 'monospace'], // Code
},
```

---

## Animações Framer Motion — Padrões

```tsx
// Page entrance
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};
const pageTransition = { duration: 0.35, ease: "easeOut" };

// Card hover
const cardHover = {
  whileHover: { scale: 1.02, boxShadow: "0 0 20px rgba(201,168,76,0.3)" },
  transition: { duration: 0.2 },
};

// Stagger children (lista de missões, leaderboard)
const containerVariants = {
  animate: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
};

// Pulse glow (serviço ativo)
const glowPulse = {
  animate: {
    boxShadow: [
      "0 0 5px rgba(255,215,0,0.2)",
      "0 0 20px rgba(255,215,0,0.4)",
      "0 0 5px rgba(255,215,0,0.2)",
    ],
  },
  transition: { duration: 2, repeat: Infinity },
};

// Progress bar fill
const progressFill = {
  initial: { width: "0%" },
  animate: { width: `${progress}%` },
  transition: { duration: 0.5, ease: "easeOut" },
};
```

---

## Responsividade

- **Desktop (>1024px):** Layout completo, mapa grande, 2 colunas
- **Tablet (768-1024px):** Mapa stack acima das métricas, 1 coluna
- **Mobile (<768px):** Top nav vira hamburger, cards stack vertical, mapa simplificado

---

## Fontes — Google Fonts

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

## Elementos Dinâmicos React Modernos

### Além do ReactBits — Técnicas Avançadas

**1. Optimistic Updates (Missões)**
- Ao lançar missão: card aparece imediatamente como PENDING
- Background fetch atualiza com task_id real
- Se falhar: card faz shake animation e mostra erro

**2. Polling com Exponential Backoff**
- Dashboard: poll a cada 2s
- Missão ativa: poll a cada 500ms
- Missão concluída: para de pollar
- Usa `useEffect` com cleanup

**3. Intersection Observer (Scroll Animations)**
- Seções da Library aparecem com `Scroll Reveal` ao entrar no viewport
- Leaderboard items animam com `staggerChildren` quando visíveis

**4. CSS Container Queries**
- Cards se adaptam ao container, não ao viewport
- Permite reutilizar cards em diferentes layouts

**5. View Transitions API (React Router)**
- Transições suaves entre páginas usando `document.startViewTransition`
- Opcional, progressive enhancement

**6. Suspense + Lazy Loading**
- Cada página é `React.lazy()` com Suspense boundary
- Loading fallback: skeleton com `Shimmer` effect dourado

**7. Custom Hooks**
```tsx
useMission(id)        // Poll status de uma missão
useServiceHealth()    // Health check de todos os serviços
useCacheDemo(region)  // Cache hit/miss com timing
useLeaderboard()      // Leaderboard em tempo real
useRateLimit()        // Estado do rate limiter
useRequestTrace()     // Trace animado de um request
```

**8. SVG Animations (Mapa + Diagrama)**
- SVG `<path>` com `stroke-dasharray` + `stroke-dashoffset` animados
- Partículas seguindo paths com `<animateMotion>`
- Glow filters com `<feGaussianBlur>` + `<feColorMatrix>`
- Hover: node expande, tooltip aparece com `AnimatePresence`

**9. WebSocket-ready Architecture**
- Polling agora, mas estrutura pronta para WebSocket
- Custom hook `useRealtimeData(endpoint, interval)` abstraindo a estratégia

**10. Skeleton Loading**
- Cada card tem skeleton variant
- Shimmer dourado (#c9a84c → #ffd700 → #c9a84c) em loop
- Aparece enquanto dados carregam na primeira vez
