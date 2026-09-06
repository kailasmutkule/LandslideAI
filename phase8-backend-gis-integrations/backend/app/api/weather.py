"""Weather and rainfall endpoints backed by Open-Meteo."""
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.location import Location
from app.services.weather import WeatherServiceError, get_current_weather, get_forecast

router = APIRouter(prefix="/api/weather", tags=["weather"])


def _coordinates(location_id: uuid.UUID | None, latitude: float | None, longitude: float | None, db: Session):
    if location_id:
        location = db.query(Location).filter(Location.id == location_id).first()
        if not location:
            raise HTTPException(status_code=404, detail="Location not found")
        return location.lat, location.lon, location

    if latitude is None or longitude is None:
        raise HTTPException(
            status_code=400,
            detail="Provide location_id or both latitude and longitude",
        )
    return latitude, longitude, None


@router.get("/current")
def current_weather(
    location_id: uuid.UUID | None = Query(default=None),
    latitude: float | None = Query(default=None, ge=-90, le=90),
    longitude: float | None = Query(default=None, ge=-180, le=180),
    db: Session = Depends(get_db),
):
    lat, lon, location = _coordinates(location_id, latitude, longitude, db)
    try:
        data = get_current_weather(lat, lon)
    except WeatherServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "location_id": str(location.id) if location else None,
        "latitude": data.get("latitude", lat),
        "longitude": data.get("longitude", lon),
        "timezone": data.get("timezone"),
        "current": data.get("current", {}),
        "current_units": data.get("current_units", {}),
        "source": "Open-Meteo",
    }


@router.get("/forecast")
def forecast_weather(
    location_id: uuid.UUID | None = Query(default=None),
    latitude: float | None = Query(default=None, ge=-90, le=90),
    longitude: float | None = Query(default=None, ge=-180, le=180),
    forecast_days: int = Query(default=3, ge=1, le=7),
    db: Session = Depends(get_db),
):
    lat, lon, location = _coordinates(location_id, latitude, longitude, db)
    try:
        data = get_forecast(lat, lon, forecast_days)
    except WeatherServiceError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return {
        "location_id": str(location.id) if location else None,
        "latitude": data.get("latitude", lat),
        "longitude": data.get("longitude", lon),
        "timezone": data.get("timezone"),
        "hourly": data.get("hourly", {}),
        "hourly_units": data.get("hourly_units", {}),
        "source": "Open-Meteo",
    }
