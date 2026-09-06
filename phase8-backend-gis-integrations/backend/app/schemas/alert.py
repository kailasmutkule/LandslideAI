from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, Field


class AlertCreate(BaseModel):
    location_id: UUID
    alert_type: str = Field(default="RISK", min_length=1, max_length=50)
    severity: str = Field(min_length=1, max_length=30)
    title: str = Field(min_length=1, max_length=200)
    message: str = Field(min_length=1)


class AlertStatusUpdate(BaseModel):
    status: str = Field(min_length=1, max_length=30)


class AlertOut(BaseModel):
    id: UUID
    location_id: UUID
    alert_type: str
    severity: str
    title: str
    message: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
