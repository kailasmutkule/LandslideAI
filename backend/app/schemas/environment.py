import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class EnvironmentalObservationCreate(BaseModel):
    location_id: uuid.UUID
    observed_at: datetime | None = None
    rainfall_mm: float | None = Field(default=None, ge=0)
    temperature_c: float | None = None
    humidity_pct: float | None = Field(default=None, ge=0, le=100)
    wind_speed_kmh: float | None = Field(default=None, ge=0)
    wind_direction_deg: float | None = Field(default=None, ge=0, le=360)
    pressure_hpa: float | None = Field(default=None, ge=0)
    weather_code: int | None = None
    source: str = Field(default="manual", min_length=1, max_length=100)


class EnvironmentalObservationOut(EnvironmentalObservationCreate):
    id: uuid.UUID
    observed_at: datetime

    model_config = {"from_attributes": True}
