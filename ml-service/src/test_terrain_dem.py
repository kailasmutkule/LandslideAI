import os
import requests
import rasterio
import numpy as np
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("OPENTOPOGRAPHY_API_KEY")

URL = "https://portal.opentopography.org/API/globaldem"

params = {
    "demtype": "COP30",
    "south": 24.47,
    "north": 24.49,
    "west": 92.67,
    "east": 92.69,
    "outputFormat": "GTiff",
    "API_Key": API_KEY,
}

print("Downloading DEM...")

response = requests.get(
    URL,
    params=params,
    timeout=120,
)

response.raise_for_status()

dem_path = "data/cop30_hailakandi_test.tif"

os.makedirs("data", exist_ok=True)

with open(dem_path, "wb") as f:
    f.write(response.content)

print(f"DEM saved: {dem_path}")
print(f"Size: {len(response.content)} bytes")

with rasterio.open(dem_path) as src:
    elevation = src.read(1)

    print("\nDEM information")
    print("----------------")
    print("Width:", src.width)
    print("Height:", src.height)
    print("CRS:", src.crs)
    print("Resolution:", src.res)
    print("Minimum elevation:", float(np.nanmin(elevation)))
    print("Maximum elevation:", float(np.nanmax(elevation)))
    print("Mean elevation:", float(np.nanmean(elevation)))

        # Calculate slope correctly.
    # DEM is EPSG:4326, so raster resolution is in degrees.
    # Convert the pixel dimensions from degrees to meters.

    latitude = (src.bounds.top + src.bounds.bottom) / 2

    meters_per_degree_lat = 111320.0
    meters_per_degree_lon = (
        111320.0 * np.cos(np.radians(latitude))
    )

    x_resolution_m = (
        abs(src.transform.a) * meters_per_degree_lon
    )

    y_resolution_m = (
        abs(src.transform.e) * meters_per_degree_lat
    )

    print("\nPixel size in meters")
    print("--------------------")
    print("X:", x_resolution_m)
    print("Y:", y_resolution_m)

    dz_dy, dz_dx = np.gradient(
        elevation,
        y_resolution_m,
        x_resolution_m,
    )

    slope_radians = np.arctan(
        np.sqrt(dz_dx**2 + dz_dy**2)
    )

    slope_degrees = np.degrees(
        slope_radians
    )

    print("\nSlope information")
    print("-----------------")
    print(
        "Minimum slope:",
        float(np.nanmin(slope_degrees)),
        "degrees",
    )
    print(
        "Maximum slope:",
        float(np.nanmax(slope_degrees)),
        "degrees",
    )
    print(
        "Mean slope:",
        float(np.nanmean(slope_degrees)),
        "degrees",
    )
