import math
import os

import numpy as np
import requests
import rasterio
from dotenv import load_dotenv


load_dotenv()

OPENTOPOGRAPHY_API_KEY = os.getenv(
    "OPENTOPOGRAPHY_API_KEY"
)

DEM_URL = "https://portal.opentopography.org/API/globaldem"

# Approximately 2 km x 2 km tiles.
# Nearby locations reuse the same downloaded DEM.
TILE_SIZE = 0.02

CACHE_DIR = "data/terrain_cache"

os.makedirs(CACHE_DIR, exist_ok=True)


def get_tile_bounds(latitude, longitude):
    """
    Put a coordinate into a reusable DEM tile.
    """

    south = math.floor(
        latitude / TILE_SIZE
    ) * TILE_SIZE

    west = math.floor(
        longitude / TILE_SIZE
    ) * TILE_SIZE

    north = south + TILE_SIZE
    east = west + TILE_SIZE

    return (
        south,
        north,
        west,
        east,
    )


def get_tile_path(
    south,
    north,
    west,
    east,
):
    """
    Generate a unique cache filename.
    """

    return os.path.join(
        CACHE_DIR,
        (
            f"cop30_"
            f"{south:.2f}_"
            f"{north:.2f}_"
            f"{west:.2f}_"
            f"{east:.2f}.tif"
        ),
    )


def download_dem_tile(
    latitude,
    longitude,
):
    """
    Download a DEM tile only if it does not
    already exist in the local cache.
    """

    if not OPENTOPOGRAPHY_API_KEY:
        raise RuntimeError(
            "OPENTOPOGRAPHY_API_KEY is not configured."
        )

    (
        south,
        north,
        west,
        east,
    ) = get_tile_bounds(
        latitude,
        longitude
    )

    tile_path = get_tile_path(
        south,
        north,
        west,
        east,
    )

    # Reuse existing DEM.
    if os.path.exists(tile_path):

        print("Using cached DEM.")

        return tile_path

    print("Downloading new DEM tile...")

    params = {
        "demtype": "COP30",
        "south": south,
        "north": north,
        "west": west,
        "east": east,
        "outputFormat": "GTiff",
        "API_Key": OPENTOPOGRAPHY_API_KEY,
    }

    response = requests.get(
        DEM_URL,
        params=params,
        timeout=60,
    )

    response.raise_for_status()

    if len(response.content) < 1000:
        raise RuntimeError(
            "OpenTopography returned an invalid DEM."
        )

    with open(
        tile_path,
        "wb",
    ) as file:

        file.write(
            response.content
        )

    print(
        f"DEM cached: {tile_path}"
    )

    return tile_path


def calculate_slope(
    elevation,
    latitude,
    transform,
):
    """
    Calculate slope in degrees for the DEM.
    """

    latitude_rad = np.radians(
        latitude
    )

    meters_per_degree_lat = 111320.0

    meters_per_degree_lon = (
        111320.0
        * np.cos(latitude_rad)
    )

    x_resolution_m = (
        abs(transform.a)
        * meters_per_degree_lon
    )

    y_resolution_m = (
        abs(transform.e)
        * meters_per_degree_lat
    )

    # Replace nodata with NaN.
    elevation = elevation.astype(
        float
    )

    dz_dy, dz_dx = np.gradient(
        elevation,
        y_resolution_m,
        x_resolution_m,
    )

    slope_radians = np.arctan(
        np.sqrt(
            dz_dx ** 2
            + dz_dy ** 2
        )
    )

    slope_degrees = np.degrees(
        slope_radians
    )

    return slope_degrees


def get_terrain_features(
    latitude: float,
    longitude: float,
):
    """
    Get elevation and slope at an exact
    latitude/longitude.

    DEM tiles are cached locally.
    """

    dem_path = download_dem_tile(
        latitude,
        longitude,
    )

    with rasterio.open(
        dem_path
    ) as src:

        elevation = src.read(
            1
        ).astype(float)

        # Handle nodata.
        if src.nodata is not None:

            elevation[
                elevation == src.nodata
            ] = np.nan

        # Find pixel containing requested point.
        row, col = src.index(
            longitude,
            latitude,
        )

        # Make sure point is inside raster.
        if (
            row < 0
            or row >= src.height
            or col < 0
            or col >= src.width
        ):
            raise RuntimeError(
                "Requested location is outside DEM."
            )

        elevation_value = float(
            elevation[
                row,
                col
            ]
        )

        if not np.isfinite(
            elevation_value
        ):
            raise RuntimeError(
                "Elevation value is invalid."
            )

        # Calculate slope for entire DEM.
        slope = calculate_slope(
            elevation,
            latitude,
            src.transform,
        )

        slope_value = float(
            slope[
                row,
                col
            ]
        )

        if not np.isfinite(
            slope_value
        ):
            raise RuntimeError(
                "Slope value is invalid."
            )

    return {
        "elevation_m": round(
            elevation_value,
            2,
        ),
        "slope_degrees": round(
            slope_value,
            2,
        ),
    }


if __name__ == "__main__":

    latitude = 24.478972
    longitude = 92.682861

    print(
        "Getting terrain features..."
    )

    print(
        "---------------------------"
    )

    features = get_terrain_features(
        latitude,
        longitude,
    )

    print(
        f"Latitude:       {latitude}"
    )

    print(
        f"Longitude:      {longitude}"
    )

    print(
        f"Elevation:      "
        f"{features['elevation_m']} m"
    )

    print(
        f"Slope:          "
        f"{features['slope_degrees']}°"
    )