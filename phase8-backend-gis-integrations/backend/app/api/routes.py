from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.incident import Incident
from app.models.risk_prediction import RiskPrediction
from app.models.location import Location
from app.models.road import Road
from app.schemas.route import RoadAccessibilityOut, RoutePlanOut, RoutePlanRequest
from app.services.routing import assess_road, shortest_safe_route, haversine_km
from app.services.integrations import mapbox_directions

router = APIRouter(prefix="/api/routes", tags=["smart routing & logistics"])


def _road_assessment(road: Road, db: Session):
    incidents = db.query(Incident).all()
    rows = (
        db.query(RiskPrediction, Location.lat, Location.lon)
        .join(Location, RiskPrediction.location_id == Location.id)
        .order_by(RiskPrediction.predicted_at.desc())
        .all()
    )
    return assess_road(road, incidents, rows)


@router.get("/road/{road_id}/accessibility", response_model=RoadAccessibilityOut)
def road_accessibility(road_id: int, db: Session = Depends(get_db)):
    road = db.query(Road).filter(Road.id == road_id).first()
    if not road:
        raise HTTPException(status_code=404, detail="Road not found")

    assessment = _road_assessment(road, db)
    return {
        "road_id": road.id,
        "road_name": road.name,
        "accessibility": assessment["accessibility"],
        "accessibility_score": assessment["accessibility_score"],
        "risk_level": assessment["risk_level"],
        "is_blocked": road.is_blocked,
        "reasons": assessment["reasons"],
    }


@router.get("/accessibility", response_model=list[RoadAccessibilityOut])
def all_road_accessibility(db: Session = Depends(get_db)):
    roads = db.query(Road).order_by(Road.id).all()
    return [
        {
            "road_id": road.id,
            "road_name": road.name,
            "accessibility": (assessment := _road_assessment(road, db))["accessibility"],
            "accessibility_score": assessment["accessibility_score"],
            "risk_level": assessment["risk_level"],
            "is_blocked": road.is_blocked,
            "reasons": assessment["reasons"],
        }
        for road in roads
    ]


@router.post("/plan", response_model=RoutePlanOut)
async def plan_route(payload: RoutePlanRequest, db: Session = Depends(get_db)):
    roads = db.query(Road).all()
    result = shortest_safe_route(
        roads,
        payload.start_lat,
        payload.start_lon,
        payload.destination_lat,
        payload.destination_lon,
    )
    if result is None:
        raise HTTPException(
            status_code=404,
            detail="No accessible route found between the requested points",
        )

    road_map = {road.id: road for road in roads}
    selected = [road_map[rid] for rid in result["road_ids"] if rid in road_map]

    warnings: list[str] = []
    scores = []
    risk_levels = []
    for road in selected:
        assessment = _road_assessment(road, db)
        scores.append(assessment["accessibility_score"])
        risk_levels.append(assessment["risk_level"])
        if assessment["accessibility"] != "OPEN":
            warnings.append(f"{road.name}: " + "; ".join(assessment["reasons"]))

    route_score = round(sum(scores) / len(scores), 2) if scores else 100.0
    if route_score < 40:
        route_risk = "CRITICAL"
    elif route_score < 70:
        route_risk = "HIGH"
    elif route_score < 85:
        route_risk = "MEDIUM"
    else:
        route_risk = "LOW"

    if payload.emergency:
        recommendation = (
            "Emergency logistics route selected using currently accessible roads. "
            "Confirm field conditions before dispatch."
        )
    else:
        recommendation = (
            "Recommended route balances distance and road condition. "
            "Monitor active incidents before travel."
        )

    mapbox_distance_km = None
    mapbox_duration_minutes = None
    mapbox_geometry = None

    try:
        mapbox_data = await mapbox_directions(
            payload.start_lat,
            payload.start_lon,
            payload.destination_lat,
            payload.destination_lon,
        )
        if mapbox_data.get("routes"):
            mapbox_route = mapbox_data["routes"][0]
            mapbox_distance_km = round(mapbox_route.get("distance", 0) / 1000, 3)
            mapbox_duration_minutes = round(mapbox_route.get("duration", 0) / 60, 2)
            mapbox_geometry = mapbox_route.get("geometry")
    except Exception as exc:
        warnings.append(f"Mapbox routing unavailable: {exc}")

    return {
        "status": "ROUTE_FOUND",
        "emergency": payload.emergency,
        "start_lat": payload.start_lat,
        "start_lon": payload.start_lon,
        "destination_lat": payload.destination_lat,
        "destination_lon": payload.destination_lon,
        "total_distance_km": result["total_distance_km"],
        "road_count": len(selected),
        "road_ids": result["road_ids"],
        "roads": [road.name for road in selected],
        "route_score": route_score,
        "route_risk_level": route_risk,
        "recommendation": recommendation,
        "warnings": warnings,
        "mapbox_distance_km": mapbox_distance_km,
        "mapbox_duration_minutes": mapbox_duration_minutes,
        "mapbox_geometry": mapbox_geometry,
    }
