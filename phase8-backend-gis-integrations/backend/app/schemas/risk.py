from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field

class RiskPredictionRequest(BaseModel):
    location_id: UUID
    rainfall_24h_mm: float = Field(ge=0, le=2000)
    temperature_c: float = Field(ge=-50, le=70)
    humidity_pct: float = Field(ge=0, le=100)
    wind_speed_kmh: float = Field(ge=0, le=300)
    pressure_hpa: float = Field(ge=800, le=1100)

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
