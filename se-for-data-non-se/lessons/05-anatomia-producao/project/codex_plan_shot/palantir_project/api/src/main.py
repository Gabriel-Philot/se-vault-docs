from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routes import architecture, gate, library, missions, telemetry


@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.started_at = datetime.now(timezone.utc).isoformat()
    yield


app = FastAPI(title="Palantir API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(missions.router)
app.include_router(library.router)
app.include_router(gate.router)
app.include_router(architecture.router)
app.include_router(telemetry.router)


@app.get("/")
async def root() -> dict:
    return {
        "data": {"message": "Palantir API scaffold online", "started_at": app.state.started_at},
        "meta": {"timestamp": datetime.now(timezone.utc).isoformat(), "source": "root"},
    }
