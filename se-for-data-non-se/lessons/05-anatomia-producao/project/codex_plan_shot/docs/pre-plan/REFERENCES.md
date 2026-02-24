# Referências de Código — Projetos Anteriores

Código extraído dos projetos existentes do curso para reutilizar padrões estabelecidos no Palantír.

---

## 1. Prática 01 — Gunicorn (Web Server vs App Server)

**Caminho:** `05-anatomia-producao/practices/01-gunicorn/`

### docker-compose.yml
```yaml
services:
  api:
    build: .
    ports:
      - "8000:8000"   # Acesso direto ao Gunicorn (para comparar)

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"       # Acesso via Nginx (como em produção)
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - api
```

### Dockerfile (Gunicorn + Uvicorn)
```dockerfile
FROM python:3.12-slim

WORKDIR /app

# Instala uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

# Copia dependências e instala
COPY pyproject.toml .
RUN uv sync --no-dev

COPY main.py .

# Gunicorn com Uvicorn workers — o padrão de produção
# - 4 workers (simula múltiplos processos)
# - bind em 0.0.0.0:8000
CMD ["uv", "run", "gunicorn", "main:app", \
     "--worker-class", "uvicorn.workers.UvicornWorker", \
     "--workers", "4", \
     "--bind", "0.0.0.0:8000", \
     "--access-logfile", "-"]
```

### pyproject.toml
```toml
[project]
name = "practice-gunicorn"
version = "0.1.0"
description = "Prática: Web Server vs App Server — Nginx + Gunicorn + Uvicorn + FastAPI"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn>=0.34.0",
    "gunicorn>=23.0.0",
]
```

### main.py (Worker PID tracking)
```python
import os
import time
from fastapi import FastAPI

app = FastAPI(title="Practice 01 — Gunicorn")

@app.get("/")
async def root():
    """Retorna info do worker que processou o request."""
    return {
        "message": "Hello from production!",
        "worker_pid": os.getpid(),
        "parent_pid": os.getppid(),
    }

@app.get("/workers")
async def workers_info():
    """Mostra detalhes do processo — útil para ver load balancing entre workers."""
    return {
        "worker_pid": os.getpid(),
        "parent_pid": os.getppid(),
        "explanation": (
            "Faça múltiplos requests a este endpoint. "
            "O worker_pid vai alternar entre os workers do Gunicorn. "
            "O parent_pid é sempre o mesmo (processo master do Gunicorn)."
        ),
    }

@app.get("/slow")
async def slow_endpoint():
    """Simula uma operação lenta (2s)."""
    time.sleep(2)
    return {
        "message": "Demorei 2 segundos",
        "worker_pid": os.getpid(),
    }

@app.get("/health")
async def health():
    return {"status": "ok"}
```

### nginx/nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    log_format upstream '$remote_addr - [$time_local] '
                        '"$request" $status '
                        'upstream: $upstream_response_time s';

    access_log /var/log/nginx/access.log upstream;

    # Rate limiting: 10 requests/segundo por IP
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    upstream gunicorn {
        server api:8000;
    }

    server {
        listen 80;

        location / {
            limit_req zone=api burst=20 nodelay;

            proxy_pass http://gunicorn;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_connect_timeout 30s;
            proxy_read_timeout 30s;
        }

        location /nginx-health {
            return 200 "nginx ok\n";
            add_header Content-Type text/plain;
        }
    }
}
```

---

## 2. Prática 02 — Redis Patterns

**Caminho:** `05-anatomia-producao/practices/02-redis-patterns/`

### docker-compose.yml
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
```

### Dockerfile
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml .
RUN uv sync --no-dev

COPY main.py .

