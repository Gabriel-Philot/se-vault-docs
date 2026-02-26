# Integration Plan — Port Quest City (New Frontend + Existing Backend)

> The Gemini-generated frontend (in `port-quest-city/`) is **final and will not be modified**.
> All changes happen in the backend (`port-quest/`) and Docker infrastructure.

---

## 1. What's Broken

### 1.1 CRASH: Challenges Page (`/challenges`)

**Problem:** The frontend expects a different schema than what the backend returns.

| Field | Frontend expects | Backend returns |
|-------|-----------------|-----------------|
| `id` | `string` | `number` (int) |
| `title` | `string` | missing (uses `name`) |
| `type` | `'port_match' \| 'firewall' \| 'dns' \| 'protocol'` | missing (uses `difficulty`) |

`ChallengeCard.tsx:65` calls `challenge.type.toUpperCase()` — since `type` is `undefined`, it throws `TypeError`.

**Required backend fix:**

File: `api/services/challenge_engine.py` — function `get_challenges()`

Change from:
```python
{"id": c["id"], "name": c["name"], "description": c["description"], "difficulty": c["difficulty"], "hints": c["hints"]}
```

To:
```python
{
    "id": str(c["id"]),
    "title": c["name"],
    "description": c["description"],
    "type": CHALLENGE_TYPE_MAP[c["id"]],
    "hints": c["hints"],
}
```

Add mapping:
```python
CHALLENGE_TYPE_MAP = {
    1: "port_match",   # Wrong Port
    2: "firewall",     # The Invasion
    3: "dns",          # DNS Down
    4: "protocol",     # Protocol Race
}
```

File: `api/main.py` — endpoint `POST /api/challenges/{challenge_id}/check`

The frontend sends `challenge_id` as string and `answer` as string/number. The current backend receives `challenge_id` from the path (int) and expects `answer` as a dict with a `value` key. The frontend sends `{ challenge_id, answer }` where `answer` can be a plain string like `"8000"`.

Adjust `check_answer()` to accept `answer` as a string directly:
```python
# In check_answer, normalize:
if isinstance(answer, str):
    answer = {"value": answer}
elif isinstance(answer, (int, float)):
    answer = {"value": str(answer)}
```

---

## 2. What Needs Improvement

### 2.1 Frontend Cleanup (configuration only, no code changes)

| Item | Problem | Action |
|------|---------|--------|
| `.env` | Does not exist | Create with `VITE_API_URL=http://localhost` |
| `index.html` | Title is "My Google AI Studio App" | **DO NOT TOUCH** (frontend is final) |
| `favicon.ico` | Does not exist | Can add one at project root |
| Junk dependencies | `@google/genai`, `express`, `better-sqlite3`, `dotenv` | Can be removed from `package.json` without affecting code |
| `vite.config.ts` | Exposes `GEMINI_API_KEY` | **DO NOT TOUCH** (frontend is final, harmless) |

### 2.2 Frontend Stubs (documentation only — no action)

These components exist but return `null` — leftover scaffolding from Gemini:
- `BuildingNode.tsx`
- `NetworkZone.tsx`
- `PacketTrail.tsx`

`CityMap.tsx` uses canvas directly and does not depend on them.

### 2.3 Partial Frontend Features (documentation only — no action)

| Feature | State | Detail |
|---------|-------|--------|
| Canvas click (City Map) | Stub | Click always selects `buildings[0]`, no hit detection |
| Packet animation | Fake | Uses `Date.now() % 2000` instead of real packet state |
| Latency Trend (Monitor) | Empty | Panel renders but has no chart/graph |

These are limitations of the generated frontend. Since the frontend is final, they remain as-is.

---

## 3. How to Integrate Everything with a Single Docker Compose

### 3.1 Current State

Two separate projects exist:
```
port-quest/                    ← original backend with docker-compose.yml
├── api/                       ← FastAPI (city-hall)
├── gateway/                   ← Nginx (city-gate)
├── database/                  ← PostgreSQL (municipal-archive)
├── frontend/                  ← OLD frontend (command-center) ← REPLACE
└── docker-compose.yml

port-quest-city/               ← NEW frontend (Gemini)
├── src/
├── package.json
├── vite.config.ts
└── index.html
```

### 3.2 Plan: A Unified Docker Compose

**Strategy:** Replace the old `frontend/` with the new one and adjust `docker-compose.yml`.

#### Step 1: Replace the frontend

```bash
# From inside port-quest/
rm -rf frontend/
cp -r ../class_refinements/discoverys/port-quest-city/ frontend/
```

#### Step 2: Create `frontend/.env` for the Docker build

```env
VITE_API_URL=
```

(Empty URL = relative API calls = works when everything is behind the same gateway)

#### Step 3: Create/update `frontend/Dockerfile`

```dockerfile
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3000
```

#### Step 4: Create `frontend/nginx.conf` (to serve the SPA)

```nginx
server {
    listen 3000;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### Step 5: Update `gateway/nginx.conf`

Add proxy for the frontend (in addition to the API):

```nginx
upstream api_server {
    server api:8000;
}

