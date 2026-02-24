# Code Internals Explorer - Core Plan

> Interactive app with 4 panels that visually demonstrate concepts from lessons 00-04 of module 02-python.

## Tech Stack

| Layer     | Technology                           |
| --------- | ------------------------------------ |
| Frontend  | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend   | FastAPI (Python 3.12)                |
| Sandbox   | Isolated Docker containers (Python + GCC/C) |
| Infra     | Docker Compose (4 services)          |

---

## Overall Architecture

```
┌─────────────────┐       REST / SSE        ┌──────────────────┐
│    Frontend      │ ◄───────────────────► │   FastAPI (api)   │
│  React + Vite    │                         │   Orchestrator    │
│  :5173           │                         │   :8000           │
└─────────────────┘                         └────────┬─────────┘
                                                     │
                                          Docker SDK / exec
                                                     │
                                     ┌───────────────┼───────────────┐
                                     │                               │
                              ┌──────▼──────┐                ┌──────▼──────┐
                              │ sandbox-py   │                │ sandbox-c    │
                              │ Python 3.12  │                │ GCC 13       │
                              │ (isolated)   │                │ (isolated)   │
                              └─────────────┘                └─────────────┘
```

### Frontend-Backend Communication

- **REST** for one-off actions: compile, execute, query type sizes
- **SSE (Server-Sent Events)** for streaming terminal output and step-by-step execution

---

## Panel 1: Bytes Explorer

> Lesson 01 - Bits, Bytes & Languages

### Features

1. **Interactive input**
   - Text field where the user types any value (text, number, character)
   - Automatic type detection (int, float, string, char)

2. **Multi-base display**
   - Binary, hexadecimal, and decimal side by side
   - Each bit/byte rendered as an individual block
   - Byte highlight on hover

3. **C vs Python size comparison**
   - Same value (e.g., `int(42)`) shown as two memory blocks
   - C: 4 bytes (sizeof int)
   - Python: 28 bytes (PyObject overhead)
   - Visual bar proportional to size
   - Tooltip explaining PyObject overhead (refcount, type pointer, value)

4. **Interactive ASCII table**
   - 16x8 grid with all 128 ASCII characters
   - Click any character → shows byte in binary/hex/decimal
   - Range highlighting: control chars, printable, extended
   - Search by character or numeric value

5. **UTF-8 vs ASCII encoding**
   - Character input (e.g., emoji, accented char, kanji)
   - Shows how many bytes each encoding uses
   - Byte-by-byte visualization with continuation bytes highlighted

### Endpoints

| Method | Route               | Body                          | Response                                    |
| ------ | ------------------- | ----------------------------- | ------------------------------------------- |
| POST   | `/api/bytes/compare` | `{ "value": "42", "type": "int" }` | `{ "c_size": 4, "py_size": 28, "c_type": "int", "py_type": "int", "details": {...} }` |
| POST   | `/api/bytes/encode`  | `{ "text": "Hello", "encoding": "utf-8" }` | `{ "bytes": [72,101,...], "binary": ["01001000",...], "hex": ["48","65",...], "total_bytes": 5 }` |

### Real Backend

- **Python container**: executes `sys.getsizeof()` for Python types
- **C container**: compiles and runs snippet with `printf("%zu", sizeof(int))` and variants
- Both return real results, not hardcoded values

### Frontend Components

```
components/bytes/
├── BytesExplorer.tsx       # Main panel container
├── MultiBaseDisplay.tsx    # Binary/hex/decimal display
├── SizeCompare.tsx         # C vs Python comparison with bars
├── AsciiTable.tsx          # Interactive ASCII grid
└── EncodingCompare.tsx     # UTF-8 vs ASCII side-by-side
```

---

## Panel 2: Shell & Process Explorer

> Lesson 02 - Linux, OS & Bash

### Features

