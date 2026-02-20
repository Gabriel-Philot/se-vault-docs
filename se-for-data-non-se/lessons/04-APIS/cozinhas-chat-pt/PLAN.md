# Plan: cozinhas-chat

## Context

The petshop project at `04-APIS/petshop/` is a complete full-stack educational platform teaching REST APIs (FastAPI + PostgreSQL + Redis + React + Nginx + Python executor). The `front-end-play/docs/` directory contains a Maison Doree visual identity: dual-palette design system (warm dining room + clinical kitchen), Playfair Display/Inter/JetBrains Mono typography, and 3 Stitch prototype screenshots.

**Goal:** Create `04-APIS/cozinhas-chat/` merging the petshop's full didactic architecture with the Maison Doree's visual identity, re-themed as a kitchen/restaurant. Same architecture, same docker-compose structure, everything self-contained in the new folder.

---

## Domain Translation

| Petshop | Cozinhas-chat |
|---------|--------------|
| `Pet` (name, species, age, hunger_level, happiness, status) | `Dish` (name, category, price, preparation_time, freshness, popularity, status) |
| Species: dog/cat/bird/hamster | Category: entree/plat/dessert/fromage |
| hunger_level (0-100) | freshness (0-100) |
| happiness (0-100) | popularity (0-100) |
| status: awake/sleeping | status: available/archived |
| feed (hunger -30, happiness +5) | prepare (freshness +30, popularity +5) |
| play (happiness +25, hunger +10) | serve (popularity +25, freshness -10) |
| sleep (status=sleeping) | archive (status=archived) |
| wake (status=awake) | reactivate (status=available) |

Pages: Dashboard -> Salon, PetManager -> La Carte, ApiExplorer -> La Cuisine, DatabaseExplorer -> Le Cellier, Architecture -> Le Plan, CodeLab -> La Brigade. All UI text in French.

---

## Task Breakdown

### Phase 0: Project Setup

**T0a - Create `cozinhas-chat/PLAN.md`** - Save this implementation plan inside the new project folder at `04-APIS/cozinhas-chat/PLAN.md`

**T0b - Create `cozinhas-chat/IMAGE_PROMPTS.md`** - Nano Banana prompts for all required images (5 dish photos + sidebar logo + empty plate + optional kitchen bg)

### Phase 1: Infrastructure (parallel, no deps)

**T1 - docker-compose.yml**
- Mirror petshop's compose: frontend, api, db (postgres 16), redis 7, executor
- Network: `cozinhas-net`, DB creds: `cozinhas/cozinhas/cozinhas`
- Source ref: `petshop/docker-compose.yml`

**T2 - db/init.sql**
- `dishes` table (id, name, category, price, preparation_time, freshness, popularity, status, timestamps)
- `activity_log` table (same as petshop)
- Indexes on dishes(status, category), activity_log(dish_id, created_at)
- 5 seed dishes: Filet de Boeuf Rossini, Saumon a l'Oseille, Soupe a l'Oignon, Fondant au Chocolat, Plateau de Fromages

