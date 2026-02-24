# Projeto Integrado — Palantír: Central de Comando da Terra-Média

## Contexto

O módulo 05 (Anatomia de uma Aplicação em Produção) tem 3 práticas separadas (Gunicorn, Redis, Celery). Agora precisamos de um **projeto integrado** que una todos os conceitos em uma aplicação real com frontend moderno e temática Senhor dos Anéis. O projeto segue o padrão dos módulos anteriores: OOP Playground (módulo 03) e Pet Shop (módulo 04).

---

## Conceito

**Palantír** — Uma central de comando da Terra-Média onde o aluno vê todas as camadas de produção funcionando juntas. A metáfora:

| Conceito Técnico | Metáfora LOTR |
|---|---|
| **Nginx** (reverse proxy + rate limiting) | **O Grande Portão de Minas Tirith** — todo request passa por ele |
| **Gunicorn** (multi-worker app server) | **A Cidadela** — múltiplos guardas (workers) atendendo requests |
| **FastAPI** (API) | **O Conselho Branco** — coordena tudo |
| **Redis** (cache + rate limit + leaderboard) | **Biblioteca de Rivendell** — conhecimento em memória |
| **PostgreSQL** (persistência) | **Os Salões de Minas Tirith** — registros permanentes gravados em pedra |
| **Celery** (task queue + workers) | **As Águias** — missões assíncronas enviadas e rastreadas |
| **Redis broker** | **Os Faróis de Gondor** — sinal passando de torre em torre |
| **Diagrama completo** | **Mapa da Terra-Média** — visualiza tudo conectado |

---

## Stack

| Componente | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | Python 3.12 + UV + FastAPI + Pydantic v2 |
| App Server | Gunicorn + UvicornWorker (4 workers) |
| Reverse Proxy | Nginx (rate limiting + load balancing) |
| Cache / Broker | Redis 7 |
| Database | PostgreSQL 16 (persistência de missões + leaderboard) |
| Task Queue | Celery |
| Containers | Docker Compose |
| Animations | Framer Motion |
| Icons | Lucide React |

---

## Estrutura de Pastas

```
05-anatomia-producao/project/
├── PLAN.md
├── README.md
├── docker-compose.yml
├── nginx/
│   └── nginx.conf
├── db/
│   └── init.sql              # Schema PostgreSQL (missões, heróis, métricas)
├── api/
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── src/
│       ├── main.py          # FastAPI app
│       ├── config.py         # Redis/Celery/Postgres config
│       ├── database.py       # SQLModel + async engine
│       ├── models.py         # Mission, Hero models (SQLModel)
│       ├── tasks.py          # Celery tasks (missões)
│       └── routes/
│           ├── missions.py   # Enqueue + track missions
│           ├── library.py    # Redis cache patterns
│           ├── gate.py       # Nginx/worker stats
│           └── architecture.py  # Diagram data
└── frontend/
    ├── Dockerfile
    ├── package.json
    ├── vite.config.ts
    ├── tailwind.config.ts
    ├── postcss.config.js
    ├── public/
    │   └── images/
    │       ├── ui/              # welcome-bg, palantir-orb, header-logo, map-bg, etc.
    │       ├── locations/       # minas-tirith, citadel, rivendell, erebor, etc.
    │       ├── heroes/          # aragorn, legolas, gimli, gandalf, etc. (10 avatares)
    │       └── regions/         # mordor, rohan, gondor, shire, rivendell (5 regiões)
    └── src/
        ├── App.tsx
        ├── main.tsx
        ├── index.css
        ├── components/
        │   ├── layout/
        │   │   ├── MainShell.tsx      # Top nav bar (padrão restaurante)
        │   │   └── Header.tsx
        │   ├── shared/
        │   │   ├── StatusBadge.tsx
        │   │   ├── AnimatedCounter.tsx
        │   │   └── GlowCard.tsx
        │   ├── dashboard/
        │   │   ├── MiddleEarthMap.tsx      # SVG mapa interativo
        │   │   ├── LiveMetrics.tsx         # Métricas em tempo real
        │   │   └── ServiceStatus.tsx       # Status dos serviços
        │   ├── missions/
        │   │   ├── MissionLauncher.tsx     # Formulário para enviar missões
        │   │   ├── MissionTracker.tsx      # Status polling (PENDING→SUCCESS)
        │   │   └── MissionHistory.tsx      # Histórico de missões
        │   ├── library/
        │   │   ├── CacheDemo.tsx           # Cache hit/miss visual
        │   │   ├── RateLimitDemo.tsx       # Rate limiting ao vivo
        │   │   └── LeaderboardDemo.tsx     # Leaderboard de heróis
        │   └── architecture/
        │       ├── FlowDiagram.tsx         # Diagrama animado completo
        │       └── RequestTracer.tsx       # Trace de um request
        └── pages/
            ├── Welcome.tsx                 # Landing page hero (padrão restaurante)
            ├── Dashboard.tsx               # Mapa + métricas ao vivo
            ├── Missions.tsx                # Celery tasks
            ├── Library.tsx                 # Redis patterns
            └── Architecture.tsx            # Diagrama completo
```

