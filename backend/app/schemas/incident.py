from pydantic import BaseModel, Field


class IncidentCreate(BaseModel):
    incident_type: str = Field(min_length=1)
    description: str | None = None
    state: str = Field(min_length=1)
    district: str | None = None
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)
    severity: str = "MEDIUM"
    status: str = "ACTIVE"
    is_verified: bool = False


class IncidentOut(IncidentCreate):
    id: int

    model_config = {"from_attributes": True}
