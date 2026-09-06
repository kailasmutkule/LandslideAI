from urllib.parse import quote

import httpx

from app.core.config import settings

OVERPASS_URL = "https://overpass-api.de/api/interpreter"
NASA_CMR_URL = "https://cmr.earthdata.nasa.gov/search/collections.json"
MAPBOX_DIRECTIONS_URL = "https://api.mapbox.com/directions/v5/mapbox/driving"


OVERPASS_HEADERS = {
    "User-Agent": "SIH26001-Smart-Logistics-Platform/1.0 (educational project)",
    "Accept": "application/json",
}


async def overpass_roads(
    south: float,
    west: float,
    north: float,
    east: float,
    highway_types: list[str],
):
    tags = "|".join(sorted(set(highway_types)))

    query = f"""
    [out:json][timeout:30];
    way[highway~"^({tags})$"]({south},{west},{north},{east});
    out geom;
    """

    async with httpx.AsyncClient(
        timeout=45.0,
        headers=OVERPASS_HEADERS,
    ) as client:
        response = await client.post(
            OVERPASS_URL,
            data={"data": query},
        )
        response.raise_for_status()
        return response.json()


async def nasa_search(keyword: str, page_size: int = 10):
    params = {
        "keyword": keyword,
        "page_size": min(max(page_size, 1), 100),
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            NASA_CMR_URL,
            params=params,
        )
        response.raise_for_status()
        return response.json()


def google_maps_directions_url(
    start_lat,
    start_lon,
    destination_lat,
    destination_lon,
):
    origin = f"{start_lat},{start_lon}"
    destination = f"{destination_lat},{destination_lon}"

    return (
        "https://www.google.com/maps/dir/?api=1"
        f"&origin={quote(origin)}"
        f"&destination={quote(destination)}"
        "&travelmode=driving"
    )

async def mapbox_directions(
    start_lat: float,
    start_lon: float,
    destination_lat: float,
    destination_lon: float,
):
    if not settings.MAPBOX_ACCESS_TOKEN:
        raise ValueError("MAPBOX_ACCESS_TOKEN is not configured")

    coordinates = f"{start_lon},{start_lat};{destination_lon},{destination_lat}"

    params = {
        "access_token": settings.MAPBOX_ACCESS_TOKEN,
        "geometries": "geojson",
        "overview": "full",
        "steps": "true",
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(
            f"{MAPBOX_DIRECTIONS_URL}/{coordinates}",
            params=params,
        )
        response.raise_for_status()
        return response.json()
