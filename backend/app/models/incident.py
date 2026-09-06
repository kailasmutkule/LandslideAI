from sqlalchemy import Boolean, Column, Float, Integer, String, Text

from app.database.session import Base


class Incident(Base):
    __tablename__ = "incidents"

    id = Column(Integer, primary_key=True, index=True)
    incident_type = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    state = Column(String, nullable=False)
    district = Column(String, nullable=True)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    severity = Column(String, nullable=False, default="MEDIUM")
    status = Column(String, nullable=False, default="ACTIVE")
    is_verified = Column(Boolean, nullable=False, default=False)