CMD ["uv", "run", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### pyproject.toml
```toml
[project]
name = "practice-redis-patterns"
version = "0.1.0"
description = "Prática: Redis além de cache — feature store, rate limiting, session"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn>=0.34.0",
    "redis>=5.0.0",
]
```

### main.py (Cache-aside, Rate Limiting, Leaderboard)
```python
import json
import os
import random
import time
from contextlib import asynccontextmanager
from datetime import datetime

import redis.asyncio as aioredis
from fastapi import FastAPI, HTTPException, Request

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
r: aioredis.Redis = None  # type: ignore

@asynccontextmanager
async def lifespan(app: FastAPI):
    global r
    r = aioredis.from_url(REDIS_URL, decode_responses=True)
    await _seed_data()
    yield
    await r.aclose()

app = FastAPI(title="Practice 02 — Redis Patterns", lifespan=lifespan)

# === PADRÃO 1: Cache com TTL ===

FAKE_DB = {
    "products": [
        {"id": 1, "name": "Notebook", "price": 4500.00},
        {"id": 2, "name": "Mouse", "price": 89.90},
    ]
}

@app.get("/products")
async def list_products():
    """Cache-aside pattern: tenta Redis → se miss, consulta 'banco' → salva cache."""
    cache_key = "cache:products"
    cached = await r.get(cache_key)
    if cached:
        return {
            "source": "redis_cache",
            "ttl_remaining": await r.ttl(cache_key),
            "data": json.loads(cached),
        }

    time.sleep(0.5)  # Simula latência do banco
    data = FAKE_DB["products"]
    await r.setex(cache_key, 30, json.dumps(data))

    return {"source": "database_slow", "ttl_remaining": 30, "data": data}

# === PADRÃO 2: Rate Limiting ===

@app.get("/limited")
async def rate_limited_endpoint(request: Request):
    """Rate limit: máximo 5 requests por minuto por IP."""
    client_ip = request.client.host if request.client else "unknown"
    rate_key = f"rate:{client_ip}"

    current = await r.incr(rate_key)
    if current == 1:
        await r.expire(rate_key, 60)

    ttl = await r.ttl(rate_key)

    if current > 5:
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "limit": "5 requests/minute",
                "retry_after_seconds": ttl,
                "requests_made": current,
            },
        )

    return {
        "message": "OK",
        "requests_used": current,
        "requests_remaining": 5 - current,
        "window_resets_in": ttl,
    }

# === PADRÃO 3: Leaderboard (Sorted Set) ===

@app.post("/events/{event_name}")
async def track_event(event_name: str):
    """Incrementa contador de evento usando sorted set."""
    count = await r.zincrby("leaderboard:events", 1, event_name)
    return {"event": event_name, "total_count": int(count)}

@app.get("/leaderboard")
async def get_leaderboard():
    """Top 10 eventos mais frequentes."""
    top = await r.zrevrange("leaderboard:events", 0, 9, withscores=True)
    return {
        "leaderboard": [
            {"event": name, "count": int(score)}
            for name, score in top
        ],
    }

# === DEBUG ===

@app.get("/debug/keys")
async def debug_keys():
    keys = await r.keys("*")
    result = {}
    for key in sorted(keys):
        key_type = await r.type(key)
        ttl = await r.ttl(key)
        result[key] = {"type": key_type, "ttl": ttl}
    return result
```

---

## 3. Prática 03 — Celery Queue

**Caminho:** `05-anatomia-producao/practices/03-celery-queue/`

### docker-compose.yml
```yaml
services:
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  api:
    build: .
    command: uv run uvicorn main:app --host 0.0.0.0 --port 8000
    ports:
      - "8000:8000"
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis

  worker:
    build: .
    command: uv run celery -A tasks worker --loglevel=info --concurrency=2
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis

  worker-2:
    build: .
    command: uv run celery -A tasks worker --loglevel=info --concurrency=2
    environment:
      - REDIS_URL=redis://redis:6379/0
    depends_on:
      - redis
```

### Dockerfile
```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

COPY pyproject.toml .
RUN uv sync --no-dev

COPY tasks.py main.py ./
```

### pyproject.toml
```toml
[project]
name = "practice-celery-queue"
version = "0.1.0"
description = "Prática: Filas com Celery + Redis — processamento assíncrono"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn>=0.34.0",
    "celery[redis]>=5.4.0",
]
```

### tasks.py (Celery tasks com progress + retry)
```python
import os
import random
import time
from celery import Celery

REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

celery_app = Celery("tasks", broker=REDIS_URL, backend=REDIS_URL)

celery_app.conf.update(
    task_serializer="json",
    result_serializer="json",
    accept_content=["json"],
    task_track_started=True,
    result_expires=300,
    task_acks_late=True,
    worker_prefetch_multiplier=1,
)

@celery_app.task(bind=True, max_retries=3)
def process_csv(self, filename: str, num_rows: int):
    """Simula processamento com progress tracking e retry."""
    try:
        self.update_state(state="PROCESSING", meta={"step": "reading", "progress": 0})
        time.sleep(2)

        self.update_state(state="PROCESSING", meta={"step": "transforming", "progress": 50})
        time.sleep(2)

        self.update_state(state="PROCESSING", meta={"step": "saving", "progress": 90})
        time.sleep(1)

        # 20% chance de falha para demonstrar retry
        if random.random() < 0.2:
            raise ValueError("Erro simulado no processamento")

        return {
            "filename": filename,
            "rows_processed": num_rows,
            "output": f"/data/processed/{filename}",
            "status": "completed",
        }
    except ValueError as exc:
        raise self.retry(exc=exc, countdown=2 ** self.request.retries)

@celery_app.task
def aggregate_sales(region: str, month: str):
    """Simula agregação pesada."""
    time.sleep(3)
    return {
        "region": region,
        "month": month,
        "total_sales": round(random.uniform(10000, 500000), 2),
        "num_transactions": random.randint(100, 5000),
        "avg_ticket": round(random.uniform(50, 500), 2),
    }

@celery_app.task
def send_report(email: str, report_type: str):
    """Simula envio de relatório."""
    time.sleep(2)
    return {
        "email": email,
        "report_type": report_type,
        "sent": True,
        "message": f"Relatório '{report_type}' enviado para {email}",
    }
```

### main.py (API com enqueue + status check + queue stats)
```python
from celery.result import AsyncResult
from fastapi import FastAPI
from tasks import aggregate_sales, celery_app, process_csv, send_report

app = FastAPI(title="Practice 03 — Celery Queue")

@app.post("/process-csv")
async def enqueue_csv(filename: str = "vendas_2025.csv", num_rows: int = 100_000):
    task = process_csv.delay(filename, num_rows)
    return {"task_id": task.id, "status": "queued"}

@app.post("/aggregate")
async def enqueue_aggregation(region: str = "sudeste", month: str = "2025-01"):
    task = aggregate_sales.delay(region, month)
    return {"task_id": task.id, "status": "queued"}

@app.post("/send-report")
async def enqueue_report(email: str = "analista@empresa.com", report_type: str = "vendas_mensal"):
    task = send_report.delay(email, report_type)
    return {"task_id": task.id, "status": "queued"}

@app.get("/tasks/{task_id}")
async def get_task_status(task_id: str):
    """
    Status possíveis: PENDING, STARTED, PROCESSING, SUCCESS, FAILURE, RETRY
    """
    result = AsyncResult(task_id, app=celery_app)
    response = {"task_id": task_id, "status": result.status}

    if result.status == "PROCESSING":
        response["progress"] = result.info
    elif result.status == "SUCCESS":
        response["result"] = result.result
    elif result.status == "FAILURE":
        response["error"] = str(result.result)

    return response

@app.get("/queue/stats")
async def queue_stats():
    inspect = celery_app.control.inspect()
    active = inspect.active() or {}
    reserved = inspect.reserved() or {}

    workers = {}
    for worker_name, tasks in active.items():
        workers[worker_name] = {
            "active_tasks": len(tasks),
            "reserved_tasks": len(reserved.get(worker_name, [])),
        }

    return {"workers": workers, "total_workers": len(workers)}
```

---

## 4. Le Philot API Cuisine — Módulo 04 (Frontend + Navigation Reference)

**Caminho:** `04-APIS/cozinhas-chat-pt/` — REFERÊNCIA PRINCIPAL DE UI E NAVEGAÇÃO

> **IMPORTANTE:** Este é o padrão de navegação a seguir. Sem sidebar. Landing page hero + top nav bar nas páginas internas.

### Padrão de Navegação (Landing Page + Top Nav)

```
/ (Welcome)         → Landing page hero com botões para cada seção
/missoes            → Top nav sempre visível
/biblioteca         → Top nav sempre visível
/arquitetura        → Top nav sempre visível
/dashboard          → Top nav sempre visível
```

### frontend/src/App.tsx (BrowserRouter + MainShell layout)
```tsx
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import MainShell from './components/layout/MainShell';
import Welcome from './pages/Welcome';
import Salao from './pages/Salao';
import Cardapio from './pages/Cardapio';
import Cozinha from './pages/Cozinha';
// ...

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainShell />}>
          <Route index element={<Welcome />} />
          <Route path="salao" element={<Salao />} />
          <Route path="cardapio" element={<Cardapio />} />
          <Route path="cozinha" element={<Cozinha />} />
          {/* ... */}
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
```

### frontend/src/components/layout/MainShell.tsx (Top Nav Bar — SEM SIDEBAR)
```tsx
import { Link, NavLink, Outlet } from 'react-router-dom';

const LINKS = [
  { to: '/salao', label: 'Salao' },
  { to: '/cardapio', label: 'Cardapio' },
  { to: '/cozinha', label: 'Cozinha' },
  { to: '/api-explorer', label: 'API Explorer' },
  { to: '/adega-sql', label: 'Adega SQL' },
  { to: '/arquitetura', label: 'Arquitetura' },
  { to: '/brigada-code', label: 'Brigada Code' },
  { to: '/codigo/models', label: 'Codigo' },
];

export default function MainShell() {
  const logoUrl = '/images/ui/new_logo.png?v=20260220-1';

  return (
    <div className="min-h-screen bg-[#0f0a08] text-white">
      {/* Top nav bar — sticky, backdrop blur, dark bg */}
      <header className="sticky top-0 z-40 border-b border-white/15 bg-[#1d120e]/85 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoUrl} alt="Le Philot API Cuisine" className="h-12 w-12 rounded-md object-contain" />
            <div>
              <p className="font-display text-2xl leading-none text-[#f3dfcf]">Le Philot API Cuisine</p>
              <p className="text-xs uppercase tracking-[0.25em] text-[#d0b399]">Restaurante Educativo</p>
            </div>
          </Link>
          {/* Nav links — horizontal, pills com active state */}
          <nav className="hidden gap-2 md:flex">
            {LINKS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `rounded-md px-3 py-2 text-sm transition ${isActive ? 'bg-[#8f1f2e] text-white' : 'text-[#e8d7c6] hover:bg-white/10'}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>
      {/* Main content area */}
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
```

### frontend/src/pages/Welcome.tsx (Landing Page Hero)
```tsx
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function Welcome() {
  const bgUrl = "/images/ui/welcome-bg.png?v=20260220-2";
  const logoUrl = "/images/ui/new_logo.png?v=20260220-1";
  return (
    <div
      className="relative min-h-[calc(100vh-8rem)] overflow-hidden rounded-2xl border border-white/10 bg-cover bg-center"
      style={{ backgroundImage: `url('${bgUrl}')` }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/35 to-black/70" />
      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center px-6 py-20 text-center">
        {/* Logo animado */}
        <motion.img
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          src={logoUrl}
          alt="Le Philot API Cuisine"
          className="mb-7 h-56 w-56 rounded-xl border border-white/25 bg-black/[0.18] object-contain p-2"
        />
        {/* Título */}
        <motion.h1
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.55, delay: 0.15 }}
          className="font-display text-5xl text-[#f4e4d3] sm:text-6xl"
        >
          Le Philot API Cuisine
        </motion.h1>
        {/* CTA box com blur */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.4 }}
          className="mt-10 w-full max-w-3xl rounded-2xl border border-white/20 bg-black/[0.34] px-6 py-6 backdrop-blur-md"
        >
          <p className="mx-auto max-w-2xl text-lg text-[#f3dfcf]">
            Do salao a cozinha, acompanhe cada pedido...
          </p>
          {/* Botões de navegação para cada seção */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link className="rounded-lg bg-[#8f1f2e] px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-[#a22839]" to="/salao">
              Entrar no Salao
            </Link>
            <Link className="rounded-lg border border-[#d7b28f]/40 bg-black/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#f5e6d7] transition hover:bg-black/35" to="/cardapio">
              Abrir Cardapio
            </Link>
            <Link className="rounded-lg border border-[#d7b28f]/40 bg-black/20 px-6 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-[#f5e6d7] transition hover:bg-black/35" to="/api-explorer">
              Ver APIs
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
```

### frontend/package.json (Tailwind + Framer Motion + Lucide)
```json
{
  "name": "cozinhas-chat-frontend",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@xyflow/react": "^12.8.5",
    "framer-motion": "^12.4.2",
    "lucide-react": "^0.400.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^7.0.0"
  },
  "devDependencies": {
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "tailwindcss": "^3.4.17",
    "typescript": "^5.7.0",
    "vite": "^6.0.0"
  }
}
```

### frontend/tailwind.config.ts
```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bronze: {
          50: '#f7efe4',
          100: '#ecd8c1',
          300: '#d2a978',
          500: '#ad6f3b',
          700: '#7a4926',
          900: '#2b1710',
        },
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        warm: '0 12px 30px rgba(33, 18, 12, 0.35)',
      },
    },
  },
  plugins: [],
} satisfies Config;
```

### frontend/postcss.config.js
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

### frontend/vite.config.ts
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
```