---

## Páginas

### 0. Welcome — Landing Page Hero (/)

Seguindo o padrão do Restaurante (cozinhas-chat-pt): **SEM SIDEBAR**, landing page hero + top nav nas internas.

- **Background animado** (Aurora/Particles do ReactBits com cores douradas)
- **Orbe do Palantír** central com glow pulsante
- **Título** "Palantír" com fonte Cinzel + efeito Shiny Text
- **Subtítulo** "Central de Comando da Terra-Média"
- **4 botões CTA** para cada seção: Dashboard, Missões, Biblioteca, Arquitetura
- **Mini-métricas** rápidas: "6 Serviços", "4 Workers", "Cache: 89%"
- **MainShell.tsx** = Top nav bar sticky com backdrop-blur (aparece nas páginas internas)

### 1. Dashboard — Mapa da Terra-Média (/dashboard)

Dashboard principal com:
- **Mapa SVG estilizado** da Terra-Média com os serviços como locais:
  - Minas Tirith (Nginx/Gateway) — pulsando com requests
  - A Cidadela (Gunicorn workers) — mostra quantos workers ativos
  - Rivendell (Redis) — cache hit rate
  - Erebor/Forjas (Celery workers) — tasks sendo processadas
- **Live Metrics sidebar**: requests/s, cache hit rate, active workers, tasks na fila
- **Service Health**: semáforos mostrando status de cada serviço
- Polling a cada 2s para atualizar métricas

### 2. Missões — Filas com Celery

Página interativa onde o aluno:
- **Lança missões** (tasks Celery) com formulário temático:
  - "Reconhecimento em Mordor" → task longa ~5s, com progresso
  - "Consultar os Elfos" → task média ~3s
  - "Enviar Corvo Mensageiro" → task rápida ~1s
- **Acompanha em tempo real**: cards com status animado (PENDING → STARTED → PROCESSING → SUCCESS)
  - Progress bar com steps nomeados e % de progresso
- **Disparo em lote**: botão "Convocar a Sociedade" que lança 5+ tasks simultaneamente
  - Visualiza workers dividindo as tasks
- **Retry visual**: 20% de chance de falha ("Orc interceptou!") com retry automático
- **Escalar workers**: instrução para `docker compose up --scale`

### 3. Biblioteca de Rivendell — Redis Patterns

Demonstra 3 padrões Redis visualmente:

**Cache (Cache-aside com TTL):**
- Buscar "conhecimento" sobre regiões da Terra-Média
- Primeira busca: lenta (2s = "consultando pergaminhos antigos")
- Segunda busca: instantânea (cache hit = "já estava na biblioteca!")
- Visual: card brilhando quando cached vs. opaco quando miss
- TTL countdown visual

