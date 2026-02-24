# Plan: Remaining Work - Frontend Only

## Context

Phases 1+2 are DONE. Phase 3+4 (frontend) is the only remaining work.

**Root**: `/home/philot/compendium/studies/se-vault-docs/se-for-data-non-se/lessons/02-python/code-internals-project/`

## Completed
- Phase 1 (Infra): 31 files - docker-compose, Dockerfiles, configs, sandbox-c, sandbox-py
- Phase 2 (Backend): 19 files - models, services, routes, main.py wired with all routers
- `api/src/main.py` already has all routers wired (bytes, shell, compile, interpret, memory)

## Remaining: Frontend (~35 files)

**Strategy**: Spawn ONE `frontend-builder` agent with ALL file specs in a single prompt. No more incremental messages. The agent creates everything via bash `cat > file << 'EOF'` commands.

### Files to create:

**Lib (3 files)**:
- `src/lib/types.ts` - TS interfaces matching backend Pydantic models
- `src/lib/api.ts` - fetch wrapper + SSE reader (data-race pattern)
- `src/lib/constants.ts` - pre-defined snippets, ASCII data, panel configs

**Hooks (4 files)**:
- `src/hooks/useSSE.ts` - generic SSE with AbortController
- `src/hooks/useBytesCompare.ts`
- `src/hooks/useCompile.ts`
- `src/hooks/useMemoryTrace.ts` - play/pause/step/speed

**Layout (2 files)**:
- `src/components/layout/AppShell.tsx`
- `src/components/layout/TabNav.tsx`

**Shared (4 files)**:
- `src/components/shared/CodeBlock.tsx`
- `src/components/shared/CompareBar.tsx`
- `src/components/shared/StreamOutput.tsx`
- `src/components/shared/LoadingSpinner.tsx`

**Bytes panel (5 files)**:
- `BytesExplorer.tsx`, `MultiBaseDisplay.tsx`, `SizeCompare.tsx`, `AsciiTable.tsx`, `EncodingCompare.tsx`

**Shell panel (8 files)**:
- `ShellSimulator.tsx`, `FilesystemTree.tsx`, `UserCompare.tsx`, `BashStartupChain.tsx`, `EnvVariablesPanel.tsx`, `StreamVisualizer.tsx`, `PipeVisualizer.tsx`, `ProcessDiagram.tsx`

**Compiler panel (7 files)**:
- `CompileView.tsx`, `CodeEditor.tsx`, `PipelineAnimation.tsx`, `BytecodeView.tsx`, `AssemblyView.tsx`, `TimingComparison.tsx`, `SnippetSelector.tsx`

**Memory panel (9 files)**:
- `StackHeapVisualizer.tsx`, `StackColumn.tsx`, `StackFrame.tsx`, `HeapColumn.tsx`, `HeapBlock.tsx`, `PointerArrow.tsx`, `StepControls.tsx`, `MemoryCodeEditor.tsx`, `RefCountBadge.tsx`

**App.tsx** (1 file): Replace placeholder with real tab routing

### Execution Flow

1. **Spawn `frontend-builder`** (general-purpose agent, bypassPermissions)
   - ONE prompt with ALL ~35 file specs
   - Creates via bash `cat > file << 'EOF'`
   - Team lead does NOT write frontend code itself

2. **Spawn `devils-advocate`** (Explore agent, read-only)
   - Reviews ALL code written so far (backend + frontend)
   - Checklist:
     - Type safety (no `any`, proper interfaces)
     - Security (sandbox validation, blocked imports, timeouts)
     - API contract match (frontend types ↔ backend Pydantic models)
     - No files outside `code-internals-project/`
     - Docker isolation (network_mode, read_only, resource limits)
     - SSE protocol correctness (`data: {json}\n\n` format)
     - No hardcoded values where real execution expected
   - Reports issues to team lead via SendMessage
   - **NEVER writes/edits files** - read-only only

3. **If devils-advocate finds issues**:
   - Team lead receives the report
   - Team lead re-spawns `frontend-builder` (or `backend-builder`) with fix instructions
   - Devils-advocate re-reviews after fixes

4. **UI Validation with Playwright MCP**:
   - After frontend is built, run `docker compose up` (or `npm run dev`)
   - Use `browser_navigate` to open `http://localhost:5173`
   - Use `browser_snapshot` to verify all 4 panels render
   - Use `browser_take_screenshot` for visual confirmation

### Rules (SACRED)
- Team lead NEVER writes component code itself - only spawns agents
- `devils-advocate` is Explore-type agent (NO write tools)
- `devils-advocate` reports to team lead, team lead dispatches fixes
- Playwright MCP used for final UI check

### Verification
- `find frontend/src -name "*.tsx" -o -name "*.ts" | wc -l` should be ~40+
- All component imports resolve
- No `any` types
- Devils-advocate sign-off on all phases
- Playwright screenshot confirms UI renders