1. **Filesystem & User Explorer**
   - Interactive tree view of a typical Linux filesystem (`/`, `/home`, `/etc`, `/usr`, `/bin`, `/tmp`, `/var`)
   - Visual highlight of key directories with role explanation (e.g., `/etc` = config, `/bin` = binaries, `/home` = user data)
   - **Home directory deep dive**:
     - Shows `/home/alice/` vs `/home/bob/` as separate user spaces
     - Demonstrates that each user has their own home with isolated files
     - Shows hidden dotfiles (`.bashrc`, `.profile`, `.ssh/`) and explains their purpose
     - Visual indicator of ownership & permissions (`drwxr-xr-x alice alice`)
   - **User vs Root comparison**:
     - Side-by-side: regular user (`alice`) vs `root`
     - Shows what each can access (root = everything, user = own home + shared)
     - Visual "lock" icons on directories the user can't write to (e.g., `/etc`, `/usr/bin`)
     - Demonstrates `permission denied` when trying to write outside home
   - **How Bash fits in**:
     - Shows that `/bin/bash` is the shell binary, loaded when user logs in
     - Visual: User logs in → system reads `/etc/passwd` → finds shell (`/bin/bash`) → loads `~/.bashrc`
     - Explains the startup chain: login → `/etc/profile` → `~/.bash_profile` → `~/.bashrc`
     - Interactive: user can edit `.bashrc` (e.g., add alias) and see the effect after "re-login"

2. **Simulated terminal**
   - Prompt styled as `user@sandbox:~$`
   - Safe command subset: `ls`, `cat`, `echo`, `grep`, `wc`, `head`, `tail`, `sort`, `uniq`, `pipe (|)`, `redirect (>)`, `cd`, `pwd`, `whoami`, `id`, `chmod` (limited)
   - Command history (up/down arrow)
   - Basic autocompletion (Tab)
   - `cd` navigates the virtual filesystem tree; `ls` shows contents of current directory
   - `whoami` returns current simulated user; `su alice` / `su bob` switches user context
   - `cat ~/.bashrc` shows shell config; `echo $HOME` shows user's home path

3. **Stream visualization**
   - stdin: green
   - stdout: white/gray
   - stderr: red
   - Each stream as a visual "pipe" with flowing data

4. **Interactive diagram: User → Shell → Kernel → Hardware**
   - 4 stacked layers
   - When executing a command, each layer "lights up" in sequence
   - Explanatory tooltips on each layer
   - Animated arrows showing data flow

5. **Pipe visualization**
   - E.g., `echo "hello world" | grep "hello" | wc -c`
   - Each process as a box
   - Data (text) flowing as stream between boxes
   - Shows data transformation at each stage

6. **Environment & config visualization**
   - Shows key environment variables: `$HOME`, `$USER`, `$PATH`, `$SHELL`, `$PWD`
   - Visual diagram: how `$PATH` is searched when a command is typed (e.g., typing `grep` → searches `/usr/bin/grep`)
   - Demonstrates `export VAR=value` and shows it appearing in environment
   - Shows difference between shell variable vs environment variable (export vs no export)

### Endpoints

| Method | Route               | Body                             | Response                                 |
| ------ | ------------------- | -------------------------------- | ---------------------------------------- |
| POST   | `/api/shell/exec`   | `{ "command": "echo hello \| grep h", "user": "alice" }` | SSE stream: `{ "stream": "stdout", "data": "hello\n", "step": 1 }` |
| GET    | `/api/shell/filesystem` | -                             | `{ "tree": {...}, "users": ["alice","bob","root"] }` |
| POST   | `/api/shell/switch-user` | `{ "user": "bob" }`          | `{ "user": "bob", "home": "/home/bob", "env": {...} }` |

### Real Backend

- Command parsed and validated against whitelist
- Executed inside the `sandbox-py` container (subprocess with timeout)
- Output streamed via SSE (Server-Sent Events)
- Pipes decomposed into stages for visualization
- Virtual filesystem with pre-populated users (`alice`, `bob`, `root`) and typical Linux structure
- Each user context has its own `$HOME`, `$USER`, permissions, and `.bashrc`

### Security

- Whitelist of allowed commands (not a full real shell)
- No access to: `rm -rf`, `mv` (outside sandbox), `chown`, `sudo`, `apt`, `pip`, `python`, `bash -c`
- 5-second timeout per command
- Sandbox filesystem: virtual Linux tree under `/tmp/sandbox/` with pre-created structure
- No network access
- `chmod` only works within user's own home directory
- `su` switches simulated user context, does not actually change OS user

