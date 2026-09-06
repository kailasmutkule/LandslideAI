# SIH26001 Backend - Phase 3

Phase 3 extends Phase 2 with weather, rainfall, and environmental observation functionality.

## Added
- Open-Meteo current weather integration (no API key required for normal use)
- Open-Meteo hourly forecast integration
- Environmental observations stored in PostgreSQL
- Location-linked environmental records
- Dashboard environmental observation count

## Weather endpoints
- `GET /api/weather/current?location_id=<uuid>`
- `GET /api/weather/current?latitude=27.586&longitude=91.859`
- `GET /api/weather/forecast?location_id=<uuid>&forecast_days=3`
- `GET /api/weather/forecast?latitude=27.586&longitude=91.859&forecast_days=3`

## Environmental endpoints
- `POST /api/environment/observations`
- `GET /api/environment/observations`
- `GET /api/environment/observations?location_id=<uuid>`
- `GET /api/environment/observations/{observation_id}`

## Run
```bash
cd ~/Downloads/phase3-backend/backend
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

Keep the existing Phase 1/2 PostgreSQL container running. The Phase 3 app reuses the same database.
