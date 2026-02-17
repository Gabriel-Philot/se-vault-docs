# PORT QUEST -- The Container City

## Context

Module 01 of the "SE for Data Engineers" course covers Internet, Ports, Security, and protocols. The current practice (`pratica.md`) is basic (bash + Nginx + curl). We want to create an interactive application that Claude Code builds with the student via vibe coding, where the building process itself demonstrates the concepts.

**Concept:** Isometric pixel art city where Docker containers are buildings, HTTP packets are animated trucks, and ports are the doors on each building. Visualizes REAL traffic between containers.

**Location:** Everything goes inside a NEW folder:
`/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/samples/01-internet-portas/port-quest/`

Nothing existing in `01-internet-portas/` will be modified or deleted.

---

## Architecture (4 core services)

```yaml
services:
  frontend:    React + Vite + Canvas    port 3000   "Command Center"
  gateway:     Nginx reverse proxy      port 80     "City Gate"
  api:         FastAPI + SSE            port 8000   "City Hall"
  database:    PostgreSQL               port 5432   "Municipal Archive"

networks:
  city-public:    frontend, gateway
  city-internal:  gateway, api, database
```

Gateway bridges both networks = NAT Gateway (Lesson 3 concept).

---

## Execution Strategy: Agent Team

### Team Structure

| Agent | Role | Responsibility |
|-------|------|---------------|
| **team-lead** | Coordinator | Creates tasks, assigns work, integrates, runs docker compose |
| **backend-dev** | Backend + Infra | Docker Compose, Dockerfiles, nginx.conf, FastAPI, all services |
| **frontend-dev** | Frontend | React app, Canvas rendering, components, animations, SSE hook |
| **devil-advocate** | Reviewer/QA | Reviews code from both agents, challenges decisions, finds issues, suggests improvements |

### Workflow

1. **team-lead** creates all tasks and assigns to agents
2. **backend-dev** and **frontend-dev** work in parallel
3. **devil-advocate** reviews each agent's output as they complete tasks:
   - Checks code quality, security, consistency
   - Challenges architectural decisions
   - Identifies missing edge cases
   - Ensures API contracts match between frontend/backend
4. After all code is written, **team-lead** runs `docker compose up --build`
5. **team-lead** uses **Playwright MCP** to navigate `localhost:3000` and validate:
   - City renders correctly with 4 buildings
   - Click interactions work
   - SSE data streams in
   - Animations play
   - Challenges are functional
   - Responsive layout
6. Any issues found by Playwright -> assigned back to the relevant agent

### Devil's Advocate Responsibilities
- Review every PR/code output from backend-dev and frontend-dev
- Question: "Is this the simplest approach?" / "What happens if X fails?"
- Verify API contract alignment (frontend expects what backend provides)
- Check Docker networking is correct (services on right networks)
- Ensure no security issues (exposed ports, missing CORS, etc.)
- Validate that the app actually teaches the lesson concepts

### Playwright MCP Validation Checklist
After docker compose is running, use Playwright to:
- [ ] Navigate to `localhost:3000` - page loads without errors
- [ ] Take screenshot - city with 4 buildings visible
- [ ] Click each building - info panel appears with port/connection data
- [ ] Check metrics sidebar - SSE data updating in real-time
- [ ] Use URL bar - packet animation triggers end-to-end
- [ ] Toggle firewall - visual change in packet flow
- [ ] Toggle TLS - roads change color
- [ ] Open each challenge - UI renders, validation works
- [ ] Check console for errors - no JS errors
- [ ] Check network tab - SSE connection active, API calls returning 200

---

## Frontend: Isometric City (React + Canvas)

### Visual
- HTML5 Canvas renders isometric pixel art city
- 4 buildings with glowing port numbers (80, 3000, 8000, 5432)
- Roads connecting buildings by network (public=blue, internal=yellow)
- HTTP packets = animated trucks with tooltip (IP:port, protocol, payload)

### Interactions
- **Click building** -> panel shows active connections, port state (LISTEN/ESTABLISHED)
- **Metrics sidebar** -> requests/s, latency, connections (via real-time SSE)
- **URL bar** -> type URL, watch packet travel: browser -> gateway:80 -> api:8000 -> db:5432 -> back
- **Firewall toggle** -> enable/disable rules, see packets bouncing or passing
- **TLS toggle** -> roads turn gold, handshake animation plays