**Rate Limiting:**
- Botão "Bater no portão" que faz requests
- Contador visual: 5 batidas permitidas por minuto
- Ao exceder: "O portão está fechado! Aguarde..." com countdown
- Mostra `X-RateLimit-Remaining`

**Leaderboard (Sorted Sets):**
- Ranking dos "Heróis da Terra-Média"
- Registrar feitos dos heróis (+pontos)
- Leaderboard atualiza em tempo real
- Top 10 com animação de posição

### 4. Arquitetura — Diagrama Completo Animado

A página mais didática:
- **Diagrama interativo** mostrando o fluxo completo:
  ```
  Usuário → Nginx (Grande Portão) → Gunicorn (Cidadela) → FastAPI (Conselho)
                                                               ↓
                                                   ┌───────────┼───────────┐
                                                   ↓           ↓           ↓
                                             Redis        PostgreSQL   Celery Queue
                                           (Rivendell)   (Minas Tirith)  (Faróis)
                                                                          ↓
                                                                     Worker (Águia)
  ```
- **"Trace a Request"**: botão que dispara um request real e anima cada etapa
  - Mostra latência em cada camada
  - Destaca cache hit/miss
  - Mostra qual worker Gunicorn pegou (PID)
- **Conecta com aula 01**: "Lembra das portas? Nginx:80, API:8000, Redis:6379"
- **Conecta com aula 04**: "Lembra do REST? Mesmo FastAPI, agora com todas as camadas"

---

## Visual Theme — Senhor dos Anéis

### Paleta de Cores

| Role | Color | Hex | Usage |
|---|---|---|---|
| Primary BG | Pergaminho escuro | `#1a1714` | Background principal |
| Secondary BG | Marrom terra-média | `#2a2520` | Cards, painéis |
| Accent 1 | Ouro de Gondor | `#c9a84c` | Botões, highlights, headings |
| Accent 2 | Verde Élfico | `#4a9e6e` | Success, cache hit, active |
| Accent 3 | Azul Palantír | `#5b8fb9` | Links, informações |
| Danger | Vermelho Mordor | `#c0392b` | Errors, failures, rate limit |
| Text primary | Pergaminho claro | `#e8dcc8` | Body text |
| Text secondary | Cinza Gandalf | `#8a7e6b` | Descrições, labels |
| Terminal BG | Negro de Moria | `#0d0d0d` | Code blocks |
| Glow | Ouro Anel | `#ffd700` | Hover effects, animações |

### Tipografia
- **UI**: Inter para legibilidade
- **Headings**: Cinzel (serif elegante, medieval mas legível)
- **Code**: JetBrains Mono

### Elementos Visuais
- Cards com borda sutil dourada e `backdrop-blur` (frosted glass)
- Top nav com ícones temáticos (espada = missões, livro = biblioteca, mapa = arquitetura)
- Animações suaves com Framer Motion (fade-in, slide, glow pulse)
- Status badges com cores vibrantes sobre fundo escuro
- Mapa SVG estilizado (minimalista/geométrico)
- Glowing borders em elementos interativos

---

## Assets de Imagem (Nano Banana)

**30 imagens** geradas via Nano Banana. Prompts completos em `PROMPT_ASSETS.md`.
Caminho base: `frontend/public/images/`

### UI Backgrounds e Elementos (`images/ui/`)

