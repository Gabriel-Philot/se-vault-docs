#!/usr/bin/env python3
"""Execute Python code safely with output capture."""
import io
import json
import sys
import time


def run(code: str) -> dict:
    stdout_capture = io.StringIO()
    stderr_capture = io.StringIO()
    old_stdout, old_stderr = sys.stdout, sys.stderr
    sys.stdout, sys.stderr = stdout_capture, stderr_capture

    start = time.perf_counter()
    error = None
    try:
        exec(code, {"__builtins__": __builtins__})
    except Exception as e:
        error = f"{type(e).__name__}: {e}"
    finally:
        elapsed_ms = (time.perf_counter() - start) * 1000
        sys.stdout, sys.stderr = old_stdout, old_stderr

    return {
        "stdout": stdout_capture.getvalue(),
        "stderr": stderr_capture.getvalue(),
        "error": error,
        "exec_time_ms": round(elapsed_ms, 3),
    }


if __name__ == "__main__":
    code = sys.stdin.read()
    result = run(code)
    print(json.dumps(result))