### Frontend Components

```
components/shell/
├── ShellSimulator.tsx      # Interactive terminal with input/output
├── FilesystemTree.tsx      # Visual tree of Linux filesystem with permissions
├── UserCompare.tsx         # Side-by-side user vs root view
├── BashStartupChain.tsx    # Visual: login → profile → bashrc chain
├── EnvVariablesPanel.tsx   # Environment variables display + $PATH search viz
├── StreamVisualizer.tsx    # stdin/stdout/stderr as flows
├── PipeVisualizer.tsx      # Data flowing between processes
└── ProcessDiagram.tsx      # User → Shell → Kernel → Hardware
```

---

## Panel 3: Interpreted vs Compiled

> Lesson 03 - Interpreted vs Compiled

### Features

1. **Split view: C (left) vs Python (right)**
   - Two side-by-side code editors
   - Pre-loaded snippets (fibonacci, sum, factorial) + free editor
   - Syntax highlighting with correct language on each side

2. **C compilation pipeline (animated)**
   ```
   Source Code → Preprocessor → Compiler → Assembler → Linker → Executable
   ```
   - Each stage as a step in a horizontal bar
   - Clicking "Compile" illuminates each step sequentially
   - Shows intermediate output from each stage:
     - Preprocessor: expanded code (macros, includes)
     - Compiler: generated assembly
     - Assembler: object file (size)
     - Linker: executable (size)

3. **Python interpretation pipeline (animated)**
   ```
   Source Code → Bytecode (.pyc) → PVM Interpreter → Output
   ```
   - Shows real bytecode via `dis.dis()`
   - Shows individual opcodes with explanation

4. **Execution metrics**
   - Compilation time (C only)
   - Execution time (both)
   - Binary/bytecode size
   - Visual comparison with bars

5. **Code editor**
   - Textarea with monospace font and syntax highlighting
   - Pre-defined snippets via dropdown
   - Dedicated "Compile/Interpret" button per side
   - Output below each editor

### Endpoints

| Method | Route                    | Body                                      | Response                                          |
| ------ | ------------------------ | ----------------------------------------- | ------------------------------------------------- |
| POST   | `/api/compile/c`         | `{ "code": "#include...", "optimization": "-O0" }` | `{ "stages": [{...}], "output": "...", "exec_time_ms": 1.2, "compile_time_ms": 45, "binary_size": 16384 }` |
| POST   | `/api/interpret/python`  | `{ "code": "def fib(n):..." }`            | `{ "bytecode": "...", "opcodes": [{...}], "output": "...", "exec_time_ms": 3.5 }` |

### Detailed `/api/compile/c` Response

```json
{
  "stages": [
    {
      "name": "preprocessor",
      "status": "success",
      "output_preview": "// expanded code...",
      "time_ms": 2.1
    },
    {
      "name": "compiler",
      "status": "success",
      "output_preview": ".section .text\nmain:\n  push rbp...",
      "time_ms": 35.0
    },
    {
      "name": "assembler",
      "status": "success",
      "object_size": 1240,
      "time_ms": 5.0
    },
    {
      "name": "linker",
      "status": "success",
      "binary_size": 16384,
      "time_ms": 3.0
    }
  ],
  "output": "fibonacci(10) = 55",
  "exec_time_ms": 1.2,
  "compile_time_ms": 45.1
}
```

### Detailed `/api/interpret/python` Response

```json
{
  "bytecode_raw": "  2           0 LOAD_FAST                0 (n)\n              2 LOAD_CONST               1 (2)\n...",
  "opcodes": [
    { "offset": 0, "opname": "LOAD_FAST", "arg": 0, "argval": "n", "line": 2 },
    { "offset": 2, "opname": "LOAD_CONST", "arg": 1, "argval": 2, "line": 2 }
  ],
  "output": "fibonacci(10) = 55",
  "exec_time_ms": 3.5,
  "pyc_size": 312
}
```

### Real Backend

