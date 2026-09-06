"""Open-Meteo integration. No API key is required for normal use."""
from typing import Any

import httpx

OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast"


class WeatherServiceError(Exception):
    pass


def _request(params: dict[str, Any]) -> dict[str, Any]:
    try:
        with httpx.Client(timeout=15.0) as client:
            response = client.get(OPEN_METEO_FORECAST_URL, params=params)
            response.raise_for_status()
            return response.json()
    except (httpx.HTTPError, ValueError) as exc:
        raise WeatherServiceError(f"Weather service request failed: {exc}") from exc


def get_current_weather(latitude: float, longitude: float) -> dict[str, Any]:
    data = _request(
        {
            "latitude": latitude,
            "longitude": longitude,
            "current": ",".join(
                [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "precipitation",
                    "rain",
                    "showers",
                    "snowfall",
                    "weather_code",
                    "wind_speed_10m",
                    "wind_direction_10m",
                    "pressure_msl",
                ]
            ),
            "timezone": "auto",
        }
    )
    return data


def get_forecast(latitude: float, longitude: float, forecast_days: int = 3) -> dict[str, Any]:
    return _request(
        {
            "latitude": latitude,
            "longitude": longitude,
            "hourly": ",".join(
                [
                    "temperature_2m",
                    "relative_humidity_2m",
                    "precipitation",
                    "rain",
                    "showers",
                    "weather_code",
                    "wind_speed_10m",
                    "pressure_msl",
                ]
            ),
            "forecast_days": forecast_days,
            "timezone": "auto",
        }
    )
