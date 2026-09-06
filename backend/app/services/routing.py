"""Smart route accessibility and logistics scoring utilities."""
import heapq
import math
from collections import defaultdict

from app.models.incident import Incident
from app.models.risk_prediction import RiskPrediction
from app.models.road import Road


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    p1 = math.radians(lat1)
    p2 = math.radians(lat2)
    dp = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def road_midpoint(road: Road) -> tuple[float, float]:
    return ((road.start_lat + road.end_lat) / 2, (road.start_lon + road.end_lon) / 2)


def nearest_node(nodes: set[tuple[float, float]], lat: float, lon: float) -> tuple[tuple[float, float], float]:
    node = min(nodes, key=lambda n: haversine_km(lat, lon, n[0], n[1]))
    return node, haversine_km(lat, lon, node[0], node[1])


def _condition_penalty(condition: str | None) -> tuple[float, str | None]:
    value = (condition or "GOOD").upper()
    mapping = {
        "GOOD": (1.0, None),
        "FAIR": (1.15, "Road condition is FAIR"),
        "POOR": (1.45, "Road condition is POOR"),
        "DAMAGED": (2.0, "Road is DAMAGED"),
    }
    return mapping.get(value, (1.25, f"Road condition is {value}"))


def assess_road(road: Road, incidents: list[Incident], risk_contexts: list[tuple[RiskPrediction, float, float]]) -> dict:
    """Return a deterministic accessibility assessment for one road."""
    reasons: list[str] = []
    if road.is_blocked:
        return {
            "accessibility": "BLOCKED",
            "accessibility_score": 0.0,
            "risk_level": "CRITICAL",
            "reasons": ["Road is manually marked as blocked"],
        }

    score = 100.0
    risk_levels = []
    mid_lat, mid_lon = road_midpoint(road)

    condition_multiplier, condition_reason = _condition_penalty(road.condition)
    if condition_reason:
        reasons.append(condition_reason)
        score -= (condition_multiplier - 1.0) * 35

    for incident in incidents:
        if (incident.status or "ACTIVE").upper() != "ACTIVE":
            continue
        distance = haversine_km(mid_lat, mid_lon, incident.latitude, incident.longitude)
        if distance <= 5.0:
            severity = (incident.severity or "MEDIUM").upper()
            penalty = {"LOW": 10, "MEDIUM": 20, "HIGH": 35, "CRITICAL": 55}.get(severity, 20)
            score -= penalty * max(0.25, 1 - distance / 5.0)
            reasons.append(f"{severity} incident within {distance:.1f} km")

    latest_by_location: dict = {}
    for risk, risk_lat, risk_lon in risk_contexts:
        previous = latest_by_location.get(risk.location_id)
        if previous is None or risk.predicted_at > previous[0].predicted_at:
            latest_by_location[risk.location_id] = (risk, risk_lat, risk_lon)

    for risk, risk_lat, risk_lon in latest_by_location.values():
        distance = haversine_km(mid_lat, mid_lon, risk_lat, risk_lon)
        if distance <= 5.0:
            level = (risk.risk_level or "LOW").upper()
            penalty = {"LOW": 0, "MEDIUM": 12, "HIGH": 30, "CRITICAL": 55}.get(level, 0)
            score -= penalty * max(0.25, 1 - distance / 5.0)
            if level in {"HIGH", "CRITICAL"}:
                reasons.append(f"{level} predicted risk within {distance:.1f} km")

    score = max(0.0, min(100.0, score))
    if any("CRITICAL" in reason for reason in reasons):
        accessibility = "BLOCKED"
        score = min(score, 20.0)
    elif score < 40:
        accessibility = "BLOCKED"
    elif score < 70:
        accessibility = "CAUTION"
    else:
        accessibility = "OPEN"

    if not reasons:
        reasons.append("No active nearby incidents detected")

    risk_level = "LOW"
    if score < 40:
        risk_level = "CRITICAL"
    elif score < 70:
        risk_level = "HIGH"
    elif score < 85:
        risk_level = "MEDIUM"

    return {
        "accessibility": accessibility,
        "accessibility_score": round(score, 2),
        "risk_level": risk_level,
        "reasons": reasons,
    }


def shortest_safe_route(roads: list[Road], start_lat: float, start_lon: float, end_lat: float, end_lon: float):
    """Find the lowest-cost route using the available road endpoints."""
    available = [r for r in roads if not r.is_blocked]
    if not available:
        return None

    nodes: set[tuple[float, float]] = set()
    graph: dict[tuple[float, float], list[tuple[tuple[float, float], float, int]]] = defaultdict(list)

    for road in available:
        a = (round(road.start_lat, 6), round(road.start_lon, 6))
        b = (round(road.end_lat, 6), round(road.end_lon, 6))
        nodes.update((a, b))
        distance = haversine_km(*a, *b)
        multiplier, _ = _condition_penalty(road.condition)
        weight = distance * multiplier
        graph[a].append((b, weight, road.id))
        graph[b].append((a, weight, road.id))

    source, source_connector = nearest_node(nodes, start_lat, start_lon)
    target, target_connector = nearest_node(nodes, end_lat, end_lon)

    distances = {source: 0.0}
    previous: dict[tuple[float, float], tuple[tuple[float, float], int] | None] = {source: None}
    queue = [(0.0, source)]

    while queue:
        current_cost, node = heapq.heappop(queue)
        if current_cost != distances.get(node):
            continue
        if node == target:
            break
        for neighbor, edge_cost, road_id in graph[node]:
            new_cost = current_cost + edge_cost
            if new_cost < distances.get(neighbor, float("inf")):
                distances[neighbor] = new_cost
                previous[neighbor] = (node, road_id)
                heapq.heappush(queue, (new_cost, neighbor))

    if target not in distances:
        return None

    road_ids = []
    cursor = target
    while previous.get(cursor) is not None:
        prev_node, road_id = previous[cursor]
        road_ids.append(road_id)
        cursor = prev_node
    road_ids.reverse()

    return {
        "road_ids": road_ids,
        "network_cost": round(distances[target], 3),
        "connector_distance_km": round(source_connector + target_connector, 3),
        "total_distance_km": round(distances[target] + source_connector + target_connector, 3),
    }
