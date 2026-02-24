from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query

from src.models.memory_models import (
    MemoryTraceRequest,
    MemoryTraceResponse,
    StepResponse,
)
from src.services.memory_tracer import create_c_trace, create_python_trace, get_step

router = APIRouter()


@router.post("/trace-c", response_model=MemoryTraceResponse)
async def trace_c(req: MemoryTraceRequest):
    """Start a C memory trace session."""
    try:
        session_id, total_steps = create_c_trace(req.code)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Memory tracing sandbox unavailable: {e}. "
                "Ensure the backend sandbox is running and retry."
            ),
        )

    return MemoryTraceResponse(session_id=session_id, total_steps=total_steps)


@router.post("/trace-py", response_model=MemoryTraceResponse)
async def trace_python(req: MemoryTraceRequest):
    """Start a Python memory trace session."""
    try:
        session_id, total_steps = create_python_trace(req.code)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except RuntimeError as e:
        raise HTTPException(
            status_code=503,
            detail=(
                f"Memory tracing sandbox unavailable: {e}. "
                "Ensure the backend sandbox is running and retry."
            ),
        )

    return MemoryTraceResponse(session_id=session_id, total_steps=total_steps)


@router.get("/step/{session_id}", response_model=StepResponse)
async def step(session_id: str, step: int = Query(default=0, ge=0)):
    """Get a specific step from a trace session."""
    try:
        return get_step(session_id, step)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
