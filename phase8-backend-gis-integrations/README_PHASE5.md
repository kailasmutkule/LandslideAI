# SIH26001 Backend — Phase 5

## Alerts & Early Warning System

Phase 5 adds an alert system on top of the Phase 4 risk prediction API.

### New APIs
- `POST /api/alerts` — create an alert manually
- `GET /api/alerts` — list alerts; optional `location_id`, `severity`, `status`, `limit`
- `GET /api/alerts/{alert_id}` — get one alert
- `PUT /api/alerts/{alert_id}/status` — update ACTIVE/ACKNOWLEDGED/RESOLVED/etc.
- `DELETE /api/alerts/{alert_id}` — delete an alert

### Automatic early warning
`POST /api/risk/predict` now automatically creates an ACTIVE alert when the prediction is `HIGH` or `CRITICAL` and returns the new `alert_id`.

### Test flow
1. Start PostgreSQL/PostGIS.
2. Start FastAPI from `backend` with `uvicorn app.main:app --reload`.
3. Open `/docs`.
4. Use the existing Tawang location or create another location.
5. Call `POST /api/risk/predict` with a high-risk payload.
6. Confirm the response contains `alert_id`.
7. Call `GET /api/alerts` and confirm the alert appears.
8. Optionally update its status using `PUT /api/alerts/{alert_id}/status`.

The Phase 4 ML model remains a synthetic/demo baseline and is not scientifically validated for operational disaster warnings.