**T3 - executor/** (copy from petshop, no changes needed)
- `main.py`, `Dockerfile`, `requirements.txt` - identical to petshop

**T4 - frontend build config**
- `package.json`, `tsconfig.json`, `vite.config.ts`, `Dockerfile`, `index.html`
- `index.html` loads Google Fonts: Playfair Display, Inter, JetBrains Mono

### Phase 2: API Backend

**T5 - API core** (`api/Dockerfile`, `pyproject.toml`, `src/database.py`, `src/models.py`, `src/services/cache.py`)
- Same stack: FastAPI + SQLModel + asyncpg + redis
- `Dish` model with Category enum, `DishCreate`/`DishUpdate`/`DishResponse`/`DishListResponse`/`StatsResponse`/`ActivityResponse` schemas
- Cache service: rename to `invalidate_dishes_cache()`, key patterns `list_dishes:*`, `get_stats:*`
- Source refs: `petshop/api/src/models.py`, `petshop/api/src/services/cache.py`, `petshop/api/src/database.py`

**T6 - API routes** (`src/routes/dishes.py`, `actions.py`, `stats.py`, `sql.py`, `src/main.py`)
- `dishes.py`: Full CRUD on `/dishes` with filters (category, min_price, max_price, min_popularity), pagination, sorting, caching
- `actions.py`: prepare/serve/archive/reactivate on `/dishes/{id}/ACTION`
- `stats.py`: GET /stats (total, avgs, by_category), GET /activity
- `sql.py`: identical to petshop (read-only SQL execution)
- `main.py`: wire all routers, CORS, lifespan, health endpoint
- Source refs: `petshop/api/src/routes/pets.py`, `petshop/api/src/routes/actions.py`, `petshop/api/src/routes/stats.py`, `petshop/api/src/routes/sql.py`, `petshop/api/src/main.py`

### Phase 3: Nginx

**T7 - frontend/nginx.conf**
- Reverse proxy: `/` -> static files, `/api/` -> api:8000, `/executor/` -> executor:8001
- Rate limiting, gzip, SPA fallback
- Source ref: `petshop/frontend/nginx.conf`

### Phase 4: Frontend Design System

**T8 - CSS design system** (`src/index.css`, `src/styles/maison-theme.css`)
- `index.css`: reset, base component classes (card, btn, badge, table, modal, stat-card, code-block, lesson-box)
- `maison-theme.css`: dual-palette CSS custom properties from Maison Doree spec
  - Dining Room: walnut-900 to oak-50, linen, burgundy
  - Kitchen: steel-900 to porcelain, flame, herb-green
  - `.zone-kitchen` class swaps all semantic vars at once
  - Sidebar: warm oak/walnut, gold left-border on active links
  - Micro-animations: fadeIn, hover elevation, transitions
  - `border-radius: 6px`, subtle box-shadows, thin gold rules
- Source ref: `front-end-play/docs/implementation_plan.md` (all tokens), `petshop/frontend/src/index.css`

### Phase 5: Frontend Components

**T9 - Layout & Sidebar** (`src/components/layout/Layout.tsx`, `Sidebar.tsx`)
- Layout: auto-detects zone (kitchen routes: /cuisine, /plan, /brigade, /code/) and applies `.zone-kitchen` class
- Sidebar: two sections (SALON + CUISINE), CODE PILLARS sub-section, all Lucide icons, Playfair Display logo
- Source ref: `petshop/frontend/src/components/layout/Layout.tsx`, `Sidebar.tsx`

**T10 - DishCard & CodeTerminal** (`src/components/dishes/DishCard.tsx`, `src/components/api/CodeTerminal.tsx`)
- DishCard: category badge (color-coded), price, freshness/popularity bars, action buttons with Lucide icons
- CodeTerminal: steel-palette terminal (steel-800 bg), flame/herb-green accents
- Source ref: `petshop/frontend/src/components/PetCard.tsx`, `petshop/frontend/src/components/api/CodeTerminal.tsx`

### Phase 6: Frontend Pages

**T11 - Salon (Dashboard)** - 4 stat cards + activity feed + dishes table. Warm palette. Fetches /api/stats, /api/dishes, /api/activity.

**T12 - La Carte (CRUD)** - Category filter tabs, dish card grid with dish photos from `/images/dishes/`, create/edit modal. Burgundy CTA button. Matches La Carte prototype. Falls back to `/images/ui/empty-plate.png` when no photo exists.

**T13 - La Cuisine (API Explorer)** - Kitchen zone. Left: endpoint list grouped (Carte & Menus, Service en Salle, La Cave, Statistiques). Right: request builder + JSON response viewer. Matches La Cuisine prototype (dark terminal).

**T14 - Le Cellier (DB Explorer)** - SQL editor with pre-built kitchen queries. Warm dining palette. `<Wine />` icon.

**T15 - Le Plan (Architecture)** - Interactive SVG diagram of Docker services. Kitchen palette. All emojis replaced with Lucide icons. French labels. Same flow explanations (cache read, write+invalidation, code execution).

**T16 - La Brigade (CodeLab)** - 5 Python httpx exercises re-themed: list dishes, create dish, prepare, serve, check cache. Kitchen palette terminal.

**T17 - Code Pillars** (CodeModels, CodeCrud, CodeActions, CodeCache) - Display actual backend code with French explanations. Same didactic content as petshop but kitchen-themed.

**T18 - App.tsx + main.tsx** - Router setup with all routes, imports.

**T19 - IMAGE_PROMPTS.md** - Create `cozinhas-chat/IMAGE_PROMPTS.md` with Nano Banana prompts for all required images (5 dish photos + sidebar logo + empty plate placeholder + optional kitchen bg texture).

---

## Key Source Files

| File | Role |
|------|------|
| `petshop/docker-compose.yml` | Infrastructure template |
| `petshop/api/src/models.py` | Domain model template |
| `petshop/api/src/routes/*.py` | All route patterns |
| `petshop/api/src/services/cache.py` | Cache service template |
| `petshop/frontend/src/index.css` | CSS structure template |
| `petshop/frontend/src/pages/*.tsx` | All page templates |
| `petshop/frontend/src/components/**` | Component templates |
| `front-end-play/docs/implementation_plan.md` | Visual identity spec (all tokens) |
| `front-end-play/docs/stitch-prototypes/*.png` | Visual references |

## Image Assets

All dish photos and decorative images will live in `frontend/public/images/`. The code will reference them as `/images/<filename>`. You will generate these with Nano Banana and place them in the folder.

A separate prompts file is provided at `cozinhas-chat/IMAGE_PROMPTS.md` with ready-to-use prompts for each image.

### Image folder structure:
```
frontend/public/images/
  dishes/
    filet-boeuf-rossini.jpg      # Seed dish 1
    saumon-oseille.jpg            # Seed dish 2
    soupe-oignon.jpg              # Seed dish 3
    fondant-chocolat.jpg          # Seed dish 4
    plateau-fromages.jpg          # Seed dish 5
  ui/
    sidebar-logo.png              # Maison Doree logo/crest for sidebar
    empty-plate.png               # Placeholder for dishes without photo
    kitchen-bg.png                # Subtle background texture for kitchen zone (optional)
```

### Where images are used:
- **La Carte (T12)**: DishCard shows dish photo from `dishes/` folder, falls back to `empty-plate.png`
- **Salon (T11)**: Optional hero section or sidebar logo
- **Sidebar (T9)**: `sidebar-logo.png` as the Maison Doree wordmark/crest

---

## Output Structure (35+ files)

```
cozinhas-chat/
  docker-compose.yml
  IMAGE_PROMPTS.md                 # Prompts for Nano Banana image generation
  db/init.sql
  executor/ (main.py, Dockerfile, requirements.txt)
  api/ (Dockerfile, pyproject.toml, src/{database,models,main}.py, src/services/cache.py, src/routes/{dishes,actions,stats,sql}.py)
  frontend/ (Dockerfile, nginx.conf, index.html, package.json, tsconfig.json, vite.config.ts)
  frontend/public/images/dishes/   # Dish photos (user-generated via Nano Banana)
  frontend/public/images/ui/       # UI assets (user-generated via Nano Banana)
  frontend/src/ (main.tsx, App.tsx, index.css, styles/maison-theme.css)
  frontend/src/components/ (layout/{Layout,Sidebar}.tsx, dishes/DishCard.tsx, api/CodeTerminal.tsx)
  frontend/src/pages/ (Salon, LaCarte, LaCuisine, LeCellier, LePlan, LaBrigade, CodeModels, CodeCrud, CodeActions, CodeCache).tsx
```

## Verification

1. `cd cozinhas-chat && docker compose up --build` - all 5 services start
2. `http://localhost` - Salon loads with warm palette, stat cards, activity feed
3. Navigate all 10 pages via sidebar - no console errors
4. Dining pages (Salon, La Carte, Le Cellier): warm walnut/oak palette
5. Kitchen pages (La Cuisine, Le Plan, La Brigade, Code*): steel/porcelain palette
6. CRUD on La Carte: create/edit/delete dishes works
7. Actions: prepare/serve/archive/reactivate with correct business logic
8. API Explorer: send requests, see responses with timing and cache indicators
9. Database Explorer: execute read-only SQL queries
10. Code Lab: run all 5 exercises via executor sandbox
11. Typography: Playfair Display headings, Inter body, JetBrains Mono code
12. Zero emojis - all Lucide React icons
