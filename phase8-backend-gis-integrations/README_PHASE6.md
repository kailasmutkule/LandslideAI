# Phase 6 - Smart Route Accessibility & Logistics

This phase extends Phase 5 with backend APIs for road accessibility and smart route planning.

## New capabilities

- Road accessibility assessment: `OPEN`, `CAUTION`, or `BLOCKED`
- Accessibility score based on road condition, active nearby incidents, and recent risk predictions
- Safe route planning between two latitude/longitude points
- Dijkstra shortest-path routing over the roads stored in PostgreSQL
- Blocked roads are excluded from route planning
- Emergency route mode for relief/emergency logistics
- Route risk level, warnings, and recommendation in the API response

## New APIs

### 1. Check one road
`GET /api/routes/road/{road_id}/accessibility`

### 2. Check all roads
`GET /api/routes/accessibility`

### 3. Plan a route
`POST /api/routes/plan`

Example request:
```json
{
  "start_lat": 27.586,
  "start_lon": 91.859,
  "destination_lat": 27.60,
  "destination_lon": 91.87,
  "emergency": true
}
```

## Routing logic

The planner uses the road endpoints already stored in the `roads` table. Blocked roads are excluded. Road length is calculated using the Haversine formula and adjusted by road condition. The returned route is the lowest-cost accessible path in the current road network.

Accessibility additionally considers active incidents and recent risk predictions within approximately 5 km of the road midpoint.

## Important limitation

This is a Phase 6 backend baseline. It is not a replacement for a production GIS routing engine or live road authority feed. Real deployment should integrate authoritative road networks, live closures, and validated geospatial risk layers.
