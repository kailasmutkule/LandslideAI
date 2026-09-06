"""ML risk predictions persisted for monitored locations."""
import uuid
from datetime import datetime
from sqlalchemy import Column, DateTime, Float, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from app.database.session import Base

class RiskPrediction(Base):
    __tablename__ = "risk_predictions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location_id = Column(UUID(as_uuid=True), ForeignKey("locations.id", ondelete="CASCADE"), nullable=False, index=True)
    predicted_at = Column(DateTime(timezone=True), nullable=False, default=datetime.utcnow, index=True)
    rainfall_24h_mm = Column(Float, nullable=False)
    temperature_c = Column(Float, nullable=False)
    humidity_pct = Column(Float, nullable=False)
    wind_speed_kmh = Column(Float, nullable=False)
    pressure_hpa = Column(Float, nullable=False)
    risk_score = Column(Float, nullable=False)
    risk_level = Column(String, nullable=False, index=True)
    model_version = Column(String, nullable=False, default="rf-demo-v1")