- **C container** (`sandbox-c`):
  - `gcc -E` for preprocessor
  - `gcc -S` for assembly
  - `gcc -c` for object file
  - `gcc -o` for linking
  - Binary execution with `time`
  - Each stage measured separately

- **Python container** (`sandbox-py`):
  - `compile()` + `dis.dis()` for bytecode
  - `exec()` with `time.perf_counter()` for timing
  - Output capture via StringIO

### Frontend Components

```
components/compiler/
├── CompileView.tsx          # Main split-view container
├── CodeEditor.tsx           # Editor with syntax highlighting
├── PipelineAnimation.tsx    # C / Python pipeline steps
├── BytecodeView.tsx         # Python opcodes visualization
├── AssemblyView.tsx         # C assembly visualization
├── TimingComparison.tsx     # Comparative time bars
└── SnippetSelector.tsx      # Pre-defined snippets dropdown
```

---

## Panel 4: Stack vs Heap Visualizer

> Lesson 04 - Stack vs Heap

### Features

1. **Dual-column memory visualization**
   - Stack: left column, grows top to bottom
   - Heap: right column, blocks allocated at varying positions
   - Simulated memory addresses (0xFFFF... for stack, 0x0000... for heap)

2. **Step-by-step execution**
   - Pre-defined or user-editable program
   - Buttons: Play, Pause, Step Forward, Step Back, Reset
   - Speed slider (0.5x to 4x)
   - Current line highlighted in editor

3. **Stack frames**
   - Each function call creates a new frame
   - Frame shows: function name, local variables, return address
   - Push animation (frame appears on top) and pop (frame disappears)
   - Different colors per frame to distinguish calls

4. **Heap allocations**
   - malloc/new: block appears on heap with proportional size
   - free/delete: block disappears (or marked as "freed")
   - Shows visual fragmentation (gaps between blocks)
   - Pointers as arrows from stack to heap

5. **C vs Python comparison**
   - Toggle between C mode and Python mode
   - C: manual control with malloc/free, stack for locals
   - Python: everything on heap (PyObjects), visible reference counting
   - Shows refcount incrementing/decrementing in Python

6. **Special demonstrations**
   - Stack overflow: infinite recursion until crash (dramatic animation)
   - Memory leak: malloc without free, heap growing indefinitely
   - Double free: shows the problem visually
   - Python garbage collection: unreferenced objects being collected

### Endpoints

| Method | Route                         | Body                              | Response                                    |
| ------ | ----------------------------- | --------------------------------- | ------------------------------------------- |
| POST   | `/api/memory/trace-c`         | `{ "code": "int main()..." }`    | `{ "session_id": "abc123", "total_steps": 15 }` |
| POST   | `/api/memory/trace-py`        | `{ "code": "def foo():..." }`    | `{ "session_id": "def456", "total_steps": 12 }` |
| GET    | `/api/memory/step/{session_id}?step=0` | -                        | `{ "step": 0, "line": 3, "action": "stack_push", "frame": {...}, "stack": [...], "heap": [...] }` |

### Step Response

```json
{
  "step": 3,
  "line": 5,
  "action": "heap_alloc",
  "description": "malloc(sizeof(int) * 10) - allocating 40 bytes on the heap",
  "stack": [
    {
      "function": "main",
      "variables": [
        { "name": "arr", "type": "int*", "value": "0x1000", "points_to_heap": true }
      ],
      "return_addr": "0x0"
    }
  ],
  "heap": [
    {
      "address": "0x1000",
      "size": 40,
      "type": "int[10]",
      "status": "allocated",
      "allocated_by": "main"
    }
  ],
  "refcounts": null
}
```

### Real Backend

- **C container** (`sandbox-c`):
  - Custom malloc/free wrapper via `LD_PRELOAD`
  - Intercepts all allocation calls
  - Records stack frames via `-finstrument-functions` or GDB breakpoints
  - Generates JSON trace of each step

- **Python container** (`sandbox-py`):
  - `tracemalloc` to track allocations
  - `sys.getrefcount()` for reference counting
  - `gc.get_referrers()` for object relationships
  - Instrumentation via `sys.settrace()` for step-by-step line execution

