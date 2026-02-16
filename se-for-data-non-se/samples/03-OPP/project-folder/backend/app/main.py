from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    page1_classes,
    page2_inheritance,
    page3_encapsulation,
    page4_polymorphism,
    page5_factory,
)

app = FastAPI(
    title="OOP Playground",
    description="Interactive OOP teaching backend",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(page1_classes.router, prefix="/api/class", tags=["Page 1 — Classes"])
app.include_router(page2_inheritance.router, prefix="/api/inheritance", tags=["Page 2 — Inheritance"])
app.include_router(page3_encapsulation.router, prefix="/api/encapsulation", tags=["Page 3 — Encapsulation"])
app.include_router(page4_polymorphism.router, prefix="/api/polymorphism", tags=["Page 4 — Polymorphism"])
app.include_router(page5_factory.router, prefix="/api/pipeline", tags=["Page 5 — Factory"])


@app.get("/api/health")
def health():
    return {"status": "ok"}
