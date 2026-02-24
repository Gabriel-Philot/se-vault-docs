from __future__ import annotations

import re
import time

from src.config import SANDBOX_C_CONTAINER
from src.services.sandbox import run_in_sandbox, validate_c_code


def _extract_peak_rss_kb(stderr: str) -> int | None:
    match = re.search(r"__MM_RSS_KB__:(\d+)", stderr)
    if not match:
        return None
    return int(match.group(1))


def _strip_peak_rss_marker(stderr: str) -> str:
    return re.sub(r"\n?__MM_RSS_KB__:\d+\n?", "\n", stderr).strip()


def compile_c(code: str, optimization: str = "-O0") -> dict:
    """Run the full GCC pipeline and return stage-by-stage results."""
    error = validate_c_code(code)
    if error:
        return {"error": error}

    if optimization not in ("-O0", "-O1", "-O2", "-O3", "-Os"):
        optimization = "-O0"

    # Write source to sandbox
    run_in_sandbox(
        SANDBOX_C_CONTAINER,
        ["sh", "-c", "cat > /tmp/user_code.c"],
        stdin_data=code,
    )

    stages: list[dict] = []
    total_compile_ms = 0.0

    # Stage 1: Preprocessor
    t0 = time.perf_counter()
    exit_code, stdout, stderr = run_in_sandbox(
        SANDBOX_C_CONTAINER,
        ["gcc", "-E", "/tmp/user_code.c", "-o", "/tmp/preprocessed.c"],
    )
    ms = (time.perf_counter() - t0) * 1000
    total_compile_ms += ms

    if exit_code != 0:
        stages.append(
            {
                "name": "preprocessor",
                "status": "error",
                "output_preview": stderr,
                "time_ms": round(ms, 2),
            }
        )
        return {
            "stages": stages,
            "output": "",
            "exec_time_ms": 0,
            "compile_time_ms": round(total_compile_ms, 2),
            "binary_size": 0,
            "error": stderr,
        }

    _, preview, _ = run_in_sandbox(
        SANDBOX_C_CONTAINER, ["head", "-50", "/tmp/preprocessed.c"]
    )
    stages.append(
        {
            "name": "preprocessor",
            "status": "success",
            "output_preview": preview.strip(),
            "time_ms": round(ms, 2),
        }
    )

    # Stage 2: Compiler (to assembly)
    t0 = time.perf_counter()
    exit_code, stdout, stderr = run_in_sandbox(
        SANDBOX_C_CONTAINER,
        ["gcc", optimization, "-S", "/tmp/user_code.c", "-o", "/tmp/user_code.s"],
    )
    ms = (time.perf_counter() - t0) * 1000
    total_compile_ms += ms

    if exit_code != 0:
        stages.append(
            {
                "name": "compiler",
                "status": "error",
                "output_preview": stderr,
                "time_ms": round(ms, 2),
            }
        )
        return {
            "stages": stages,
            "output": "",
            "exec_time_ms": 0,
            "compile_time_ms": round(total_compile_ms, 2),
            "binary_size": 0,
            "error": stderr,
        }

    _, asm_preview, _ = run_in_sandbox(
        SANDBOX_C_CONTAINER, ["head", "-80", "/tmp/user_code.s"]
    )
    stages.append(
        {
            "name": "compiler",
            "status": "success",
            "output_preview": asm_preview.strip(),
            "time_ms": round(ms, 2),
        }
    )

    # Stage 3: Assembler (to object file)
    t0 = time.perf_counter()
    exit_code, stdout, stderr = run_in_sandbox(
        SANDBOX_C_CONTAINER,
        ["gcc", "-c", "/tmp/user_code.s", "-o", "/tmp/user_code.o"],
    )
    ms = (time.perf_counter() - t0) * 1000
    total_compile_ms += ms

    if exit_code != 0:
        stages.append(
            {
                "name": "assembler",
                "status": "error",
                "output_preview": stderr,
                "time_ms": round(ms, 2),
            }
        )
        return {
            "stages": stages,
            "output": "",
            "exec_time_ms": 0,
            "compile_time_ms": round(total_compile_ms, 2),
            "binary_size": 0,
            "error": stderr,
        }

    _, obj_size_str, _ = run_in_sandbox(
        SANDBOX_C_CONTAINER, ["stat", "-c", "%s", "/tmp/user_code.o"]
    )
    obj_size = int(obj_size_str.strip()) if obj_size_str.strip().isdigit() else 0
    stages.append(
        {
            "name": "assembler",
            "status": "success",
            "object_size": obj_size,
            "time_ms": round(ms, 2),
        }
    )

    # Stage 4: Linker
    t0 = time.perf_counter()
    exit_code, stdout, stderr = run_in_sandbox(
        SANDBOX_C_CONTAINER,
        ["gcc", "/tmp/user_code.o", "-o", "/tmp/user_program"],
    )
    ms = (time.perf_counter() - t0) * 1000
    total_compile_ms += ms

    if exit_code != 0:
        stages.append(
            {
                "name": "linker",
                "status": "error",
                "output_preview": stderr,
                "time_ms": round(ms, 2),
            }
        )
        return {
            "stages": stages,
            "output": "",
            "exec_time_ms": 0,
            "compile_time_ms": round(total_compile_ms, 2),
            "binary_size": 0,
            "error": stderr,
        }

    _, bin_size_str, _ = run_in_sandbox(
        SANDBOX_C_CONTAINER, ["stat", "-c", "%s", "/tmp/user_program"]
    )
    binary_size = int(bin_size_str.strip()) if bin_size_str.strip().isdigit() else 0
    stages.append(
        {
            "name": "linker",
            "status": "success",
            "binary_size": binary_size,
            "time_ms": round(ms, 2),
        }
    )

    # Stage 5: Execute
    t0 = time.perf_counter()
    exit_code, output, exec_stderr = run_in_sandbox(
        SANDBOX_C_CONTAINER,
        [
            "sh",
            "-lc",
            (
                "if command -v /usr/bin/time >/dev/null 2>&1; then "
                "/usr/bin/time -f '__MM_RSS_KB__:%M' timeout 5 /tmp/user_program; "
                "else "
                "timeout 5 /tmp/user_program >/tmp/mm_out 2>/tmp/mm_err & "
                "pid=$!; peak=0; "
                'while kill -0 "$pid" 2>/dev/null; do '
                "rss=$(awk '/VmRSS/{print $2}' /proc/\"$pid\"/status 2>/dev/null || true); "
                'if [ -n "$rss" ] && [ "$rss" -gt "$peak" ] 2>/dev/null; then peak=$rss; fi; '
                "sleep 0.01; "
                "done; "
                'wait "$pid"; code=$?; '
                "cat /tmp/mm_out; cat /tmp/mm_err 1>&2; "
                "echo __MM_RSS_KB__:$peak 1>&2; "
                "rm -f /tmp/mm_out /tmp/mm_err; "
                "exit $code; fi"
            ),
        ],
    )
    exec_ms = (time.perf_counter() - t0) * 1000
    peak_rss_kb = _extract_peak_rss_kb(exec_stderr)
    exec_stderr = _strip_peak_rss_marker(exec_stderr)

    if exit_code != 0 and not output:
        output = exec_stderr

    return {
        "stages": stages,
        "output": output.strip(),
        "exec_time_ms": round(exec_ms, 2),
        "compile_time_ms": round(total_compile_ms, 2),
        "binary_size": binary_size,
        "peak_rss_kb": peak_rss_kb,
    }
