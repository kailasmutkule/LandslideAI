"""CRUD endpoints for persisted environmental observations."""
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.environment import EnvironmentalObservation
from app.models.location import Location
from app.schemas.environment import EnvironmentalObservationCreate, EnvironmentalObservationOut

router = APIRouter(prefix="/api/environment", tags=["environment"])


@router.post("/observations", response_model=EnvironmentalObservationOut, status_code=201)
def create_observation(payload: EnvironmentalObservationCreate, db: Session = Depends(get_db)):
    location = db.query(Location).filter(Location.id == payload.location_id).first()
    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    data = payload.model_dump()
    if data["observed_at"] is None:
        data["observed_at"] = datetime.now(timezone.utc)

    observation = EnvironmentalObservation(**data)
    db.add(observation)
    db.commit()
    db.refresh(observation)
    return observation


@router.get("/observations", response_model=list[EnvironmentalObservationOut])
def list_observations(
    location_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    query = db.query(EnvironmentalObservation)
    if location_id:
        query = query.filter(EnvironmentalObservation.location_id == location_id)
    return query.order_by(EnvironmentalObservation.observed_at.desc()).limit(limit).all()


@router.get("/observations/{observation_id}", response_model=EnvironmentalObservationOut)
def get_observation(observation_id: uuid.UUID, db: Session = Depends(get_db)):
    observation = db.query(EnvironmentalObservation).filter(EnvironmentalObservation.id == observation_id).first()
    if not observation:
        raise HTTPException(status_code=404, detail="Environmental observation not found")
    return observation
