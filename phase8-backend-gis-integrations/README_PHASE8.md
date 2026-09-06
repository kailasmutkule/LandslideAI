# Phase 8 — GIS, External Data Integrations & Deployment Preparation

Phase 8 builds on Phases 1–7 and adds a practical integration layer without requiring secret API keys for the default demo.

## Added
- Leaflet + OpenStreetMap interactive map in the dashboard.
- OpenStreetMap Overpass road-network preview API.
- NASA Earthdata CMR catalog search endpoint.
- Google Maps directions URL generation (no Google API key required for the URL itself).
- Optional environment variables for NASA Earthdata, Mapbox, Google Maps Platform, and Open-Meteo.
- Integration status endpoint.
- Phase 8 versioned backend.
- External-service documentation and API-key guidance.

## API key policy
The ZIP intentionally contains **placeholders only**, never real API keys.

- Open-Meteo: no key for the existing weather integration.
- OpenStreetMap/Overpass: no key for the public demo endpoint; rate limits and usage policy apply.
- NASA Earthdata: public catalog search is available; protected data downloads can require Earthdata Login/token.
- Google Maps Platform: direct APIs/SDKs require a key and billing setup; this package only generates a Google Maps URL by default.
- Mapbox: optional token, not required by the demo map.

## Run
### Backend
```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
pip install email-validator
# create .env from .env.example and set DATABASE_URL/JWT_SECRET_KEY
uvicorn app.main:app --reload
```

### Frontend
In another terminal:
```bash
cd frontend
python3 -m http.server 5500
```
Open http://127.0.0.1:5500/

## Phase 8 API endpoints
- GET `/api/integrations/map/status`
- POST `/api/integrations/osm/roads`
- GET `/api/integrations/nasa/search?keyword=landslide&page_size=10`
- POST `/api/integrations/google-maps/url`

## Important
Do not put real API keys in source code or commit them to GitHub. Use `.env` locally and restrict production credentials.
