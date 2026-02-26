# Runtime Findings — Port Quest City Frontend

## Vite Dev Server

**Result: SUCCESS** — starts in ~300ms on port 3000

### vite.config.ts Issues
1. **GEMINI_API_KEY define** — `process.env.GEMINI_API_KEY` is injected via `define` but never used in any frontend code. Harmless (resolves to `undefined`) but should be removed.
2. **Path alias** — `@` maps to project root (not `src/`). This is unconventional but works since tsconfig matches.

### TypeScript
- `npm run lint` (`tsc --noEmit`) — not tested (no build errors observed at runtime)
- No TypeScript errors visible in Vite console

### index.html
- Title is `"My Google AI Studio App"` instead of `"Port Quest City"` — cosmetic issue

### Missing .env
- Frontend needs `VITE_API_URL` to point to backend
- Without it, defaults to `''` (relative URLs), which hits Vite's dev server instead of the API
- Created `.env` with `VITE_API_URL=http://localhost` to point to nginx gateway on port 80

### Missing favicon.ico
- Browser requests `/favicon.ico` and gets 404 — cosmetic issue

## Frontend-Only Mode (no backend)

All 5 pages render without crashing:
- **Welcome** (`/`) — fully renders with cards, status bar shows 0/4 buildings
- **City Map** (`/map`) — URL bar and building labels render, canvas is empty
- **Network Monitor** (`/monitor`) — layout renders, SSE shows "Disconnected", empty packet feed
- **Security Lab** (`/security`) — all 3 panels render (firewall, TLS, DNS)
- **Challenges** (`/challenges`) — shows "Loading challenges..."

### Console Errors (frontend-only)
- `GET /api/packets/stream` → 404 (SSE endpoint, expected)
- `SyntaxError: Unexpected token '<', "<!doctype "...` — Vite returns HTML for unknown API routes, frontend tries to parse as JSON

### Stub Components (return null)
These files exist but are empty stubs:
- `src/components/city/BuildingNode.tsx` — `export function BuildingNode() { return null; }`
- `src/components/city/NetworkZone.tsx` — `export function NetworkZone() { return null; }`
- `src/components/city/PacketTrail.tsx` — `export function PacketTrail() { return null; }`

These are NOT used by CityMap.tsx (which uses canvas rendering instead). They appear to be leftover scaffolding from Gemini.

### Canvas Click Handler (CityMap)
`handleCanvasClick` always selects `buildings[0]` regardless of click position — no hit detection implemented.
