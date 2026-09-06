import uuid

from pydantic import BaseModel, Field


class LocationCreate(BaseModel):
    name: str = Field(min_length=1)
    state: str = Field(min_length=1)
    district: str = Field(min_length=1)
    lat: float = Field(ge=-90, le=90)
    lon: float = Field(ge=-180, le=180)


class LocationOut(LocationCreate):
    id: uuid.UUID

    model_config = {"from_attributes": True}
