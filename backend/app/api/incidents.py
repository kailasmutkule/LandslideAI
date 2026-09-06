from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.incident import Incident
from app.schemas.incident import IncidentCreate, IncidentOut

router = APIRouter(prefix="/api/incidents", tags=["incidents"])


@router.post("", response_model=IncidentOut, status_code=201)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    incident = Incident(**payload.model_dump())
    db.add(incident)
    db.commit()
    db.refresh(incident)
    return incident


@router.get("", response_model=list[IncidentOut])
def list_incidents(db: Session = Depends(get_db)):
    return db.query(Incident).order_by(Incident.id.desc()).all()


@router.get("/{incident_id}", response_model=IncidentOut)
def get_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident


@router.put("/{incident_id}", response_model=IncidentOut)
def update_incident(incident_id: int, payload: IncidentCreate, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    for key, value in payload.model_dump().items():
        setattr(incident, key, value)
    db.commit()
    db.refresh(incident)
    return incident


@router.delete("/{incident_id}")
def delete_incident(incident_id: int, db: Session = Depends(get_db)):
    incident = db.query(Incident).filter(Incident.id == incident_id).first()
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    db.delete(incident)
    db.commit()
    return {"message": "Incident deleted", "id": incident_id}