### frontend/Dockerfile (Multi-stage build)
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### frontend/src/index.css (Tailwind + custom base styles)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: var(--font-body);
  line-height: 1.5;
  color: var(--text-primary);
  background: var(--bg-main);
}

#root {
  min-height: 100vh;
}

h1, h2, h3, h4 {
  font-family: var(--font-display);
  letter-spacing: 0.01em;
}
```

---

## 5. Pet Shop — Módulo 04 (Backend-only Reference)

**Caminho:** `04-APIS/petshop/` — Usar apenas referências de backend (Postgres, nginx, Docker Compose multi-service)

> **NOTA:** UI do Pet Shop NÃO deve ser usada como referência. Usar padrão do Restaurante acima.

### docker-compose.yml (Multi-service com Postgres + Redis + healthcheck)
```yaml
services:
  api:
    build: ./api
    environment:
      DATABASE_URL: postgresql+asyncpg://petshop:petshop@db:5432/petshop
      REDIS_URL: redis://redis:6379/0
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: petshop
      POSTGRES_PASSWORD: petshop
      POSTGRES_DB: petshop
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./db/init.sql:/docker-entrypoint-initdb.d/init.sql
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U petshop -d petshop"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine

volumes:
  pgdata:
```

### nginx/nginx.conf (Rate limiting + gzip + proxy)
```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    gzip on;
    gzip_types text/plain application/json application/javascript text/css;
    gzip_min_length 1000;

    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    upstream api_backend {
        server api:8000;
    }

    server {
        listen 80;
        server_name localhost;

        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://api_backend/;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /health {
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }
    }
}
```

### api/src/main.py (Lifespan + CORS + Router pattern)
```python
from contextlib import asynccontextmanager
from typing import AsyncIterator
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    await init_db()
    await cache.connect()
    yield
    await cache.disconnect()

