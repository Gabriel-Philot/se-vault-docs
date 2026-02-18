from contextlib import asynccontextmanager
from typing import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import init_db
from .services.cache import cache
from .routes import pets, actions, stats, sql


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    await init_db()
    await cache.connect()
    yield
    await cache.disconnect()


app = FastAPI(
    title="Pet Shop API",
    description="Educational REST API for learning CRUD, caching, and best practices",
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

app.include_router(pets.router, prefix="/pets", tags=["pets"])
app.include_router(actions.router, prefix="/pets", tags=["actions"])
app.include_router(stats.router, tags=["stats"])
app.include_router(sql.router, prefix="/sql", tags=["sql"])


@app.get("/health")
async def health():
    return {"status": "ok"}
