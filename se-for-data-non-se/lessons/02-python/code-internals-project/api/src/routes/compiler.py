from __future__ import annotations

from fastapi import APIRouter, HTTPException

from src.models.compiler_models import (
    CompileCRequest,
    CompileCResponse,
    CompileStage,
    InterpretPythonRequest,
    InterpretPythonResponse,
    Opcode,
)
from src.services.c_compiler import compile_c
from src.services.python_runner import interpret_python

compile_router = APIRouter()
interpret_router = APIRouter()


@compile_router.post("/c", response_model=CompileCResponse)
async def compile_c_endpoint(req: CompileCRequest):
    """Compile and execute C code through the full GCC pipeline."""
    try:
        result = compile_c(req.code, req.optimization)
    except RuntimeError as e:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Compiler sandbox unavailable: {e}. "
                "Ensure the backend sandbox is running and retry."
            ),
        )

    if "error" in result and not result.get("stages"):
        raise HTTPException(status_code=400, detail=result["error"])

    stages = [CompileStage(**s) for s in result.get("stages", [])]

    return CompileCResponse(
        stages=stages,
        output=result.get("output", ""),
        exec_time_ms=result.get("exec_time_ms", 0),
        compile_time_ms=result.get("compile_time_ms", 0),
        binary_size=result.get("binary_size", 0),
        peak_rss_kb=result.get("peak_rss_kb"),
    )


@interpret_router.post("/python", response_model=InterpretPythonResponse)
async def interpret_python_endpoint(req: InterpretPythonRequest):
    """Interpret Python code and return bytecode analysis."""
    try:
        result = interpret_python(req.code)
    except RuntimeError as e:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Python sandbox unavailable: {e}. "
                "Ensure the backend sandbox is running and retry."
            ),
        )

    if "error" in result and result["error"]:
        raise HTTPException(status_code=400, detail=result["error"])

    opcodes = [Opcode(**o) for o in result.get("opcodes", [])]

    return InterpretPythonResponse(
        bytecode_raw=result.get("bytecode_raw", ""),
        opcodes=opcodes,
        output=result.get("output", ""),
        exec_time_ms=result.get("exec_time_ms", 0),
        pyc_size=result.get("pyc_size", 0),
        peak_rss_kb=result.get("peak_rss_kb"),
        error=result.get("error"),
    )
