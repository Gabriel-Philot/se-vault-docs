#!/usr/bin/env python3
"""Trace memory allocations and line-by-line execution."""
import json
import sys
import tracemalloc


def trace_execution(code: str) -> dict:
    steps = []
    tracemalloc.start()

    compiled = compile(code, "<user>", "exec")
    local_vars = {}

    def tracer(frame, event, arg):
        if frame.f_code.co_filename != "<user>":
            return tracer
        snapshot = tracemalloc.take_snapshot()
        stats = snapshot.statistics("lineno")
        current_mem = sum(s.size for s in stats)

        step = {
            "line": frame.f_lineno,
            "event": event,
            "locals": {k: repr(v) for k, v in frame.f_locals.items()
                       if not k.startswith("_")},
            "memory_bytes": current_mem,
        }

        if event == "call":
            step["action"] = "stack_push"
            step["function"] = frame.f_code.co_name
        elif event == "return":
            step["action"] = "stack_pop"
            step["function"] = frame.f_code.co_name
            step["return_value"] = repr(arg)
        else:
            step["action"] = "line"

        steps.append(step)
        return tracer

    sys.settrace(tracer)
    try:
        exec(compiled, {"__builtins__": __builtins__}, local_vars)
    except Exception as e:
        steps.append({"action": "error", "error": f"{type(e).__name__}: {e}"})
    finally:
        sys.settrace(None)
        tracemalloc.stop()

    return {"steps": steps, "total_steps": len(steps)}


if __name__ == "__main__":
    code = sys.stdin.read()
    result = trace_execution(code)
    print(json.dumps(result))
