from pydantic import BaseModel, Field


class RoadCreate(BaseModel):
    name: str = Field(min_length=1)
    state: str = Field(min_length=1)
    district: str | None = None
    start_lat: float = Field(ge=-90, le=90)
    start_lon: float = Field(ge=-180, le=180)
    end_lat: float = Field(ge=-90, le=90)
    end_lon: float = Field(ge=-180, le=180)
    road_type: str | None = None
    condition: str = "GOOD"
    is_blocked: bool = False


class RoadOut(RoadCreate):
    id: int

    model_config = {"from_attributes": True}
