from __future__ import annotations

import json

from src.config import SANDBOX_PY_CONTAINER
from src.services.sandbox import run_in_sandbox, validate_python_code


def interpret_python(code: str) -> dict:
    """Run Python code in sandbox and return bytecode + output."""
    error = validate_python_code(code)
    if error:
        return {"error": error}

    exit_code, stdout, stderr = run_in_sandbox(
        SANDBOX_PY_CONTAINER,
        ["python3", "/sandbox/scripts/get_bytecode.py"],
        stdin_data=code,
    )

    if exit_code != 0:
        return {"error": stderr or stdout or "Execution failed"}

    try:
        return json.loads(stdout)
    except json.JSONDecodeError:
        return {"error": f"Invalid output from sandbox: {stdout[:200]}"}


def run_python(code: str) -> dict:
    """Simply execute Python code and return output."""
    error = validate_python_code(code)
    if error:
        return {"error": error}

    exit_code, stdout, stderr = run_in_sandbox(
        SANDBOX_PY_CONTAINER,
        ["python3", "/sandbox/scripts/run_code.py"],
        stdin_data=code,
    )

    if exit_code != 0:
        return {"error": stderr or stdout or "Execution failed"}

    try:
        return json.loads(stdout)
    except json.JSONDecodeError:
        return {"error": f"Invalid output from sandbox: {stdout[:200]}"}
