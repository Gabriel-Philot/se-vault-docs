#!/usr/bin/env python3
"""Get Python bytecode via dis.dis() and return structured JSON."""
import dis
import io
import json
import marshal
import sys
import time


def get_bytecode(code: str) -> dict:
    start = time.perf_counter()
    try:
        compiled = compile(code, "<user>", "exec")
    except SyntaxError as e:
        return {"error": f"SyntaxError: {e}"}

    compile_ms = (time.perf_counter() - start) * 1000

    # Get raw bytecode text
    raw = io.StringIO()
    dis.dis(compiled, file=raw)
    bytecode_raw = raw.getvalue()

    # Extract structured opcodes
    opcodes = []
    for instr in dis.get_instructions(compiled):
        opcodes.append({
            "offset": instr.offset,
            "opname": instr.opname,
            "arg": instr.arg,
            "argval": str(instr.argval) if instr.argval is not None else None,
            "line": instr.starts_line,
        })

    # Get pyc size estimate
    pyc_size = len(marshal.dumps(compiled))

    # Execute and capture output
    stdout_capture = io.StringIO()
    old_stdout = sys.stdout
    sys.stdout = stdout_capture
    exec_start = time.perf_counter()
    error = None
    try:
        exec(compiled, {"__builtins__": __builtins__})
    except Exception as e:
        error = f"{type(e).__name__}: {e}"
    finally:
        exec_ms = (time.perf_counter() - exec_start) * 1000
        sys.stdout = old_stdout

    return {
        "bytecode_raw": bytecode_raw,
        "opcodes": opcodes,
        "output": stdout_capture.getvalue(),
        "exec_time_ms": round(exec_ms, 3),
        "pyc_size": pyc_size,
        "error": error,
    }


if __name__ == "__main__":
    code = sys.stdin.read()
    result = get_bytecode(code)
    print(json.dumps(result))
