import uuid
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.alert import Alert
from app.models.location import Location
from app.schemas.alert import AlertCreate, AlertOut, AlertStatusUpdate

router = APIRouter(prefix="/api/alerts", tags=["alerts & early warning"])


@router.post("", response_model=AlertOut, status_code=201)
def create_alert(payload: AlertCreate, db: Session = Depends(get_db)):
    if not db.query(Location).filter(Location.id == payload.location_id).first():
        raise HTTPException(status_code=404, detail="Location not found")
    row = Alert(**payload.model_dump())
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.get("", response_model=list[AlertOut])
def list_alerts(
    location_id: uuid.UUID | None = Query(default=None),
    severity: str | None = Query(default=None),
    status: str | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(Alert)
    if location_id:
        q = q.filter(Alert.location_id == location_id)
    if severity:
        q = q.filter(Alert.severity == severity.upper())
    if status:
        q = q.filter(Alert.status == status.upper())
    return q.order_by(Alert.created_at.desc()).limit(limit).all()


@router.get("/{alert_id}", response_model=AlertOut)
def get_alert(alert_id: uuid.UUID, db: Session = Depends(get_db)):
    row = db.query(Alert).filter(Alert.id == alert_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")
    return row


@router.put("/{alert_id}/status", response_model=AlertOut)
def update_alert_status(alert_id: uuid.UUID, payload: AlertStatusUpdate, db: Session = Depends(get_db)):
    row = db.query(Alert).filter(Alert.id == alert_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")
    row.status = payload.status.upper()
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{alert_id}")
def delete_alert(alert_id: uuid.UUID, db: Session = Depends(get_db)):
    row = db.query(Alert).filter(Alert.id == alert_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Alert not found")
    db.delete(row)
    db.commit()
    return {"message": "Alert deleted successfully"}
