from __future__ import annotations

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from src.models.shell_models import (
    FilesystemResponse,
    ShellEvent,
    ShellExecRequest,
    SwitchUserRequest,
    SwitchUserResponse,
)
from src.services.shell_executor import execute_shell, get_filesystem, switch_user

router = APIRouter()


@router.post("/exec")
async def exec_command(req: ShellExecRequest):
    """Execute a shell command and stream output via SSE."""

    async def stream_with_error_boundary():
        try:
            async for chunk in execute_shell(req.command, req.user):
                yield chunk
        except RuntimeError as e:
            event = ShellEvent(
                stream="stderr",
                data=(
                    f"Shell backend is unavailable: {e}. "
                    "Ensure API and sandbox containers are running, then retry."
                ),
                step=0,
            )
            yield f"data: {event.model_dump_json()}\n\n"
        except Exception:
            event = ShellEvent(
                stream="stderr",
                data="Shell execution failed unexpectedly. Check API logs and retry.",
                step=0,
            )
            yield f"data: {event.model_dump_json()}\n\n"

    return StreamingResponse(
        stream_with_error_boundary(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )


@router.get("/filesystem", response_model=FilesystemResponse)
async def filesystem():
    """Return the virtual filesystem tree."""
    return get_filesystem()


@router.post("/switch-user", response_model=SwitchUserResponse)
async def switch_user_endpoint(req: SwitchUserRequest):
    """Switch the active user context."""
    try:
        return switch_user(req.user)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
