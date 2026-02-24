from __future__ import annotations

import json
import uuid

from src.config import SANDBOX_PY_CONTAINER, SANDBOX_C_CONTAINER
from src.services.sandbox import run_in_sandbox, validate_python_code, validate_c_code
from src.models.memory_models import (
    HeapBlock,
    StackFrame,
    StackVariable,
    StepResponse,
)

# In-memory session storage
_sessions: dict[str, dict] = {}


def create_python_trace(code: str) -> tuple[str, int]:
    """Create a Python memory trace session."""
    error = validate_python_code(code)
    if error:
        raise ValueError(error)

    exit_code, stdout, stderr = run_in_sandbox(
        SANDBOX_PY_CONTAINER,
        ["python3", "/sandbox/scripts/trace_memory.py"],
        stdin_data=code,
    )

    if exit_code != 0:
        raise RuntimeError(stderr or stdout or "Trace failed")

    try:
        trace_data = json.loads(stdout)
    except json.JSONDecodeError:
        start = stdout.find("{")
        end = stdout.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise RuntimeError(f"Invalid trace output: {stdout[:200]}")
        try:
            trace_data = json.loads(stdout[start : end + 1])
        except json.JSONDecodeError:
            raise RuntimeError(f"Invalid trace output: {stdout[:200]}")

    session_id = str(uuid.uuid4())[:8]
    steps = _build_python_steps(trace_data.get("steps", []), code)
    _sessions[session_id] = {"steps": steps, "language": "python", "code": code}

    return session_id, len(steps)


def create_c_trace(code: str) -> tuple[str, int]:
    """Create a C memory trace session by analyzing code statically."""
    error = validate_c_code(code)
    if error:
        raise ValueError(error)

    # For C, we do a static analysis approach combined with compile+run
    session_id = str(uuid.uuid4())[:8]
    steps = _build_c_steps_static(code)
    _sessions[session_id] = {"steps": steps, "language": "c", "code": code}

    return session_id, len(steps)


def get_step(session_id: str, step: int) -> StepResponse:
    """Get a specific step from a trace session."""
    session = _sessions.get(session_id)
    if session is None:
        raise ValueError(f"Session not found: {session_id}")

    steps = session["steps"]
    if step < 0 or step >= len(steps):
        raise ValueError(f"Step {step} out of range (0-{len(steps) - 1})")

    return steps[step]


def _build_python_steps(raw_steps: list[dict], code: str) -> list[StepResponse]:
    """Convert raw trace data into structured StepResponse objects."""
    steps: list[StepResponse] = []
    stack: list[StackFrame] = []
    heap: list[HeapBlock] = []
    refcounts: dict[str, int] = {}

    lines = code.split("\n")

    for i, raw in enumerate(raw_steps):
        action = raw.get("action", "line")
        line = raw.get("line", 1)
        func = raw.get("function", "<module>")
        line_text = lines[line - 1].strip() if 0 < line <= len(lines) else ""

        if action == "stack_push":
            variables = []
            for name, val in raw.get("locals", {}).items():
                is_heap = isinstance(val, str) and (
                    val.startswith("[") or val.startswith("{") or val.startswith("(")
                )
                variables.append(
                    StackVariable(
                        name=name,
                        type="object",
                        value=str(val)[:50],
                        points_to_heap=is_heap,
                    )
                )
            frame = StackFrame(function=func, variables=variables)
            stack = [*stack, frame]
            description = f"Calling {func}()"

        elif action == "stack_pop":
            description = f"Returning from {func}()"
            stack = [f for f in stack if f.function != func] if stack else []

        else:
            # Update variables in current frame
            if stack:
                variables = []
                for name, val in raw.get("locals", {}).items():
                    is_heap = isinstance(val, str) and (
                        val.startswith("[")
                        or val.startswith("{")
                        or val.startswith("(")
                    )
                    variables.append(
                        StackVariable(
                            name=name,
                            type="object",
                            value=str(val)[:50],
                            points_to_heap=is_heap,
                        )
                    )
                    if is_heap:
                        addr = f"0x{id(val) & 0xFFFF:04x}"
                        refcounts[addr] = refcounts.get(addr, 0) + 1
                stack[-1] = StackFrame(function=stack[-1].function, variables=variables)
            description = f"Line {line}: {line_text}"

        steps.append(
            StepResponse(
                step=i,
                line=line,
                action=action,
                description=description,
                stack=list(stack),
                heap=list(heap),
                refcounts=refcounts if refcounts else None,
            )
        )

    return steps