### Frontend Components

```
components/memory/
├── StackHeapVisualizer.tsx  # Main dual-column container
├── StackColumn.tsx          # Stack visualization
├── HeapColumn.tsx           # Heap visualization
├── StackFrame.tsx           # Individual frame with variables
├── HeapBlock.tsx            # Memory block on heap
├── PointerArrow.tsx         # Arrow from stack to heap (SVG)
├── StepControls.tsx         # Play/Pause/Step/Speed
├── MemoryCodeEditor.tsx     # Editor with current line highlight
└── RefCountBadge.tsx        # Reference count badge (Python mode)
```

---

## Docker Compose

```yaml
version: "3.9"

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "5173:5173"
    volumes:
      - ./frontend/src:/app/src
    environment:
      - VITE_API_URL=http://localhost:8000
    depends_on:
      - api

  api:
    build:
      context: ./api
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    volumes:
      - ./api/src:/app/src
      - /var/run/docker.sock:/var/run/docker.sock
    environment:
      - SANDBOX_PY_IMAGE=code-internals-sandbox-py
      - SANDBOX_C_IMAGE=code-internals-sandbox-c
      - EXECUTION_TIMEOUT=5
    depends_on:
      - sandbox-py
      - sandbox-c

  sandbox-py:
    build:
      context: ./sandbox-py
      dockerfile: Dockerfile
    image: code-internals-sandbox-py
    # No exposed ports - accessed via Docker exec by the api
    network_mode: "none"
    read_only: true
    tmpfs:
      - /tmp:size=50M
    mem_limit: 128m
    cpus: 0.5
    security_opt:
      - no-new-privileges:true

  sandbox-c:
    build:
      context: ./sandbox-c
      dockerfile: Dockerfile
    image: code-internals-sandbox-c
    network_mode: "none"
    read_only: true
    tmpfs:
      - /tmp:size=50M
    mem_limit: 128m
    cpus: 0.5
    security_opt:
      - no-new-privileges:true
```

---

## Sandbox Security

### Principles

1. **Network isolation**: `network_mode: "none"` on both sandbox containers
2. **Read-only filesystem**: only `/tmp` with tmpfs limited to 50MB
3. **Limited resources**: 128MB RAM, 0.5 CPU per container
4. **Timeout**: 5 seconds per execution (enforced by the API)
5. **No privileges**: `no-new-privileges:true`

### Input Validation

```python
# api/src/services/sandbox.py

BLOCKED_IMPORTS = {
    "os", "subprocess", "shutil", "socket", "http",
    "urllib", "ftplib", "smtplib", "telnetlib",
    "ctypes", "multiprocessing", "threading",
    "signal", "resource", "pty", "fcntl",
}

SHELL_WHITELIST = {
    "ls", "cat", "echo", "grep", "wc", "head",
    "tail", "sort", "uniq", "tr", "cut", "sed",
    "awk", "tee", "diff", "comm",
}

MAX_CODE_LENGTH = 5000  # characters
MAX_OUTPUT_LENGTH = 10000  # characters
```

### C Code Validation

```python
BLOCKED_C_FUNCTIONS = {
    "system", "popen", "exec", "fork", "execve",
    "execvp", "socket", "connect", "bind", "listen",
    "fopen",  # restricted to /tmp only
}

BLOCKED_C_HEADERS = {
    "sys/socket.h", "netinet/in.h", "arpa/inet.h",
    "sys/ptrace.h",
}
```

---

## Complete API Endpoints

### FastAPI main.py

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import bytes_router, shell_router, compiler_router, memory_router