app = FastAPI(title="Pet Shop API", lifespan=lifespan, redirect_slashes=False)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pets.router, prefix="/pets", tags=["pets"])
```

### api/src/services/cache.py (CacheService class)
```python
import redis.asyncio as redis

class CacheService:
    def __init__(self):
        self.client = None

    async def connect(self):
        self.client = redis.from_url(REDIS_URL, decode_responses=True)

    async def get(self, key: str):
        value = await self.client.get(key)
        return json.loads(value) if value else None

    async def set(self, key: str, value: dict, ttl: int = 5):
        await self.client.setex(key, ttl, json.dumps(value, default=str))

cache = CacheService()
```

---

## Padrões-Chave a Reutilizar no Palantír

| Padrão | Fonte | Adaptação |
|---|---|---|
| **Landing page hero + top nav** | Restaurante Welcome.tsx + MainShell.tsx | **PADRÃO PRINCIPAL DE NAVEGAÇÃO** |
| Tailwind config + PostCSS | Restaurante tailwind.config.ts | Cores LOTR em vez de bronze |
| Framer Motion page transitions | Restaurante Welcome.tsx | Fade-in, slide, glow |
| Gunicorn + Uvicorn CMD | Prática 01 Dockerfile | Mesmo CMD, 4 workers |
| Nginx rate limiting + upstream | Prática 01 + Restaurante nginx.conf | Combinar ambos |
| Redis async lifespan | Prática 02 main.py | Mesmo padrão no config.py |
| Cache-aside com TTL | Prática 02 `/products` | Regiões da Terra-Média |
| Rate limit INCR+EXPIRE | Prática 02 `/limited` | "Bater no portão" |
| Leaderboard sorted set | Prática 02 `/leaderboard` | Heróis da Terra-Média |
| Celery config completa | Prática 03 tasks.py | Mesmo, renomear tasks |
| Progress tracking | Prática 03 `update_state` | Steps temáticos |
| Task status polling | Prática 03 `/tasks/{id}` | `/api/missions/{id}` |
| Queue stats inspect | Prática 03 `/queue/stats` | `/api/gate/stats` |
| UV + Python 3.12 Dockerfile | Todas as práticas | Padrão consolidado |
| Postgres + healthcheck | Pet Shop docker-compose.yml | Persistência de missões/leaderboard |
| CacheService class | Pet Shop cache.py | Adaptar para Palantír |
| Vite proxy config | Restaurante vite.config.ts | Proxy para nginx:80 |
| Docker Compose multi-service | Pet Shop docker-compose.yml | 7 serviços (+ Postgres) |