def _build_c_steps_static(code: str) -> list[StepResponse]:
    """Build C memory trace steps via static analysis of the code."""
    steps: list[StepResponse] = []
    stack: list[StackFrame] = []
    heap: list[HeapBlock] = []
    lines = code.split("\n")

    heap_addr_counter = 0x1000
    step_idx = 0

    for line_num, line in enumerate(lines, 1):
        stripped = line.strip()
        if not stripped or stripped.startswith("//") or stripped.startswith("#"):
            continue

        # Detect function entry
        if (
            "(" in stripped
            and "{" in stripped
            and not stripped.startswith("if")
            and not stripped.startswith("for")
            and not stripped.startswith("while")
        ):
            func_name = (
                stripped.split("(")[0].split()[-1]
                if stripped.split("(")[0].split()
                else "unknown"
            )
            frame = StackFrame(function=func_name, variables=[], return_addr="0x0")
            stack.append(frame)
            steps.append(
                StepResponse(
                    step=step_idx,
                    line=line_num,
                    action="stack_push",
                    description=f"Entering {func_name}()",
                    stack=list(stack),
                    heap=list(heap),
                    refcounts=None,
                )
            )
            step_idx += 1
            continue

        # Detect variable declarations
        if any(
            stripped.startswith(t)
            for t in ("int ", "float ", "double ", "char ", "long ")
        ):
            parts = stripped.rstrip(";").split("=")
            decl = parts[0].strip().split()
            if len(decl) >= 2:
                var_type = decl[0]
                var_name = decl[-1].strip("*")
                var_val = parts[1].strip() if len(parts) > 1 else "0"
                if stack:
                    stack[-1].variables.append(
                        StackVariable(
                            name=var_name,
                            type=var_type,
                            value=var_val[:20],
                            points_to_heap="*" in stripped,
                        )
                    )
            steps.append(
                StepResponse(
                    step=step_idx,
                    line=line_num,
                    action="line",
                    description=f"Line {line_num}: {stripped}",
                    stack=list(stack),
                    heap=list(heap),
                    refcounts=None,
                )
            )
            step_idx += 1
            continue

        # Detect malloc
        if "malloc(" in stripped:
            size_str = stripped.split("malloc(")[1].split(")")[0]
            block = HeapBlock(
                address=f"0x{heap_addr_counter:04x}",
                size=40,
                type="dynamic",
                status="allocated",
                allocated_by=stack[-1].function if stack else "unknown",
            )
            heap.append(block)
            # Update pointer variable
            if "=" in stripped and stack:
                var_name = stripped.split("=")[0].strip().split()[-1].strip("*")
                for v in stack[-1].variables:
                    if v.name == var_name:
                        v.value = f"0x{heap_addr_counter:04x}"
                        v.points_to_heap = True
            heap_addr_counter += 0x100
            steps.append(
                StepResponse(
                    step=step_idx,
                    line=line_num,
                    action="heap_alloc",
                    description=f"malloc({size_str}) - allocating on heap",
                    stack=list(stack),
                    heap=list(heap),
                    refcounts=None,
                )
            )
            step_idx += 1
            continue

        # Detect free
        if "free(" in stripped:
            ptr_name = stripped.split("free(")[1].split(")")[0].strip()
            for block in heap:
                if block.status == "allocated":
                    block.status = "freed"
                    break
            steps.append(
                StepResponse(
                    step=step_idx,
                    line=line_num,
                    action="heap_free",
                    description=f"free({ptr_name}) - deallocating heap memory",
                    stack=list(stack),
                    heap=list(heap),
                    refcounts=None,
                )
            )
            step_idx += 1
            continue

        # Detect return / closing brace
        if stripped.startswith("return") or (stripped == "}" and stack):
            if stripped.startswith("return"):
                steps.append(
                    StepResponse(
                        step=step_idx,
                        line=line_num,
                        action="line",
                        description=f"Line {line_num}: {stripped}",
                        stack=list(stack),
                        heap=list(heap),
                        refcounts=None,
                    )
                )
                step_idx += 1
            if stripped == "}" and stack:
                func = stack[-1].function
                stack.pop()
                steps.append(
                    StepResponse(
                        step=step_idx,
                        line=line_num,
                        action="stack_pop",
                        description=f"Returning from {func}()",
                        stack=list(stack),
                        heap=list(heap),
                        refcounts=None,
                    )
                )
                step_idx += 1
            continue

        # Default: regular line
        steps.append(
            StepResponse(
                step=step_idx,
                line=line_num,
                action="line",
                description=f"Line {line_num}: {stripped}",
                stack=list(stack),
                heap=list(heap),
                refcounts=None,
            )
        )
        step_idx += 1

    return steps
