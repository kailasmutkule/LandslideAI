"""
Location is the spatial anchor table. Every future table (rainfall,
soil moisture, risk predictions, alerts, reports, etc.) will reference
a location_id, so this table is created first.
"""
import uuid

from sqlalchemy import Column, String, Float
from sqlalchemy.dialects.postgresql import UUID
from geoalchemy2 import Geometry

from app.database.session import Base


class Location(Base):
    __tablename__ = "locations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    state = Column(String, nullable=False)
    district = Column(String, nullable=False)
    lat = Column(Float, nullable=False)
    lon = Column(Float, nullable=False)
    # PostGIS point geometry, SRID 4326 = standard lat/lon (WGS84)
    geom = Column(Geometry(geometry_type="POINT", srid=4326), nullable=True)
