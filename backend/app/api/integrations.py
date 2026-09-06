from fastapi import APIRouter, HTTPException

from app.schemas.integrations import GoogleMapsRouteRequest, OverpassQuery
from app.services.integrations import google_maps_directions_url, mapbox_directions, nasa_search, overpass_roads

router = APIRouter(prefix="/api/integrations", tags=["external integrations"])


@router.get("/map/status")
def map_status():
    return {
        "leaflet": "enabled",
        "openstreetmap_tiles": "enabled",
        "api_key_required": False,
        "note": "OpenStreetMap map tiles are used for the demo map. Respect tile usage policy and use a suitable provider for production scale."
    }


@router.post("/osm/roads")
async def osm_roads(payload: OverpassQuery):
    if payload.north <= payload.south or payload.east <= payload.west:
        raise HTTPException(status_code=400, detail="north/east must be greater than south/west")
    try:
        data = await overpass_roads(
            payload.south, payload.west, payload.north, payload.east, payload.highway_types
        )
        return {
            "source": "OpenStreetMap Overpass API",
            "api_key_required": False,
            "elements": data.get("elements", []),
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Overpass request failed: {exc}") from exc


@router.get("/nasa/search")
async def nasa_search_api(keyword: str, page_size: int = 10):
    try:
        data = await nasa_search(keyword, page_size)
        return {
            "source": "NASA Earthdata CMR",
            "authentication": "Public catalog search; Earthdata Login may be required for protected downloads",
            "items": data.get("feed", {}).get("entry", []),
        }
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"NASA Earthdata request failed: {exc}") from exc


@router.post("/google-maps/url")
def google_maps_url(payload: GoogleMapsRouteRequest):
    return {
        "url": google_maps_directions_url(
            payload.start_lat,
            payload.start_lon,
            payload.destination_lat,
            payload.destination_lon,
        ),
        "api_key_required": False,
        "note": "This creates a Google Maps URL. Google Maps Platform APIs/SDKs used directly in the app require their own credentials and billing setup."
    }


@router.post("/mapbox/directions")
async def mapbox_directions_api(payload: GoogleMapsRouteRequest):
    try:
        data = await mapbox_directions(
            payload.start_lat,
            payload.start_lon,
            payload.destination_lat,
            payload.destination_lon,
        )
        return {
            "source": "Mapbox Directions API",
            "api_key_required": True,
            "routes": data.get("routes", []),
            "waypoints": data.get("waypoints", []),
        }
    except ValueError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Mapbox request failed: {exc}") from exc
