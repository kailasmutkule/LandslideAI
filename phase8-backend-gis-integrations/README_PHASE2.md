# SIH26001 Backend - Phase 2

Phase 2 adds the core logistics/accessibility data APIs:

- Locations (PostGIS point geometry)
- Roads
- Incidents
- Dashboard road/incident counts

## Run

From `backend/`:

```bash
source venv/bin/activate
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000/docs`.

## Database

Docker PostgreSQL/PostGIS credentials used by `.env.example`:

- user: `sih_user`
- password: `sih_password`
- database: `sih26001`
- port: `5432`

Never commit a real `.env` file containing secrets.
