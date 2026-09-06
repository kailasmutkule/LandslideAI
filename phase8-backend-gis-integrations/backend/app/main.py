"""FastAPI entry point for the SIH26001 backend."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import alerts, auth, dashboard, environment, incidents, integrations, locations, roads, risk, routes, weather
from app.database.session import Base, engine

# Import every model before create_all() so SQLAlchemy creates all tables.
from app.models import alert, environment as environment_model, incident, location, road, risk_prediction, user  # noqa: F401,E402

app = FastAPI(
    title="AI-Based Smart Logistics and Accessibility Intelligence Platform for NER",
    description="SIH26001 backend API - Phase 8: external data integrations, GIS map, validation and deployment preparation",
    version="0.8.0-phase8",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(locations.router)
app.include_router(roads.router)
app.include_router(incidents.router)
app.include_router(weather.router)
app.include_router(environment.router)
app.include_router(risk.router)
app.include_router(alerts.router)
app.include_router(routes.router)
app.include_router(integrations.router)


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)


@app.get("/")
def root():
    return {
        "message": "SIH26001 Landslide Early Warning System API",
        "status": "running",
        "phase": 8,
        "docs": "/docs",
    }


@app.get("/health")
def health_check():
    return {"status": "healthy"}