### Challenge Mode (4 challenges)
1. **"Wrong Port"** -- service on wrong port, identify and fix
2. **"The Invasion"** -- packets try to access DB directly, configure firewall
3. **"DNS Down"** -- resolve what happens when DNS fails
4. **"Protocol Race"** -- compare REST vs gRPC visually

---

## Backend: FastAPI

```python
GET  /api/city/status            # Status of all buildings/containers
GET  /api/city/connections        # Active connections between services
GET  /api/packets/stream          # SSE - real-time packet event stream
POST /api/packets/send            # Trigger packet between services
GET  /api/ports/{service}         # Port info (simulates ss -tlnp)
POST /api/firewall/rules          # Toggle firewall rules
GET  /api/dns/resolve/{name}      # Step-by-step DNS resolution simulation
POST /api/challenges/{id}/check   # Validate challenge answer
GET  /api/tls/handshake           # Step-by-step TLS handshake data
```

The backend makes real requests to gateway and database, measures real latency, and streams everything via SSE to the frontend. The packet monitor runs as a FastAPI background task.

---

## File Structure

```
01-internet-portas/
  (existing files untouched)
  01_internet_fundamentals.md
  02_network_ports.md
  03_internet_security.md
  04_internet_deep_dive.md
  pratica.md

  port-quest/                        # NEW folder - everything goes here
    docker-compose.yml
    frontend/
      Dockerfile
      package.json
      vite.config.ts
      tsconfig.json
      index.html
      src/
        main.tsx
        App.tsx
        components/
          CityCanvas.tsx             # Isometric canvas - renders buildings/roads/trucks
          BuildingInfo.tsx           # Info panel on building click
          MetricsSidebar.tsx         # Real-time SSE dashboard
          URLBar.tsx                 # Simulate request bar
          FirewallToggle.tsx         # Firewall control
          TLSToggle.tsx             # TLS control
          ChallengeMode.tsx          # Challenge interface
        hooks/
          useSSE.ts                  # Server-Sent Events hook
        types/
          city.ts                    # Types for buildings, packets, connections
    api/
      Dockerfile
      requirements.txt
      main.py                        # FastAPI app with SSE
      models.py                      # Pydantic models
      services/
        packet_monitor.py            # Monitors real traffic between containers
        city_state.py                # City state (buildings, connections)
        challenge_engine.py          # Challenge logic
        dns_simulator.py             # DNS resolution simulation
    gateway/
      nginx.conf                     # Reverse proxy :80 -> api:8000
    database/
      init.sql                       # Initial schema (challenges, packet_log)
```

---

## Stack

| Service | Tech | Port |
|---------|------|------|
| Frontend | React 18 + Vite + TypeScript + Canvas | 3000 |
| Gateway | Nginx | 80 |
| API | FastAPI + sse-starlette + httpx | 8000 |
| Database | PostgreSQL 16 | 5432 |

---

## Implementation Order

### 1. Docker Infrastructure (backend-dev)
- `docker-compose.yml` with 4 services and 2 networks
- `gateway/nginx.conf` with reverse proxy
- `database/init.sql` with schema
- Dockerfiles for api and frontend

### 2. Backend (backend-dev)
- `main.py` with all endpoints + SSE streaming
- `services/packet_monitor.py` - periodic requests to gateway/db, measures latency
- `services/city_state.py` - building state, ports, connections
- `services/challenge_engine.py` - validation for 4 challenges
- `services/dns_simulator.py` - step-by-step DNS simulation

### 3. Frontend Base (frontend-dev)
- React + Vite + TypeScript setup
- `CityCanvas.tsx` - isometric rendering of 4 buildings + roads
- `useSSE.ts` - hook to consume packet stream
- Basic packet animation (trucks) between buildings

### 4. Frontend Interactive (frontend-dev)
- `BuildingInfo.tsx` - click building shows connections
- `MetricsSidebar.tsx` - real-time metrics via SSE
- `URLBar.tsx` - simulate end-to-end request
- `FirewallToggle.tsx` + `TLSToggle.tsx` - visual controls

### 5. Challenge Mode (frontend-dev + backend-dev)
- `ChallengeMode.tsx` - UI for 4 challenges
- Backend validation for each challenge
- Visual feedback (bouncing packets, flashing red ports)

### 6. Devil's Advocate Review
- Review all code from steps 1-5
- Check API contract alignment
- Verify Docker networking
- Flag issues -> agents fix

### 7. Integration + Playwright Validation (team-lead)
- `docker compose up --build`
- Playwright MCP runs full validation checklist
- Issues found -> assigned back to agents
- Iterate until all checks pass