| Arquivo | Onde Usa | Integração no Componente |
|---|---|---|
| `welcome-bg.png` | **Welcome.tsx** `/` | `background-image` do container hero full-screen, com overlay gradient `from-black/60 via-transparent to-black/80` por cima |
| `palantir-orb.png` | **Welcome.tsx** `/` | `<motion.img>` centralizado com animação de glow pulsante (`animate: boxShadow`), também usado como favicon (`<link rel="icon">` no `index.html`) |
| `header-logo.png` | **MainShell.tsx** (top nav) | `<img>` 40x40px à esquerda do título "Palantír" no header, com `rounded-md` |
| `map-bg.png` | **Dashboard.tsx** `/dashboard` | `background-image` sutil por trás do mapa SVG interativo, com `opacity-30` para não competir com os nodes |
| `missions-bg.png` | **Missions.tsx** `/missoes` | `background-image` no container principal, com overlay escuro `bg-black/70`, muito sutil para dar atmosfera |
| `library-bg.png` | **Library.tsx** `/biblioteca` | `background-image` no container principal, com overlay `bg-black/75`, atmosfera de biblioteca élfica |
| `architecture-bg.png` | **Architecture.tsx** `/arquitetura` | `background-image` no container, overlay escuro, faróis acesos combinam com a temática de "sinal passando" |
| `parchment-texture.png` | **GlowCard.tsx** (shared) | `background-image` tileable dentro dos cards, `opacity-5` a `opacity-10`, dá textura de pergaminho aos cards sem poluir |

### Ícones de Locais/Serviços (`images/locations/`)

| Arquivo | Serviço | Onde Usa | Integração |
|---|---|---|---|
| `minas-tirith.png` | Nginx | **MiddleEarthMap.tsx** + **FlowDiagram.tsx** | Node do mapa SVG — `<image>` dentro do SVG com ~60x60px, hover expande e mostra tooltip com stats do Nginx |
| `citadel.png` | Gunicorn | **MiddleEarthMap.tsx** + **FlowDiagram.tsx** | Node do mapa — mostra badge com "N workers ativos", pulsa verde quando todos up |
| `rivendell.png` | Redis | **MiddleEarthMap.tsx** + **FlowDiagram.tsx** | Node do mapa — mostra badge com "cache hit rate: N%", brilha azul |
| `erebor.png` | Celery tasks | **MiddleEarthMap.tsx** + **FlowDiagram.tsx** | Node do mapa — mostra badge com "N tasks na fila", laranja quando processando |
| `gondor-beacons.png` | Redis broker | **FlowDiagram.tsx** | Apenas no diagrama de arquitetura — entre Redis e Celery Workers, animação de "chama passando" |
| `minas-tirith-db.png` | PostgreSQL | **FlowDiagram.tsx** | Apenas no diagrama de arquitetura — node de persistência, badge com "N registros" |
| `eagles.png` | Celery workers | **MissionTracker.tsx** + **FlowDiagram.tsx** | Ícone nos cards de missão ativa ("Águia #1 processando..."), no diagrama como node final |

### Avatares de Heróis (`images/heroes/`)

| Arquivo | Herói | Integração |
|---|---|---|
| `aragorn.png` | Aragorn | **LeaderboardDemo.tsx** — `<img>` circular 48x48px no ranking, `rounded-full border-2 border-gondor-500` para top 3 |
| `legolas.png` | Legolas | Idem — avatar no leaderboard |
| `gimli.png` | Gimli | Idem — avatar no leaderboard |
| `gandalf.png` | Gandalf | Idem — avatar no leaderboard |
| `frodo.png` | Frodo | Idem — avatar no leaderboard |
| `samwise.png` | Samwise | Idem — avatar no leaderboard |
| `boromir.png` | Boromir | Idem — avatar no leaderboard |
| `eowyn.png` | Eowyn | Idem — avatar no leaderboard |
| `faramir.png` | Faramir | Idem — avatar no leaderboard |
| `galadriel.png` | Galadriel | Idem — avatar no leaderboard |

