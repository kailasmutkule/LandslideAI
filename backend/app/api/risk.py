import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database.session import get_db
from app.models.location import Location
from app.models.risk_prediction import RiskPrediction
from app.models.alert import Alert
from app.schemas.risk import (
    RiskPredictionRequest,
    RiskPredictionOut,
    RiskPredictionResponse,
)
from app.services.risk import predict


router = APIRouter(
    prefix="/api/risk",
    tags=["risk prediction"],
)


@router.post("/predict", response_model=RiskPredictionResponse)
def predict_risk(
    payload: RiskPredictionRequest,
    db: Session = Depends(get_db),
):
    location = (
        db.query(Location)
        .filter(Location.id == payload.location_id)
        .first()
    )

    if not location:
        raise HTTPException(
            status_code=404,
            detail="Location not found",
        )

    score, level = predict(payload)

    reasons = []

    if payload.rainfall_1d >= 100:
        reasons.append("Very high 24-hour rainfall")
    elif payload.rainfall_1d >= 50:
        reasons.append("High 24-hour rainfall")

    if payload.rainfall_3d >= 150:
        reasons.append("High accumulated 3-day rainfall")

    if payload.rainfall_7d >= 250:
        reasons.append("High accumulated 7-day rainfall")

    if payload.slope_degrees >= 30:
        reasons.append("Steep terrain")

    if not reasons:
        reasons.append(
            "Environmental and terrain indicators are currently relatively low"
        )

    row = RiskPrediction(
        location_id=payload.location_id,
        predicted_at=datetime.now(timezone.utc),
        rainfall_24h_mm=payload.rainfall_1d,
        temperature_c=0,
        humidity_pct=0,
        wind_speed_kmh=0,
        pressure_hpa=0,
        risk_score=score,
        risk_level=level,
        model_version="xgboost-temporal",
    )

    db.add(row)
    db.flush()

    alert_id = None

    if level in {"HIGH", "CRITICAL"}:
        severity = level

        title = f"{level} Landslide Risk Warning"

        message = (
            f"{location.name} has a "
            f"{level.lower()} landslide risk score "
            f"of {score:.2f}. "
            + "; ".join(reasons)
            + ". Immediate monitoring is recommended."
        )

        alert_row = Alert(
            location_id=payload.location_id,
            alert_type="RISK",
            severity=severity,
            title=title,
            message=message,
            status="ACTIVE",
        )

        db.add(alert_row)
        db.flush()

        alert_id = alert_row.id

    db.commit()

    return {
        "location_id": payload.location_id,
        "risk_score": score,
        "risk_level": level,
        "model_version": "xgboost-temporal",
        "explanation": reasons,
        "alert_id": alert_id,
    }


@router.get(
    "/predictions",
    response_model=list[RiskPredictionOut],
)
def list_predictions(
    location_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    q = db.query(RiskPrediction)

    if location_id:
        q = q.filter(
            RiskPrediction.location_id == location_id
        )

    return (
        q.order_by(
            RiskPrediction.predicted_at.desc()
        )
        .limit(limit)
        .all()
    )


@router.get(
    "/predictions/{prediction_id}",
    response_model=RiskPredictionOut,
)
def get_prediction(
    prediction_id: uuid.UUID,
    db: Session = Depends(get_db),
):
    row = (
        db.query(RiskPrediction)
        .filter(
            RiskPrediction.id == prediction_id
        )
        .first()
    )

    if not row:
        raise HTTPException(
            status_code=404,
            detail="Risk prediction not found",
        )

    return row