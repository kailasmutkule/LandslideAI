"""Dashboard summary endpoint."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.environment import EnvironmentalObservation
from app.models.incident import Incident
from app.models.location import Location
from app.models.road import Road
from app.models.user import User

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    return {
        "system_status": "ONLINE",
        "total_monitored_locations": db.query(Location).count(),
        "total_users": db.query(User).count(),
        "total_roads": db.query(Road).count(),
        "blocked_roads": db.query(Road).filter(Road.is_blocked.is_(True)).count(),
        "total_incidents": db.query(Incident).count(),
        "active_incidents": db.query(Incident).filter(Incident.status == "ACTIVE").count(),
        "environmental_observations": db.query(EnvironmentalObservation).count(),
        "critical_zones": None,
        "high_risk_zones": None,
        "active_alerts": None,
        "sensors_online": None,
    }
