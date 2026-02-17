 Here is Claude's plan:
╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌
 OOP Playground — Architecture Plan

 Context

 Build a 5-page interactive web app that teaches OOP fundamentals through data engineering metaphors. This is a localhost POC running on WSL2 during a class — not production. The prior
  projects (Port Quest, Data Race) established patterns we'll reuse: visual-first teaching, real computation, progressive discovery, contract-first development.

 ---
 Tech Stack Decisions

 ┌────────────────┬─────────────────────────────────────────────┬──────────────────────────────────────────────────────────────────────────────────────┐
 │     Layer      │                   Choice                    │                                         Why                                          │
 ├────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
 │ Backend        │ FastAPI (single monolith container)         │ User preference + research confirms monolith is right for 5 pages                    │
 ├────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
 │ Frontend       │ React 19 + TypeScript                       │ Best combined ecosystem: dnd-kit + Motion + CodeMirror 6 + React Flow (scored 20/20) │
 ├────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
 │ Python deps    │ uv + uv.lock                                │ Fast, reproducible, replaces pip/poetry/pyenv                                        │
 ├────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
 │ Containers     │ Docker Compose (3 services)                 │ frontend + backend + nginx reverse proxy                                             │
 ├────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
 │ Data contracts │ Pydantic v2 → OpenAPI → @hey-api/openapi-ts │ Auto-generates TypeScript types from FastAPI's OpenAPI spec                          │
 ├────────────────┼─────────────────────────────────────────────┼──────────────────────────────────────────────────────────────────────────────────────┤
 │ Code execution │ Direct exec() in FastAPI endpoint           │ Localhost POC, no security concern — keeps it simple                                 │
 └────────────────┴─────────────────────────────────────────────┴──────────────────────────────────────────────────────────────────────────────────────┘

 Why NOT one Docker container per page?

 Research is clear: microservices for 5 pages is overkill (10-100x complexity for zero benefit). One FastAPI monolith with one router per page gives clean separation without the
 overhead. The Docker lesson from prior projects (expose vs ports = encapsulation) still works with a single backend.

 ---
 Docker Topology

 ┌─────────────────────────────────────────────┐
 │              docker-compose.yml             │
 │                                             │
 │  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
 │  │  nginx   │  │ frontend │  │ backend  │  │
 │  │  :80     │→ │ React    │  │ FastAPI  │  │
 │  │ (proxy)  │→ │ dev:5173 │  │ :8000    │  │
 │  └──────────┘  └──────────┘  └──────────┘  │
 │       ↑              ↑             ↑        │
 │    ports:80     build: ./fe   build: ./be   │
 │    (host)       (hot reload)  (uvicorn)     │
 └─────────────────────────────────────────────┘

 Services:
 1. nginx — Reverse proxy. Routes /api/* → backend, /* → frontend. Single entry point on port 80.
 2. frontend — React dev server (Vite). Hot reload via volume mount.
 3. backend — FastAPI + uvicorn. Hot reload via --reload + volume mount. uv for deps.

 For the POC, nginx is optional — we can start with just frontend + backend and use Vite's proxy config to forward /api calls. Add nginx later if needed.

 ---
 Project Structure (Monorepo)

 oop-playground/
 ├── docker-compose.yml
 ├── docker-compose.override.yml    # dev overrides (volumes, hot reload)
 ├── .env.example
 │
 ├── backend/
 │   ├── Dockerfile
 │   ├── pyproject.toml
 │   ├── uv.lock
 │   ├── .dockerignore
 │   └── app/
 │       ├── __init__.py
 │       ├── main.py                # FastAPI app, CORS, mount routers
 │       ├── models/                # Pydantic contracts (shared)
 │       │   ├── __init__.py
 │       │   ├── common.py          # Base models (OOPClass, Attribute, Method)
 │       │   ├── page1_classes.py   # Class vs Object models
 │       │   ├── page2_inheritance.py
 │       │   ├── page3_encapsulation.py
 │       │   ├── page4_polymorphism.py
 │       │   └── page5_factory.py   # Pipeline models
 │       ├── routers/               # One router per page
 │       │   ├── __init__.py
 │       │   ├── page1_classes.py
 │       │   ├── page2_inheritance.py
 │       │   ├── page3_encapsulation.py
 │       │   ├── page4_polymorphism.py
 │       │   └── page5_factory.py
 │       ├── engine/                # OOP code execution
 │       │   ├── __init__.py
 │       │   ├── executor.py        # Runs user-assembled Python code
 │       │   └── templates/         # Pre-built class templates
 │       │       ├── data_source.py
 │       │       ├── csv_source.py
 │       │       ├── parquet_source.py
 │       │       └── api_source.py
 │       └── sse/                   # Server-Sent Events for live execution
 │           └── stream.py
 │
 ├── frontend/
 │   ├── Dockerfile
 │   ├── package.json
 │   ├── tsconfig.json
 │   ├── vite.config.ts
 │   └── src/
 │       ├── main.tsx
 │       ├── App.tsx
 │       ├── client/               # Auto-generated from OpenAPI
 │       │   └── (generated by @hey-api/openapi-ts)
 │       ├── components/
 │       │   ├── layout/
 │       │   │   ├── Sidebar.tsx
 │       │   │   ├── CodeTerminal.tsx      # Collapsible Python code panel
 │       │   │   └── Assistant.tsx         # Contextual help text
 │       │   ├── shared/
 │       │   │   ├── ClassCard.tsx         # Visual class representation
 │       │   │   ├── AttributeBlock.tsx    # Draggable attribute (LEGO piece)
 │       │   │   ├── MethodBlock.tsx       # Draggable method
 │       │   │   └── ObjectBadge.tsx       # Instantiated object visual
 │       │   ├── page1/                    # Class vs Object
 │       │   │   └── BlueprintBuilder.tsx  # Drag blocks to build a class
 │       │   ├── page2/                    # Inheritance
 │       │   │   └── FamilyTree.tsx        # React Flow tree diagram
 │       │   ├── page3/                    # Encapsulation
 │       │   │   └── VaultPuzzle.tsx       # Click attr → denied → use method
 │       │   ├── page4/                    # Polymorphism
 │       │   │   └── Arena.tsx             # Side-by-side execution
 │       │   └── page5/                    # Factory
 │       │       └── PipelineBuilder.tsx   # React Flow pipeline builder
 │       └── pages/
 │           ├── Page1Classes.tsx
 │           ├── Page2Inheritance.tsx
 │           ├── Page3Encapsulation.tsx
 │           ├── Page4Polymorphism.tsx
 │           └── Page5Factory.tsx
 │
 └── scripts/
     └── generate-types.sh          # curl openapi.json → hey-api → src/client/

 ---
 Pydantic Contracts (Define FIRST — Lesson #5)

 Core models that drive the entire app:

 # backend/app/models/common.py
 from pydantic import BaseModel

 class Attribute(BaseModel):
     name: str
     type_hint: str        # "str", "int", "float", etc.
     is_private: bool      # starts with _
     value: str | None     # current value (for instances)

 class Method(BaseModel):
     name: str
     params: list[str]
     body: str             # Python code
     is_inherited: bool
     is_overridden: bool

 class OOPClass(BaseModel):
     name: str
     parent: str | None
     attributes: list[Attribute]
     methods: list[Method]

 class OOPInstance(BaseModel):
     class_name: str
     instance_name: str
     attributes: list[Attribute]  # with actual values

 class ExecutionResult(BaseModel):
     stdout: str
     python_code: str      # the code that was generated and run
     success: bool
     error: str | None

 These models are the single source of truth. TypeScript types auto-generated via:
 # scripts/generate-types.sh
 curl http://localhost:8000/openapi.json -o openapi.json
 npx @hey-api/openapi-ts -i ./openapi.json -o frontend/src/client

 ---
 Page-by-Page Backend Logic

 Page 1: Class vs Object

 - POST /api/class/create — Receives OOPClass, validates, stores in memory
 - POST /api/class/instantiate — Takes class name + attribute values → returns OOPInstance
 - GET /api/class/{name}/code — Returns generated Python code string

 Page 2: Inheritance

 - GET /api/inheritance/tree — Returns full class hierarchy as tree structure
 - POST /api/inheritance/create-child — Creates child class inheriting from parent
 - GET /api/inheritance/{name}/resolved — Shows final class with all inherited + own members

 Page 3: Encapsulation

 - POST /api/encapsulation/access — Try to access attribute directly → success/denied
 - POST /api/encapsulation/call-method — Call getter/setter method → success + result
 - GET /api/encapsulation/demo — Returns comparison scenario (with vs without encapsulation)

 Page 4: Polymorphism

 - POST /api/polymorphism/execute — SSE endpoint. Executes .read() on multiple sources simultaneously, streams results with different "animation events"
 - GET /api/polymorphism/sources — Lists available source classes

 Page 5: Factory (Pipeline)

 - POST /api/pipeline/build — Receives ordered list of pipeline stages
 - POST /api/pipeline/run — SSE endpoint. Executes pipeline, streams stage-by-stage results
 - POST /api/pipeline/swap — Swap a stage for another (demonstrates polymorphism)

 ---
 Frontend Key Libraries

 ┌──────────────┬────────────────────────────────────────────────┬────────────────────────────────────────────────────────┐
 │     Need     │                    Library                     │                          Why                           │
 ├──────────────┼────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ Drag & Drop  │ @dnd-kit/core + @dnd-kit/sortable              │ 60fps, accessible, modular, best React DnD             │
 ├──────────────┼────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ Animations   │ motion (from motion.dev)                       │ Gestures, layout animations, shared transitions        │
 ├──────────────┼────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ Code Display │ CodeMirror 6                                   │ Lightweight (~300KB vs Monaco's 5-10MB), Python syntax │
 ├──────────────┼────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ Pipeline Viz │ React Flow (@xyflow/react)                     │ Industry standard, custom nodes, drag/zoom/pan         │
 ├──────────────┼────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ Routing      │ React Router v7                                │ 5 pages, sidebar nav                                   │
 ├──────────────┼────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
 │ HTTP         │ Auto-generated client from @hey-api/openapi-ts │ Type-safe, synced with backend                         │
 └──────────────┴────────────────────────────────────────────────┴────────────────────────────────────────────────────────┘

 ---
 Docker Setup

 backend/Dockerfile (dev-friendly, single stage for POC)

 FROM ghcr.io/astral-sh/uv:python3.12-bookworm-slim

 WORKDIR /app
 ENV UV_COMPILE_BYTECODE=1
 ENV UV_LINK_MODE=copy

 COPY pyproject.toml uv.lock ./
 RUN --mount=type=cache,target=/root/.cache/uv \
     uv sync --locked --no-install-project

 COPY . .
 RUN --mount=type=cache,target=/root/.cache/uv \
     uv sync --locked

 ENV PATH="/app/.venv/bin:$PATH"

 CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

 docker-compose.yml

 services:
   backend:
     build: ./backend
     container_name: oop-engine
     ports:
       - "8000:8000"
     volumes:
       - ./backend/app:/app/app    # hot reload
     environment:
       - PYTHONDONTWRITEBYTECODE=1

   frontend:
     build: ./frontend
     container_name: oop-ui
     ports:
       - "5173:5173"
     volumes:
       - ./frontend/src:/app/src   # hot reload
     environment:
       - VITE_API_URL=http://localhost:8000

 nginx can be added later. For the POC, Vite's server.proxy in vite.config.ts handles /api → http://backend:8000.

 ---
 Build Order (Contract-First, Lesson #5 & #19)

 Phase 1: Foundation

 1. Scaffold monorepo structure
 2. Write ALL Pydantic models (backend/app/models/)
 3. Create FastAPI app skeleton with empty routers
 4. Generate OpenAPI spec → TypeScript types
 5. Scaffold React app with routing + layout (sidebar, terminal, assistant)
 6. Docker Compose with hot reload working

 Phase 2: Page 1 — Class vs Object (simplest, establishes patterns)

 7. Backend: class creation + instantiation endpoints
 8. Frontend: BlueprintBuilder with dnd-kit (drag attribute/method blocks)
 9. CodeTerminal showing generated Python in real-time
 10. Assistant text for Page 1

 Phase 3: Page 2 — Inheritance

 11. Backend: tree structure, child creation, resolved view
 12. Frontend: FamilyTree with React Flow (class hierarchy visualization)
 13. Visual indicators: "Herdado" vs "Proprio" tags

 Phase 4: Page 3 — Encapsulation

 14. Backend: access control simulation endpoints
 15. Frontend: VaultPuzzle (click private attr → shake + denied → drag method to unlock)
 16. Side-by-side comparison: with vs without encapsulation

 Phase 5: Page 4 — Polymorphism

 17. Backend: SSE endpoint executing multiple .read() methods
 18. Frontend: Arena with side-by-side animated execution
 19. Swap demonstration (replace source, pipeline still works)

 Phase 6: Page 5 — Factory (Grand Finale)

 20. Backend: pipeline builder + SSE execution stream
 21. Frontend: PipelineBuilder with React Flow (drag stages onto conveyor)
 22. Connect all 4 pillars visually — "everything you learned comes together"

 Phase 7: Polish

 23. Assistant text for all pages
 24. Animations and transitions between pages
 25. CodeTerminal refinements (syntax highlighting, copy button)

 ---
 Visual Theme: Dune

 Color palette inspired by the Dune films — desert, spice, deep space.

 ┌──────────────────┬──────────────┬─────────┬────────────────────────────────────────────────────┐
 │       Role       │    Color     │   Hex   │                       Usage                        │
 ├──────────────────┼──────────────┼─────────┼────────────────────────────────────────────────────┤
 │ Primary BG       │ Deep black   │ #0a0a0f │ App background, sidebar, terminal                  │
 ├──────────────────┼──────────────┼─────────┼────────────────────────────────────────────────────┤
 │ Secondary BG     │ Dark sand    │ #1a1610 │ Cards, panels, hover states                        │
 ├──────────────────┼──────────────┼─────────┼────────────────────────────────────────────────────┤
 │ Accent 1         │ Spice orange │ #e8722a │ Active states, buttons, highlights, "Instantiate!" │
 ├──────────────────┼──────────────┼─────────┼────────────────────────────────────────────────────┤
 │ Accent 2         │ Fremen blue  │ #2d7dd2 │ Links, inherited markers, selected nav items       │
 ├──────────────────┼──────────────┼─────────┼────────────────────────────────────────────────────┤
 │ Text primary     │ Sand white   │ #e8dcc8 │ Body text, labels                                  │
 ├──────────────────┼──────────────┼─────────┼────────────────────────────────────────────────────┤
 │ Text secondary   │ Muted sand   │ #8a7e6b │ Descriptions, assistant text                       │
 ├──────────────────┼──────────────┼─────────┼────────────────────────────────────────────────────┤
 │ Success          │ Spice glow   │ #f0a030 │ Successful execution, unlocked attrs               │
 ├──────────────────┼──────────────┼─────────┼────────────────────────────────────────────────────┤
 │ Error/Denied     │ Deep red     │ #c0392b │ Access denied, errors, private markers             │
 ├──────────────────┼──────────────┼─────────┼────────────────────────────────────────────────────┤
 │ Code terminal BG │ Near black   │ #0d0d12 │ CodeMirror background                              │
 ├──────────────────┼──────────────┼─────────┼────────────────────────────────────────────────────┤
 │ Code text        │ Amber        │ #d4a054 │ Code syntax, terminal output                       │
 └──────────────────┴──────────────┴─────────┴────────────────────────────────────────────────────┘

 Font choices:
 - UI: Inter or system sans-serif
 - Code: JetBrains Mono or Fira Code
 - Headings: Consider a geometric sans (like Rajdhani) for that sci-fi Dune feel

 Visual cues:
 - Private attributes glow red with a 🔒 icon
 - Public attributes glow blue
 - Inherited items have a subtle blue underline ("Herdado")
 - Own items have an orange dot ("Proprio")
 - Instantiation triggers a spice-particle animation (orange particles)
 - Pipeline data flow uses an orange gradient moving along the edges

 ---
 Multi-Agent Build Process

 Following Lesson #17: "Devil's Advocate Should Not Write Code"

 Agent Roles (5 terminals)

 ┌──────────────────────────────────────────────────────────────┐
 │                     AGENT TEAM LAYOUT                        │
 │                                                              │
 │  Terminal 1               │  Terminal 2                      │
 │  📐 ARCHITECT             │  🏗️  BACKEND AGENT
 │  Role: DESIGN FIRST       │  Role: Build                     │
 │  Scope: ALL (writes       │  Scope: backend/ only            │
 │  contracts, structure,    │  Writes: FastAPI routers,        │
 │  Pydantic models, API     │  engine, SSE, business logic     │
 │  specs, folder scaffold)  │  Follows Architect's contracts   │
 │  Runs: Phase 0 only       │                                  │
 │                           │                                  │
 │───────────────────────────┼──────────────────────────────────│
 │  Terminal 3               │  Terminal 4                      │
 │  🎨 FRONTEND AGENT        │  🔗 INTEGRATOR                   │
 │  Role: Build              │  Role: PLUMBING (after builders) │
 │  Scope: frontend/ only    │  Scope: docker, compose, nginx,  │
 │  Writes: React, TS,       │  scripts, CORS, proxy, type gen  │
 │  components, styling      │  Runs AFTER Backend + Frontend   │
 │  Follows Architect's      │  Wires services together         │
 │  contracts                │  Verifies ports, routes, types   │
 │                           │                                  │
 │───────────────────────────┼──────────────────────────────────│
 │  Terminal 5                                                  │
 │  😈 DEVIL'S ADVOCATE                                         │
 │  Role: REVIEW ONLY — ⛔ NEVER writes/modifies code           │
 │  Scope: ALL files (read-only)                                │
 │  Runs AFTER Integrator finishes                              │
 │  Outputs: review.md with flagged issues                      │
 └──────────────────────────────────────────────────────────────┘

 Agent CLAUDE.md Files

 Each agent gets a scoped CLAUDE.md with its role and rules:

 Architect (root CLAUDE.md or dedicated CLAUDE-ARCHITECT.md):
 - Runs first, before anyone else
 - Defines the blueprint for each phase:
   - Pydantic models (backend/app/models/)
   - API route signatures (method, path, request/response types)
   - Folder structure and file scaffolding
   - Frontend component tree and props interfaces
   - Docker service definitions
 - Writes: models, pyproject.toml, package.json, scaffold files, docker-compose.yml
 - Does NOT write business logic — only contracts, interfaces, and structure
 - Hands off a clear spec that Backend + Frontend agents follow

 Backend Agent (backend/CLAUDE.md):
 - Owns backend/app/routers/, backend/app/engine/, backend/app/sse/
 - Implements the logic inside the routes and engine that Architect defined
 - Must NOT modify models — those belong to Architect
 - Must use uv, never pip

 Frontend Agent (frontend/CLAUDE.md):
 - Owns frontend/src/ only
 - Writes React components, pages, styling
 - Must use the Dune color palette (exact hex values above)
 - Must consume types from src/client/ (never hand-write API types)
 - Libraries: dnd-kit, Motion, CodeMirror 6, React Flow
 - Must NOT define API shapes — those come from generated types

 Integrator (root scope, runs after builders):
 - Runs AFTER Backend + Frontend finish their work
 - Owns: docker-compose.yml tweaks, scripts/, nginx config, Vite proxy config
 - Tasks:
   - Run type generation (scripts/generate-types.sh) — ensure OpenAPI → TS types are fresh
   - Verify Docker networking (backend reachable from frontend container)
   - Verify CORS config matches frontend origin
   - Verify API routes match between backend and frontend calls
   - Fix any wiring issues (ports, env vars, proxy paths)
 - Does NOT write business logic — only plumbing

 Devil's Advocate (CLAUDE-REVIEW.md):
 - READ-ONLY — NEVER modifies code (Lesson #17)
 - Reviews all files across the project
 - Runs AFTER Integrator finishes wiring
 - Checks:
   - Do Pydantic models match frontend TypeScript types?
   - Are lessons from lessons_from_older_projects.md being followed?
   - Is the contract (OpenAPI) aligned between front and back?
   - Are there HTTP method mismatches? (Lesson #10)
   - Are there data shape mismatches? (Lesson #5)
   - Is visual-first, code-second being respected? (Lesson #11)
   - Are enum serialization traps present? (Lesson #9)
 - Outputs a review.md report with issues found
 - Flags severity: 🔴 critical, 🟡 warning, 🟢 suggestion

 Execution Order Per Phase

 Phase flow for each build phase:

 1. 📐 ARCHITECT defines contracts + scaffolding for this phase
         │
         ▼
 2. 🏗️  BACKEND + 🎨 FRONTEND build in paralle
    (both follow Architect's spec)
         │
         ▼
 3. 🔗 INTEGRATOR wires everything together
    (type gen, Docker, ports, proxy, CORS)
         │
         ▼
 4. 😈 DEVIL'S ADVOCATE reviews all, writes review.md
    (flags issues, NEVER fixes them)
         │
         ▼
 5. 🏗️  BACKEND + 🎨 FRONTEND fix flagged issue
    (Architect steps in only if contracts need changing)
         │
         ▼
    Next phase ─►

 ---
 Verification Plan

 1. docker compose up — both containers start, hot reload works
 2. curl http://localhost:8000/docs — FastAPI Swagger UI shows all endpoints
 3. curl http://localhost:8000/openapi.json — OpenAPI spec is valid
 4. Navigate each page in browser at http://localhost:5173
 5. Page 1: drag blocks → build class → instantiate → see Python code
 6. Page 2: see tree → create child → inherited attrs appear
 7. Page 3: click private attr → denied → use method → success
 8. Page 4: click "Execute .read()" → see different animations, same result
 9. Page 5: drag stages → run pipeline → data flows through stages

 ---
 Key Files to Create First

 1. backend/app/models/common.py — Pydantic contracts (THE source of truth)
 2. backend/app/main.py — FastAPI app with CORS + router mounts
 3. frontend/src/App.tsx — Layout with sidebar + router
 4. docker-compose.yml — Dev setup with hot reload
 5. scripts/generate-types.sh — OpenAPI → TypeScript pipeline
