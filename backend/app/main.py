"""Provisional FastAPI application shell.

`feature/01-foundation-input` owns the real application entry point, settings,
and router composition. This module exists so the Scenario Simulator slice can
be run end to end; it should be replaced by the Workstream 1 version rather
than extended here.
"""

import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.features.resilience_jar.routes import create_demo_router
from app.features.scenario_simulator.router import router as scenario_simulator_router

app = FastAPI(title="Resilience API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")],
    allow_credentials=False,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type"],
)


@app.get("/health", tags=["health"])
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(scenario_simulator_router)
app.include_router(create_demo_router())
