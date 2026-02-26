# E2E Findings — Port Quest City Frontend + Backend

## Test Environment
- **Frontend**: Vite dev server on `http://localhost:3000`
- **Backend**: Docker Compose (`docker compose up -d`) from `port-quest/`
  - `municipal-archive` (PostgreSQL) — port 5432 (internal)
  - `city-hall` (FastAPI) — port 8000 (internal)
  - `city-gate` (Nginx) — port 80 (public)
  - `command-center` (old frontend) — **FAILED** (port 3000 conflict with new frontend)
- **Config**: `.env` with `VITE_API_URL=http://localhost`

## Feature-by-Feature Results

### Welcome Page (`/`)
| Feature | Status | Notes |
|---------|--------|-------|
| Page render | PASS | Full layout with cards and navigation |
| Buildings Online counter | PASS | Shows "4/4" |
| Active Connections counter | PASS | Shows "3" |
| Packets/Sec counter | PASS | Shows live value (~1) |
| Navigation links | PASS | All 4 section links work |

### City Map (`/map`)
| Feature | Status | Notes |
|---------|--------|-------|
| Page render | PASS | URL bar + canvas |
| Isometric buildings | PASS | 4 buildings drawn with correct colors and ports |
| Building labels | PASS | Command Center :3000, City Gate :80, City Hall :8000, Municipal Archive :5432 |
| URL bar SEND button | PARTIAL | API call succeeds (no console error) but no visible packet animation feedback |
| Building click → drawer | PARTIAL | Clicking anywhere selects buildings[0] (no hit detection) |
| Building drawer content | PASS | Shows service name, networks, connections when opened |
| Packet trail animation | PARTIAL | Dots animate but use fake progress (`Date.now() % 2000`) not real packet state |
| SSE packet stream | PASS | Connects to `/api/packets/stream`, receives events |

### Network Monitor (`/monitor`)
| Feature | Status | Notes |
|---------|--------|-------|
| Page render | PASS | Full layout with filters and metrics |
| SSE Connection | PASS | Shows "Connected" with green dot |
| Live Packet Feed | PASS | Streams HTTP and SQL packets in real-time |
| Protocol filter buttons | PASS | ALL, HTTP, SQL, SSE, gRPC, DNS buttons render |
| Status filter buttons | PASS | ALL, TRAVELING, DELIVERED, BLOCKED buttons render |
| Packets/Sec metric | PASS | Shows live value |
| Active Connections metric | PASS | Shows "3" |
| Latency Trend | PARTIAL | Panel renders but appears empty (no chart/graph) |
| Packet details | PASS | Shows source:port → destination:port, payload, status, latency |

### Security Lab (`/security`)
| Feature | Status | Notes |
|---------|--------|-------|
| Page render | PASS | 3 panels: Firewall, TLS, DNS |
| Firewall toggle | PASS | Toggles between INACTIVE/ACTIVE, shows rules |
| Firewall rules display | PASS | Shows "BLOCK * → database:5432" when active |
| TLS Handshake simulation | PASS | Shows 6 steps: Client Hello → Finished |
| TLS step details | PASS | Each step shows name, description, data JSON |
| DNS Resolver | PASS | Resolves "api.portquest.city" through full chain |
| DNS resolution steps | PASS | browser-cache → os-cache → docker-dns → root → TLD → authoritative → resolved |
| DNS latency display | PASS | Shows per-step latency (e.g., 0.33ms, 10.95ms) |

### Challenges (`/challenges`)
| Feature | Status | Notes |
|---------|--------|-------|
| Page render | **CRASH** | TypeError at ChallengeCard.tsx:65 |
| Challenge list | **FAIL** | API returns data but component crashes |
| Challenge submission | NOT TESTED | Page crashes before interaction possible |
| Score tracking | NOT TESTED | Page crashes before interaction possible |

#### Crash Details
```
TypeError: Cannot read properties of undefined (reading 'toUpperCase')
    at ChallengeCard (ChallengeCard.tsx:68:262)
```

**Root Cause: API response schema mismatch**

Frontend `ChallengeData` expects:
```typescript
{
  id: string;
  title: string;        // ← backend sends "name"
  description: string;
  hints: string[];
  type: 'port_match' | 'firewall' | 'dns' | 'protocol';  // ← backend sends "difficulty"
}
```

Backend `/api/challenges` returns:
```json
{
  "id": 1,              // number, not string
  "name": "Wrong Port", // "name" not "title"
  "description": "...",
  "difficulty": "easy", // "difficulty" not "type"
  "hints": [...]
}
```

Missing fields cause `challenge.type` to be `undefined`, and `.toUpperCase()` crashes.

**Challenge submission** (`/api/challenges/{id}/check`) response DOES match the frontend's `ChallengeResult` interface.

## API Endpoint Compatibility

| Frontend Call | Backend Route | Match |
|--------------|---------------|-------|
| `GET /api/city/status` | `GET /api/city/status` | MATCH |
| `GET /api/city/connections` | `GET /api/city/connections` | MATCH |
| `POST /api/packets/send` | `POST /api/packets/send` | MATCH |
| `GET /api/ports/{service}` | `GET /api/ports/{service}` | MATCH |
| `POST /api/firewall/toggle` | `POST /api/firewall/toggle` | MATCH |
| `GET /api/firewall/rules` | `GET /api/firewall/rules` | MATCH |
| `POST /api/firewall/rules` | `POST /api/firewall/rules` | MATCH |
| `GET /api/dns/resolve/{name}` | `GET /api/dns/resolve/{name}` | MATCH |
| `GET /api/tls/handshake` | `GET /api/tls/handshake` | MATCH |
| `GET /api/challenges` | `GET /api/challenges` | ROUTE MATCH, **SCHEMA MISMATCH** |
| `POST /api/challenges/{id}/check` | `POST /api/challenges/{id}/check` | MATCH |
| `EventSource /api/packets/stream` | `GET /api/packets/stream` (SSE) | MATCH |

## Screenshots
All screenshots saved in `./screenshots/`:
- `welcome-page.png` / `welcome-with-backend.png`
- `city-map-page.png` / `city-map-with-backend.png` / `city-map-after-send.png`
- `monitor-page.png` / `monitor-with-backend.png`
- `security-lab-page.png` / `security-lab-with-backend.png`
- `challenges-page.png`
