"""Code executor — runs user-assembled Python code via exec().

Localhost POC only. No sandboxing needed.
"""
from app.models.common import ExecutionResult
import io
import contextlib


def execute_code(code: str) -> ExecutionResult:
    """Execute Python code string and capture stdout."""
    stdout_capture = io.StringIO()
    try:
        with contextlib.redirect_stdout(stdout_capture):
            exec(code, {"__builtins__": __builtins__}, {})
        return ExecutionResult(
            stdout=stdout_capture.getvalue(),
            python_code=code,
            success=True,
            error=None,
        )
    except Exception as e:
        return ExecutionResult(
            stdout=stdout_capture.getvalue(),
            python_code=code,
            success=False,
            error=f"{type(e).__name__}: {e}",
        )
