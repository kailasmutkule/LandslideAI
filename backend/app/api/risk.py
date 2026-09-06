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

    # Run AI model
    score, level = predict(payload)

    # Generate explanations
    reasons = []

    if payload.rainfall_24h_mm >= 100:
        reasons.append("High 24-hour rainfall")
    elif payload.rainfall_24h_mm >= 50:
        reasons.append("Elevated 24-hour rainfall")

    if payload.humidity_pct >= 80:
        reasons.append("High humidity")

    if payload.wind_speed_kmh >= 50:
        reasons.append("Strong wind")

    if payload.pressure_hpa < 980:
        reasons.append("Low atmospheric pressure")

    if not reasons:
        reasons.append(
            "Environmental indicators are currently relatively low"
        )

    # Save prediction
    row = RiskPrediction(
        location_id=payload.location_id,
        predicted_at=datetime.now(timezone.utc),
        rainfall_24h_mm=payload.rainfall_24h_mm,
        temperature_c=payload.temperature_c,
        humidity_pct=payload.humidity_pct,
        wind_speed_kmh=payload.wind_speed_kmh,
        pressure_hpa=payload.pressure_hpa,
        risk_score=score,
        risk_level=level,
    )

    db.add(row)
    db.flush()

    # Automatic alert for HIGH / CRITICAL
    alert_id = None

    if level in {"HIGH", "CRITICAL"}:
        severity = (
            "CRITICAL"
            if level == "CRITICAL"
            else "HIGH"
        )

        title = f"{level} Risk Warning"

        message = (
            f"{location.name} has a "
            f"{level.lower()} environmental risk score "
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
        "model_version": row.model_version,
        "explanation": reasons,
        "alert_id": alert_id,
    }


@router.get(
    "/predictions",
    response_model=list[RiskPredictionOut],
)
def list_predictions(
    location_id: uuid.UUID | None = Query(default=None),
    limit: int = Query(
        default=50,
        ge=1,
        le=500,
    ),
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