Seed data do backend deve criar esses 10 heróis com nome + avatar path + pontuação inicial aleatória.
O `LeaderboardDemo.tsx` renderiza cada herói com `<img src={`/images/heroes/${hero.avatar}`}>`.
Top 3 do ranking recebem borda especial: ouro (#c9a84c), prata (#c0c0c0), bronze (#cd7f32).

### Ilustrações de Regiões (`images/regions/`)

| Arquivo | Região | Integração |
|---|---|---|
| `mordor.png` | Mordor | **CacheDemo.tsx** — card de região no dropdown, `<img>` 100% width no topo do card resultado, ganha glow dourado quando cached |
| `rohan.png` | Rohan | Idem — card de resultado da busca de região |
| `gondor.png` | Gondor | Idem — card de resultado da busca de região |
| `shire.png` | Shire | Idem — card de resultado da busca de região |
| `rivendell-region.png` | Rivendell | Idem — card de resultado da busca de região |

Cada card de região no `CacheDemo.tsx`:
- Imagem da região no topo (16:9, `rounded-t-lg`)
- Nome da região + descrição abaixo
- Badge "HIT" (verde brilhante) ou "MISS" (cinza opaco) no canto superior
- Card inteiro ganha `Spotlight Card` glow quando é cache HIT
- Card fica com `opacity-70` e borda cinza quando é cache MISS
- TTL countdown bar embaixo do card (verde → amarelo → vermelho)

### Integração no Build

Os assets ficam em `frontend/public/images/` e são servidos estaticamente pelo Vite (dev) e Nginx (prod).
Não precisam de import no código — acesso direto via path `/images/...`.

```tsx
// Exemplo de uso no Welcome.tsx
<div
  className="relative min-h-screen bg-cover bg-center"
  style={{ backgroundImage: "url('/images/ui/welcome-bg.png')" }}
>

// Exemplo de uso no LeaderboardDemo.tsx
<img
  src={`/images/heroes/${hero.avatar}`}
  alt={hero.name}
  className="h-12 w-12 rounded-full border-2 border-gondor-500 object-cover"
/>

// Exemplo de uso no CacheDemo.tsx
<img
  src={`/images/regions/${region.image}`}
  alt={region.name}
  className="w-full rounded-t-lg object-cover aspect-video"
/>

// Exemplo de uso no MiddleEarthMap.tsx (dentro do SVG)
<image
  href="/images/locations/minas-tirith.png"
  x={node.x} y={node.y}
  width="60" height="60"
/>
```

---

## Docker Compose (7 serviços)

```yaml
services:
  nginx:          # O Grande Portão (porta 80)
  api:            # Conselho Branco — Gunicorn + Uvicorn (4 workers)
  db:             # Minas Tirith — PostgreSQL 16 (persistência)
  redis:          # Biblioteca de Rivendell
  worker:         # Águia 1 (Celery)
  worker-2:       # Águia 2 (Celery)
  frontend:       # Palantír (React dev server, porta 5173)
```

PostgreSQL persiste: histórico de missões, leaderboard de heróis, métricas agregadas.
Redis continua como cache efêmero + broker do Celery + rate limiting.

Fluxo: `Browser:5173 → Nginx:80 → Gunicorn:8000 → FastAPI → Redis / Postgres / Celery Workers`

---

## API Endpoints

### Missions (Celery)
| Method | Path | Description |
|---|---|---|
| POST | `/api/missions/recon` | Reconhecimento (task longa ~5s, com progresso) |
| POST | `/api/missions/consult` | Consultar Elfos (task média ~3s) |
| POST | `/api/missions/raven` | Enviar Corvo (task rápida ~1s) |
| POST | `/api/missions/fellowship` | Lança 5 missões de uma vez |
| GET | `/api/missions/{id}` | Status de uma missão |
| GET | `/api/missions` | Lista missões recentes |

### Library (Redis)
| Method | Path | Description |
|---|---|---|
| GET | `/api/library/region/{name}` | Busca info de região (cache-aside) |
| POST | `/api/library/gate/knock` | Bater no portão (rate limited) |
| POST | `/api/library/heroes/{name}/feat` | Registrar feito de herói |
| GET | `/api/library/heroes/leaderboard` | Top 10 heróis |
| GET | `/api/library/stats` | Redis stats (keys, memory, hit rate) |

### Gate (Workers/Stats)
| Method | Path | Description |
|---|---|---|
| GET | `/api/gate/workers` | Info dos Gunicorn workers (PIDs) |
| GET | `/api/gate/stats` | Celery queue stats |
| GET | `/api/gate/health` | Health check de todos os serviços |

### Architecture
| Method | Path | Description |
|---|---|---|
| GET | `/api/architecture/trace` | Executa e traça um request (latências) |
| GET | `/api/architecture/diagram` | Dados para montar o diagrama |

---

## Fases de Implementação

### Fase 1: Fundação
1. Scaffold das pastas (api/, frontend/, nginx/, db/)
2. Docker Compose com todos os 7 serviços (incluindo PostgreSQL)
3. Nginx config (reverse proxy + rate limiting)
4. FastAPI app base com Gunicorn (4 workers)
5. PostgreSQL schema (missões, heróis) + Redis + Celery config
6. React scaffold com routing e layout (Welcome landing page + MainShell top nav)

### Fase 2: Backend
7. Celery tasks temáticas (recon, consult, raven) com progress tracking
8. Redis cache-aside para regiões da Terra-Média
9. Rate limiting endpoint
10. Leaderboard com sorted sets
11. Worker stats + health check
12. Architecture trace endpoint

### Fase 3: Frontend — Landing + Dashboard
13. Welcome landing page hero (orbe Palantír, CTAs, mini-métricas)
14. MainShell top nav bar (sticky, backdrop-blur, links)
15. Mapa SVG simplificado da Terra-Média
16. Live metrics (polling a cada 2s)
17. Service health indicators

### Fase 4: Frontend — Missions
18. MissionLauncher (formulário temático)
19. MissionTracker (status cards animados com polling)
20. Batch launcher ("Convocar a Sociedade")

### Fase 5: Frontend — Library
21. Cache demo (hit/miss visual com TTL countdown)
22. Rate limit demo (contador + bloqueio visual)
23. Leaderboard (ranking animado)

### Fase 6: Frontend — Architecture
24. Diagrama de fluxo animado (SVG/CSS)
25. Request tracer (dispara request real, anima camadas)

### Fase 7: Polish + README
26. Animações Framer Motion finais
27. README com instruções completas de teste
28. Teste end-to-end com docker compose

---

## Verificação

1. `docker compose up --build` — todos os 7 serviços sobem (incluindo PostgreSQL)
2. `http://localhost:5173` — Landing page hero carrega, navegar para Dashboard
3. Lançar missão → acompanhar PENDING → SUCCESS (ou RETRY)
4. Cache demo: primeira chamada lenta, segunda instantânea
5. Rate limit: 6a batida retorna 429
6. Leaderboard: registrar feitos e ver ranking
7. Architecture: trace mostra latência real em cada camada
8. `docker compose up --scale worker=4` — mais workers aparecem
9. Console sem erros JS, API retornando 200s

---

## Multi-Agent Build

Seguindo o padrão do OOP Playground (módulo 03):

| Agent | Escopo | Responsabilidade |
|---|---|---|
| **team-lead** | Tudo | Cria tasks, coordena, integra, testa com Playwright |
| **backend-dev** | api/ + nginx/ | FastAPI, Celery, Redis, Gunicorn, Nginx config |
| **frontend-dev** | frontend/ | React, componentes, animações, pages |

Workflow: team-lead cria tasks → backend-dev + frontend-dev trabalham em paralelo → team-lead integra e testa.

---

## Referências

| Projeto | O que reutilizar |
|---|---|
| **Cozinhas-chat-pt (módulo 04)** | **Frontend:** MainShell top nav, Welcome landing page hero, Framer Motion, visual moderno, Tailwind config. **Backend:** FastAPI structure, CRUD, cache decorator, Docker Compose multi-service com Postgres |
| Prática 01-gunicorn | Gunicorn config, Nginx reverse proxy, worker PID tracking |
| Prática 02-redis | Cache-aside, rate limiting, leaderboard (sorted sets) |
| Prática 03-celery | Task queue, retry com backoff, progress tracking |
