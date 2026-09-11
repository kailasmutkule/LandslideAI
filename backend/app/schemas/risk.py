from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class RiskPredictionRequest(BaseModel):
    location_id: UUID

    latitude: float
    longitude: float

    rainfall_1d: float = Field(default=0.0, ge=0)
    rainfall_3d: float = Field(default=0.0, ge=0)
    rainfall_7d: float = Field(default=0.0, ge=0)
    rainfall_30d: float = Field(default=0.0, ge=0)

    rainfall_1d_available: int = Field(default=0, ge=0, le=1)
    rainfall_3d_available: int = Field(default=0, ge=0, le=1)
    rainfall_7d_available: int = Field(default=0, ge=0, le=1)
    rainfall_30d_available: int = Field(default=0, ge=0, le=1)

    elevation_m: float = 0.0
    slope_degrees: float = 0.0

    event_date: str


class RiskPredictionOut(BaseModel):
    id: UUID
    location_id: UUID
    predicted_at: datetime
    rainfall_24h_mm: float
    temperature_c: float
    humidity_pct: float
    wind_speed_kmh: float
    pressure_hpa: float
    risk_score: float
    risk_level: str
    model_version: str

    model_config = {"from_attributes": True}


class RiskPredictionResponse(BaseModel):
    location_id: UUID
    risk_score: float
    risk_level: str
    model_version: str
    explanation: list[str]
    alert_id: UUID | None = None