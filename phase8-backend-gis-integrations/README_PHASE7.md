# Phase 7 - Dashboard & Frontend Integration

This phase builds on Phase 6 and adds a lightweight, dependency-free frontend dashboard connected to the FastAPI backend.

## Included
- Live dashboard summary
- Road accessibility table
- Blocked-road and risk indicators
- Active alert panel
- Smart route planner using `/api/routes/plan`
- Automatic refresh every 30 seconds
- Responsive UI
- FastAPI CORS remains enabled for local frontend development

## Run backend
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload
```
Backend: http://127.0.0.1:8000
Swagger: http://127.0.0.1:8000/docs

## Run frontend
Open a second terminal:
```bash
cd frontend
python3 -m http.server 5500
```
Open:
http://127.0.0.1:5500

## Important
The frontend currently uses `http://127.0.0.1:8000` as the backend URL. Change the `API` constant in `frontend/js/app.js` when deploying.

## Phase 7 demo
1. Start PostgreSQL/PostGIS as in earlier phases.
2. Start the backend.
3. Start the frontend.
4. Open the dashboard.
5. Confirm the existing Tawang roads appear.
6. Use Smart Route Planner to find a route.
7. Block Road 1 from Swagger and refresh the dashboard.
8. Run the route planner again; it should select the alternative Road 3 -> Road 4.

## Known limitation
The current dashboard is a simple integration layer for the SIH prototype. A production version can replace the table with an interactive NER map, add authentication/role-based controls, real weather maps, GIS layers, charts, and mobile notifications.
