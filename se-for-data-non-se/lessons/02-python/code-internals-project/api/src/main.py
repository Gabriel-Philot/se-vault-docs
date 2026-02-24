from __future__ import annotations

from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routes.bytes import router as bytes_router
from src.routes.shell import router as shell_router
from src.routes.compiler import compile_router, interpret_router
from src.routes.memory import router as memory_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    yield


app = FastAPI(title="Code Internals Explorer API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(bytes_router, prefix="/api/bytes", tags=["bytes"])
app.include_router(shell_router, prefix="/api/shell", tags=["shell"])
app.include_router(compile_router, prefix="/api/compile", tags=["compiler"])
app.include_router(interpret_router, prefix="/api/interpret", tags=["interpreter"])
app.include_router(memory_router, prefix="/api/memory", tags=["memory"])


@app.get("/api/health")
async def health():
    return {"status": "ok"}
