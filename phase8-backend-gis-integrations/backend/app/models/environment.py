"""Environmental observations stored against a monitored location."""
import uuid
from datetime import datetime

from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.dialects.postgresql import UUID

from app.database.session import Base


class EnvironmentalObservation(Base):
    __tablename__ = "environmental_observations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    observed_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    rainfall_mm = Column(Float, nullable=True)
    temperature_c = Column(Float, nullable=True)
    humidity_pct = Column(Float, nullable=True)
    wind_speed_kmh = Column(Float, nullable=True)
    wind_direction_deg = Column(Float, nullable=True)
    pressure_hpa = Column(Float, nullable=True)
    weather_code = Column(Integer, nullable=True)
    source = Column(String, nullable=False, default="manual")