upstream frontend_server {
    server frontend:3000;
}

server {
    listen 80;
    server_name localhost;

    # CORS
    add_header Access-Control-Allow-Origin * always;
    add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
    add_header Access-Control-Allow-Headers "Content-Type, Authorization, Accept" always;

    if ($request_method = OPTIONS) {
        return 204;
    }

    # API reverse proxy
    location /api/ {
        proxy_pass http://api_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # SSE support
        proxy_buffering off;
        proxy_cache off;
        add_header X-Accel-Buffering no always;
        proxy_http_version 1.1;
        proxy_set_header Connection '';
        proxy_read_timeout 86400s;
        chunked_transfer_encoding off;
    }

    # Frontend (SPA)
    location / {
        proxy_pass http://frontend_server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check
    location /health {
        return 200 '{"status": "ok", "service": "city-gate"}';
        add_header Content-Type application/json;
    }
}
```

#### Step 6: Update `docker-compose.yml`

```yaml
services:
  frontend:
    build: ./frontend
    container_name: command-center
    # No host port mapping — accessible only via gateway
    expose:
      - "3000"
    networks:
      - city-public
    depends_on:
      - gateway

  gateway:
    build: ./gateway
    container_name: city-gate
    ports:
      - "80:80"
    networks:
      - city-public
      - city-internal
    depends_on:
      - api

  api:
    build: ./api
    container_name: city-hall
    expose:
      - "8000"
    networks:
      - city-internal
    depends_on:
      database:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://portquest:portquest@database:5432/portquest
      - DB_HOST=database
      - DB_PORT=5432
      - DB_USER=portquest
      - DB_PASSWORD=portquest
      - DB_NAME=portquest

  database:
    image: postgres:16-alpine
    container_name: municipal-archive
    expose:
      - "5432"
    networks:
      - city-internal
    volumes:
      - db-data:/var/lib/postgresql/data
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    environment:
      - POSTGRES_USER=portquest
      - POSTGRES_PASSWORD=portquest
      - POSTGRES_DB=portquest
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U portquest"]
      interval: 5s
      timeout: 5s
      retries: 5

networks:
  city-public:
    driver: bridge
  city-internal:
    driver: bridge

volumes:
  db-data:
```

**Key change:** The frontend does not expose a port to the host. Everything goes through the gateway on port 80:
- `http://localhost/` → frontend (SPA)
- `http://localhost/api/*` → API (FastAPI)
- `http://localhost/api/packets/stream` → SSE

`VITE_API_URL` should be empty (`""`) or undefined in the build, since API calls will be relative (same domain via gateway).

---

## 4. Summary of Required Changes

### Backend (required)

| File | Change | Priority |
|------|--------|----------|
| `api/services/challenge_engine.py` | Add `CHALLENGE_TYPE_MAP`, change `get_challenges()` to return `{id: str, title, type, description, hints}` | **CRITICAL** |
| `api/services/challenge_engine.py` | Normalize `answer` in `check_answer()` to accept plain strings | HIGH |

### Infrastructure (required for single docker-compose)

| File | Change | Priority |
|------|--------|----------|
| `frontend/` | Replace with contents of `port-quest-city/` | **CRITICAL** |
| `frontend/Dockerfile` | New — multi-stage build (node → nginx) | **CRITICAL** |
| `frontend/nginx.conf` | New — serves SPA with `try_files` | **CRITICAL** |
| `frontend/.env` | `VITE_API_URL=` (empty for relative URLs) | **CRITICAL** |
| `gateway/nginx.conf` | Add `location /` proxy for frontend | **CRITICAL** |
| `docker-compose.yml` | Remove `ports: 3000` from frontend, use `expose` | HIGH |

### Cleanup (optional but recommended)

| File | Change | Priority |
|------|--------|----------|
| `frontend/package.json` | Remove junk deps: `@google/genai`, `express`, `better-sqlite3`, `dotenv`, `@types/express` | LOW |

---

## 5. Execution Order

1. **Copy new frontend** into `port-quest/frontend/`
2. **Create** `frontend/Dockerfile` and `frontend/nginx.conf`
3. **Create** `frontend/.env` with `VITE_API_URL=`
4. **Modify** `api/services/challenge_engine.py` — fix schema + normalize answer
5. **Modify** `gateway/nginx.conf` — add frontend proxy
6. **Modify** `docker-compose.yml` — remove port mapping from frontend
7. **Test** `docker compose up --build`
8. **Validate** by visiting `http://localhost` — all 5 pages should work

---

## 6. Expected Result

```
http://localhost           → Welcome page (4/4 buildings, live counters)
http://localhost/map       → City Map with animated buildings and SSE
http://localhost/monitor   → Network Monitor with streaming packets
http://localhost/security  → Firewall, TLS, DNS — all functional
http://localhost/challenges → Challenges load and can be answered
```

One `docker compose up` brings everything up. One domain. One port. Zero conflicts.