app = FastAPI(title="Code Internals Explorer API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bytes_router, prefix="/api/bytes", tags=["bytes"])
app.include_router(shell_router, prefix="/api/shell", tags=["shell"])
app.include_router(compiler_router, prefix="/api/compile", tags=["compiler"])
app.include_router(memory_router, prefix="/api/memory", tags=["memory"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
```

### All Endpoints Summary

| Method | Route                             | Description                            | Response Type |
| ------ | --------------------------------- | -------------------------------------- | ------------- |
| GET    | `/api/health`                     | Health check                           | JSON          |
| POST   | `/api/bytes/compare`              | Compare C vs Python type sizes         | JSON          |
| POST   | `/api/bytes/encode`               | Encode value to bin/hex/utf8           | JSON          |
| POST   | `/api/shell/exec`                 | Execute command in sandbox             | SSE stream    |
| POST   | `/api/compile/c`                  | Compile and execute C                  | JSON          |
| POST   | `/api/interpret/python`           | Interpret Python + bytecode            | JSON          |
| POST   | `/api/memory/trace-c`             | Start C memory trace                   | JSON          |
| POST   | `/api/memory/trace-py`            | Start Python memory trace              | JSON          |
| GET    | `/api/memory/step/{session_id}`   | Get execution step                     | JSON          |

---

## Folder Structure

```
code-internals-project/
├── 01_CORE_PLAN.md
├── 02_UI_REFINEMENT_PLAN.md
├── docker-compose.yml
│
├── frontend/
│   ├── Dockerfile
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── index.html
│   └── src/
│       ├── main.tsx
│       ├── App.tsx
│       ├── index.css
│       ├── components/
│       │   ├── layout/
│       │   │   ├── AppShell.tsx          # Main layout (header + content)
│       │   │   └── TabNav.tsx            # Tab navigation
│       │   ├── shared/
│       │   │   ├── CodeBlock.tsx          # Code block with syntax highlight
│       │   │   ├── MemoryBlock.tsx        # Generic memory block
│       │   │   ├── StreamOutput.tsx       # SSE stream output
│       │   │   ├── CompareBar.tsx         # Comparative bar (C vs Python)
│       │   │   └── LoadingSpinner.tsx     # Loading spinner
│       │   ├── bytes/
│       │   │   ├── BytesExplorer.tsx
│       │   │   ├── MultiBaseDisplay.tsx
│       │   │   ├── SizeCompare.tsx
│       │   │   ├── AsciiTable.tsx
│       │   │   └── EncodingCompare.tsx
│       │   ├── shell/
│       │   │   ├── ShellSimulator.tsx
│       │   │   ├── StreamVisualizer.tsx
│       │   │   ├── PipeVisualizer.tsx
│       │   │   └── ProcessDiagram.tsx
│       │   ├── compiler/
│       │   │   ├── CompileView.tsx
│       │   │   ├── CodeEditor.tsx
│       │   │   ├── PipelineAnimation.tsx
│       │   │   ├── BytecodeView.tsx
│       │   │   ├── AssemblyView.tsx
│       │   │   ├── TimingComparison.tsx
│       │   │   └── SnippetSelector.tsx
│       │   └── memory/
│       │       ├── StackHeapVisualizer.tsx
│       │       ├── StackColumn.tsx
│       │       ├── HeapColumn.tsx
│       │       ├── StackFrame.tsx
│       │       ├── HeapBlock.tsx
│       │       ├── PointerArrow.tsx
│       │       ├── StepControls.tsx
│       │       ├── MemoryCodeEditor.tsx
│       │       └── RefCountBadge.tsx
│       ├── hooks/
│       │   ├── useSSE.ts                 # Generic hook for SSE streams
│       │   ├── useCompile.ts             # Hook for compilation/interpretation
│       │   ├── useMemoryTrace.ts         # Hook for step-by-step memory trace
│       │   └── useBytesCompare.ts        # Hook for bytes comparison
│       └── lib/
│           ├── api.ts                    # Fetch wrapper + base URL config
│           ├── types.ts                  # Shared TypeScript types
│           └── constants.ts              # Pre-defined snippets, colors, etc.
│
├── api/
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── src/
│       ├── main.py                       # FastAPI app + CORS + routers
│       ├── config.py                     # Settings (timeout, image names, etc.)
│       ├── routes/
│       │   ├── __init__.py
│       │   ├── bytes.py                  # /api/bytes/*
│       │   ├── shell.py                  # /api/shell/*
│       │   ├── compiler.py               # /api/compile/* + /api/interpret/*
│       │   └── memory.py                 # /api/memory/*
│       ├── services/
│       │   ├── __init__.py
│       │   ├── sandbox.py                # Docker exec abstraction + security
│       │   ├── c_compiler.py             # gcc pipeline (preprocess, compile, assemble, link)
│       │   ├── python_runner.py          # Python exec + dis.dis + tracemalloc
│       │   ├── memory_tracer.py          # Trace session manager (step-by-step)
│       │   └── shell_executor.py         # Whitelist + pipe decomposition
│       └── models/
│           ├── __init__.py
│           ├── bytes_models.py           # Pydantic models for bytes endpoints
│           ├── shell_models.py
│           ├── compiler_models.py
│           └── memory_models.py
│
├── sandbox-py/
│   ├── Dockerfile
│   ├── requirements.txt                  # Minimal: no extra deps
│   └── scripts/
│       ├── run_code.py                   # Executes Python code with capture
│       ├── trace_memory.py               # tracemalloc + sys.settrace
│       └── get_bytecode.py               # dis.dis wrapper
│
└── sandbox-c/
    ├── Dockerfile                        # gcc:13 + custom malloc wrapper
    ├── Makefile
    └── src/
        ├── malloc_wrapper.c              # LD_PRELOAD interceptor
        ├── malloc_wrapper.h
        └── run_traced.sh                 # Script to run C with tracing
```

---

## Phase 1 UI (Simple, Functional)

### Theme

- Basic dark theme with Tailwind
- `bg-gray-900` background, `text-gray-100` main text
- `bg-gray-800` for cards/panels
- `border-gray-700` for subtle borders

### Layout

```
┌─────────────────────────────────────────────────┐
│  [Bytes] [Shell] [Compiled vs Interpreted] [Memory]  │  ← Tabs
├─────────────────────────────────────────────────┤
│                                                 │
│              Active panel content                │
│                                                 │
│                                                 │
└─────────────────────────────────────────────────┘
```

- Tabs at the top, no sidebar
- No welcome page in phase 1 (goes directly to the first panel)
- Responsive grid: 1 column on mobile, 2 columns on desktop for split views
- Code blocks with syntax highlighting via `highlight.js` or `prism-react-renderer`

### Minimal Animations

- CSS transitions for stack frames (height, opacity)
- Animated progress bar for compilation pipeline
- No animation libraries in phase 1 (pure CSS)

---

## Pre-defined Snippets

### C

```c
// fibonacci.c
#include <stdio.h>

int fibonacci(int n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

int main() {
    printf("fibonacci(10) = %d\n", fibonacci(10));
    return 0;
}
```

```c
// malloc_demo.c
#include <stdio.h>
#include <stdlib.h>

int main() {
    int *arr = (int *)malloc(10 * sizeof(int));
    for (int i = 0; i < 10; i++) {
        arr[i] = i * i;
    }
    printf("arr[5] = %d\n", arr[5]);
    free(arr);
    return 0;
}
```

```c
// stack_overflow.c
#include <stdio.h>

void recurse(int depth) {
    int local_var = depth;
    printf("depth: %d, addr: %p\n", depth, &local_var);
    recurse(depth + 1);
}

int main() {
    recurse(0);
    return 0;
}
```

### Python

```python
# fibonacci.py
def fibonacci(n):
    if n <= 1:
        return n
    return fibonacci(n - 1) + fibonacci(n - 2)

print(f"fibonacci(10) = {fibonacci(10)}")
```

```python
# memory_demo.py
def create_objects():
    a = [1, 2, 3]
    b = a          # b points to the same object
    c = [4, 5, 6]
    del a          # removes reference, but b still points to it
    return b, c

result = create_objects()
print(result)
```

---

## Suggested Implementation Order

1. **Infrastructure**: Docker Compose + Dockerfiles + FastAPI skeleton + Vite scaffold
2. **Panel 1 (Bytes)**: Simplest, validates frontend ↔ backend ↔ sandbox communication
3. **Panel 3 (Compiler)**: Validates the full C pipeline in the container
4. **Panel 2 (Shell)**: Requires SSE streaming
5. **Panel 4 (Memory)**: Most complex, depends on advanced instrumentation
6. **Polish**: Tests, error handling, edge cases
