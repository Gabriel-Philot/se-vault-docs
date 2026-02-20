from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .routes import actions, dishes, sql, stats
from .services.cache import cache


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    await init_db()
    await cache.connect()
    yield
    await cache.disconnect()


app = FastAPI(
    title="Cozinhas Chat API",
    description="Educational REST API for dishes, caching, and SQL exploration",
    version="0.1.0",
    lifespan=lifespan,
    redirect_slashes=False,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(dishes.router, prefix="/dishes", tags=["dishes"])
app.include_router(actions.router, prefix="/dishes", tags=["actions"])
app.include_router(stats.router, tags=["stats"])
app.include_router(sql.router, prefix="/sql", tags=["sql"])


@app.get("/health")
async def health():
    return {"status": "ok"}
