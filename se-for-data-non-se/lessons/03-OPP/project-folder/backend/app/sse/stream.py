"""SSE streaming helpers using sse-starlette."""
import json
from collections.abc import AsyncGenerator
from sse_starlette.sse import EventSourceResponse


def sse_response(generator: AsyncGenerator) -> EventSourceResponse:
    """Wrap an async generator into an SSE response."""
    return EventSourceResponse(generator)


def sse_event(event_type: str, data: dict) -> dict:
    """Format an SSE event dict."""
    return {"event": event_type, "data": json.dumps(data)}
