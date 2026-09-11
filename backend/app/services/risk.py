import requests

from app.core.config import settings


def predict(features):
    payload = {
        "latitude": features.latitude,
        "longitude": features.longitude,
        "rainfall_1d": features.rainfall_1d,
        "rainfall_3d": features.rainfall_3d,
        "rainfall_7d": features.rainfall_7d,
        "rainfall_30d": features.rainfall_30d,
        "rainfall_1d_available": features.rainfall_1d_available,
        "rainfall_3d_available": features.rainfall_3d_available,
        "rainfall_7d_available": features.rainfall_7d_available,
        "rainfall_30d_available": features.rainfall_30d_available,
        "elevation_m": features.elevation_m,
        "slope_degrees": features.slope_degrees,
        "event_date": features.event_date,
    }

    response = requests.post(
        f"{settings.ML_SERVICE_URL}/predict",
        json=payload,
        timeout=30,
    )

    response.raise_for_status()

    result = response.json()

    return (
        result["risk_score"],
        result["risk_level"],
    )