import subprocess
import tempfile
import os
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

app = FastAPI(title="Python Code Executor")


class CodeRequest(BaseModel):
    code: str


class ExecutionResult(BaseModel):
    output: str
    error: str | None
    success: bool


TIMEOUT_SECONDS = 5


@app.post("/execute", response_model=ExecutionResult)
async def execute_code(request: CodeRequest):
    if not request.code or not request.code.strip():
        raise HTTPException(status_code=400, detail="Code cannot be empty")

    with tempfile.NamedTemporaryFile(
        mode="w", suffix=".py", delete=False, dir="/tmp/sandbox"
    ) as f:
        f.write(request.code)
        temp_path = f.name

    try:
        os.chmod(temp_path, 0o444)

        result = subprocess.run(
            ["python3", temp_path],
            capture_output=True,
            text=True,
            timeout=TIMEOUT_SECONDS,
            cwd="/tmp/sandbox",
            env={
                "HOME": "/tmp/sandbox",
                "TMPDIR": "/tmp/sandbox",
                "PATH": "/usr/local/bin:/usr/bin:/bin",
                "PYTHONPATH": "",
            },
        )

        return ExecutionResult(
            output=result.stdout,
            error=result.stderr if result.returncode != 0 else None,
            success=result.returncode == 0,
        )

    except subprocess.TimeoutExpired:
        return ExecutionResult(
            output="",
            error=f"Execution timed out after {TIMEOUT_SECONDS} seconds",
            success=False,
        )
    except Exception as e:
        return ExecutionResult(output="", error=str(e), success=False)
    finally:
        try:
            os.unlink(temp_path)
        except OSError:
            pass


@app.get("/health")
async def health():
    return {"status": "ok"}
