# Code Internals Project

Interactive learning workspace to explore four core systems topics in one UI:

- Bytes and text encoding
- Shell and process behavior
- Compiled (C) vs interpreted (Python) execution
- Stack/heap memory tracing

The stack runs with Docker Compose and uses isolated sandbox containers for code execution.

## What Each Part Does

### Frontend (`frontend/`)

React + TypeScript + Vite application with four panels:

- `Bytes Explorer`
  - Compares C size vs Python object size
  - Encodes text to bytes (UTF-8/ASCII/Latin-1)
  - Shows multi-base byte representation and ASCII table
- `Shell & Process`
  - Simulated terminal UI backed by real API/SSE
  - User contexts (`alice`, `bob`, `root`)
  - Live filesystem view per selected user
  - Stream/pipes/process visual aids
- `Compiled vs Interpreted`
  - C pipeline stages + assembly preview
  - Python bytecode/opcode exploration
  - Runtime/benchmark comparison with explicit metric labels
- `Stack vs Heap`
  - Step-by-step trace sessions
  - Stack frames, heap allocations, pointers/reference behavior

Entry point: `frontend/src/App.tsx`

### API (`api/`)

FastAPI backend exposing panel-specific routes:

- `POST /api/bytes/compare`
- `POST /api/bytes/encode`
- `POST /api/shell/exec` (SSE stream)
- `GET /api/shell/filesystem?user=alice`
- `POST /api/shell/switch-user`
- `POST /api/compile/c`
- `POST /api/interpret/python`
- `POST /api/memory/trace-c`
- `POST /api/memory/trace-py`
- `GET /api/memory/step/{session_id}?step=0`
- `GET /api/health`

OpenAPI docs: `http://localhost:8000/docs`

### Sandboxes (`sandbox-py/`, `sandbox-c/`)

Isolated runtime containers used by API to execute untrusted code/commands with constraints:

- `network_mode: none`
- `read_only: true`
- writable `tmpfs` at `/tmp`
- CPU/memory limits

Important: shell home directories are under `/tmp` (`/tmp/alice`, `/tmp/bob`, `/tmp/root`) so filesystem operations are writable in the sandbox.

## Run with Docker Compose (from `compendium` root)

From `/home/philot/compendium`, run:

```bash
docker compose -f studies/se-vault-docs/se-for-data-non-se/lessons/02-python/code-internals-project/docker-compose.yml up --build -d
```

Check status:

```bash
docker compose -f studies/se-vault-docs/se-for-data-non-se/lessons/02-python/code-internals-project/docker-compose.yml ps
```

Follow logs:

```bash
docker compose -f studies/se-vault-docs/se-for-data-non-se/lessons/02-python/code-internals-project/docker-compose.yml logs -f api frontend
```

Stop services:

```bash
docker compose -f studies/se-vault-docs/se-for-data-non-se/lessons/02-python/code-internals-project/docker-compose.yml down
```

Rebuild only API + frontend:

```bash
docker compose -f studies/se-vault-docs/se-for-data-non-se/lessons/02-python/code-internals-project/docker-compose.yml build api frontend
docker compose -f studies/se-vault-docs/se-for-data-non-se/lessons/02-python/code-internals-project/docker-compose.yml up -d api frontend
```

## URLs

- Frontend: `http://localhost:5173`
- API health: `http://localhost:8000/api/health`
- API docs: `http://localhost:8000/docs`

## Shell Panel Command Support

Allowed commands in the backend whitelist:

- `ls`, `cat`, `echo`, `grep`, `wc`, `head`, `tail`, `sort`, `uniq`
- `tr`, `cut`, `sed`, `awk`, `tee`, `diff`, `comm`
- `cd`, `pwd`, `whoami`, `id`, `chmod`, `env`, `printenv`, `export`
- `date`, `uname`, `mkdir`, `touch`

Frontend convenience command:

- `clear` clears the terminal view buffer in UI.

Common blocked commands:

- `rm`, `mv`, `cp`, `sudo`, `su`, `curl`, `wget`, `python`, `bash` (and others)

## Local Dev (without Compose, optional)

### API

```bash
cd studies/se-vault-docs/se-for-data-non-se/lessons/02-python/code-internals-project/api
uv pip install --system -r pyproject.toml
uvicorn src.main:app --reload --port 8000
```

### Frontend

```bash
cd studies/se-vault-docs/se-for-data-non-se/lessons/02-python/code-internals-project/frontend
npm install
npm run dev
```

Note: many features depend on sandbox containers and Docker socket access, so Compose is the recommended setup.

## Quick Troubleshooting

- Frontend loads but panels fail: check API health at `/api/health`.
- Shell/compile/memory endpoints return sandbox errors: ensure `sandbox-py` and `sandbox-c` are healthy.
- Shell filesystem confusion: writable user homes are in `/tmp/*`, not `/home/*`.
- If UI changed but not reflected, rebuild and restart `frontend`.

## Project Layout

```text
code-internals-project/
  api/               # FastAPI routes + services
  frontend/          # React app (all panels + landing)
  sandbox-py/        # Python execution sandbox image
  sandbox-c/         # C/GCC execution sandbox image
  docker-compose.yml # Orchestration for all services
  docs/              # Supporting docs/plans
```