---

## Verification

1. `docker compose up --build` starts all 4 services without errors
2. `docker ps` shows ports 80, 3000, 5432, 8000
3. `localhost:3000` shows isometric city with 4 buildings
4. Animated packet trucks travel between buildings
5. Clicking a building shows connection/port info
6. Sidebar receives metrics via SSE in real-time
7. URL bar triggers visual end-to-end request
8. Firewall toggle blocks/allows packets visually
9. 4 challenges work with validation
10. Playwright MCP validates all UI interactions end-to-end
11. No console errors, no network failures

---

## Post-Mortem: Corrections Required After Implementation

### 1. API Contract Misalignment (Critical)

**Problem:** `backend-dev` and `frontend-dev` agents worked in parallel and produced incompatible data shapes. The devil-advocate review made things *worse* by "aligning" frontend types to the old backend models, breaking components that relied on the original frontend field names.

**Examples:**
- Backend `Building` had `network: str` — frontend expected `networks: string[]`
- Backend `Packet` had `port: int` — frontend expected `source_port`, `destination_port`, `payload_preview`
- Backend `CityStatus` was missing `firewall_enabled` / `tls_enabled`
- Backend `ChallengeResult` was missing `score: int`

**Fix:** Team-lead manually rewrote `api/models.py`, `api/services/city_state.py`, `api/main.py`, `api/services/packet_monitor.py`, `api/services/challenge_engine.py`, `frontend/src/types/city.ts`, `App.tsx`, `BuildingInfo.tsx`, and `ChallengeMode.tsx` to align on a single contract.

**Lesson:** When agents work in parallel, the API contract (types/models) should be defined FIRST as a shared artifact before any implementation begins.

### 2. TLS Endpoint Method Mismatch

**Problem:** `TLSToggle.tsx` used `fetch('/api/tls/handshake', { method: 'POST' })` but backend defined `@app.get("/api/tls/handshake")`.

**Fix:** Changed frontend to use GET.

### 3. Challenge ID Type Mismatch

**Problem:** Frontend challenges used string IDs (`wrong-port`, `invasion`, `dns-down`, `protocol-race`) but backend loaded challenges from DB with integer IDs (1, 2, 3, 4).

**Fix:** Backend endpoint now maps string IDs to integers: `{'wrong-port': 1, 'invasion': 2, 'dns-down': 3, 'protocol-race': 4}`.

### 4. Database Connection Retry

**Problem:** API container started before PostgreSQL was ready, causing connection failures on first boot.

**Fix:** Added a retry loop (10 attempts, 2s sleep) in `main.py` startup event.

### 5. Canvas Proportions (Visual)

**Problem:** The isometric city was tiny (~200px) in a ~1000px+ canvas. Hardcoded `TILE_W=64`, `TILE_H=32`, building width `44px`, heights `50-80px`, and grid positions only 2 tiles apart made everything look disproportionately small.

**Fix:**
- Dynamic tile sizing: `tw = Math.min(W, H) * 0.14` (scales with canvas)
- Grid spacing doubled: positions `[0,0],[4,0],[4,4],[0,4]` instead of 2 apart
- All dimensions (buildings, trucks, fonts, hitboxes, roads, windows, doors) scale via `scale = tw / 64`
- Building base width `50*scale`, heights `55-90*scale`
- Port font `18*scale`, name font `13*scale`
- Vertical origin `oy = H * 0.28` for better centering

### 6. Nginx SSE Proxy Buffering

**Problem:** Nginx was buffering SSE responses, causing the real-time packet stream to stall.

**Fix:** `nginx.conf` needed `proxy_buffering off`, `proxy_set_header Connection ''`, and `proxy_read_timeout 86400s` for the `/api/packets/stream` location.

### 7. Missing `PacketStatus` Import

**Problem:** `CityCanvas.tsx` used `PacketStatus.BLOCKED` without importing the enum.

**Fix:** Changed to string literal comparison `pkt.status === 'blocked'`.

---

## Recommendations for Future Multi-Agent Builds

1. **Define shared types/contracts FIRST** — Create a `shared-contract.ts` / `shared-contract.py` before splitting work
2. **Devil's advocate should NOT modify code** — only flag issues for the responsible agent to fix
3. **Integration tests before Playwright** — a quick `curl` smoke test of each endpoint before visual validation
4. **Canvas sizing should always be responsive** — never hardcode pixel dimensions for HTML5 Canvas
