from sqlalchemy import Boolean, Column, Float, Integer, String

from app.database.session import Base


class Road(Base):
    __tablename__ = "roads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    state = Column(String, nullable=False)
    district = Column(String, nullable=True)
    start_lat = Column(Float, nullable=False)
    start_lon = Column(Float, nullable=False)
    end_lat = Column(Float, nullable=False)
    end_lon = Column(Float, nullable=False)
    road_type = Column(String, nullable=True)
    condition = Column(String, nullable=False, default="GOOD")
    is_blocked = Column(Boolean, nullable=False, default=False)
