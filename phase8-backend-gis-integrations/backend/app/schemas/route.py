from pydantic import BaseModel, Field


class RoadAccessibilityOut(BaseModel):
    road_id: int
    road_name: str
    accessibility: str
    accessibility_score: float
    risk_level: str
    is_blocked: bool
    reasons: list[str]


class RoutePlanRequest(BaseModel):
    start_lat: float = Field(ge=-90, le=90)
    start_lon: float = Field(ge=-180, le=180)
    destination_lat: float = Field(ge=-90, le=90)
    destination_lon: float = Field(ge=-180, le=180)
    emergency: bool = False


class RoutePlanOut(BaseModel):
    status: str
    emergency: bool
    start_lat: float
    start_lon: float
    destination_lat: float
    destination_lon: float
    total_distance_km: float
    road_count: int
    road_ids: list[int]
    roads: list[str]
    route_score: float
    route_risk_level: str
    recommendation: str
    warnings: list[str]
    mapbox_distance_km: float | None = None
    mapbox_duration_minutes: float | None = None
    mapbox_geometry: dict | None = None
