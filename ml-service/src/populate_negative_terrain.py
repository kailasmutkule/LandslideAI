from pathlib import Path
import pandas as pd
import numpy as np
import rasterio
import math
import requests
import time

INPUT_FILE = Path("data/processed/landslides_ner_training.csv")
OUTPUT_FILE = Path("data/processed/landslides_ner_training_terrain.csv")
CACHE_DIR = Path("data/terrain_cache")

S3_BASE = "https://copernicus-dem-90m.s3.eu-central-1.amazonaws.com"

df = pd.read_csv(INPUT_FILE)

print("Total records:", len(df))
print("Terrain already available:", df["elevation_m"].notna().sum())

def tile_name(lat, lon):
    lat_floor = math.floor(lat)
    lon_floor = math.floor(lon)

    lat_prefix = "N" if lat_floor >= 0 else "S"
    lon_prefix = "E" if lon_floor >= 0 else "W"

    return (
        f"Copernicus_DSM_COG_30_"
        f"{lat_prefix}{abs(lat_floor):02d}_00_"
        f"{lon_prefix}{abs(lon_floor):03d}_00_DEM"
    )

def get_tile(lat, lon):

    tile = tile_name(lat, lon)
    tile_dir = CACHE_DIR / tile
    tile_dir.mkdir(parents=True, exist_ok=True)

    tif = tile_dir / f"{tile}.tif"

    if tif.exists():
        return tif

    url = f"{S3_BASE}/{tile}/{tile}.tif"

    print(f"Downloading DEM tile: {tile}")

    try:
        r = requests.get(url, timeout=120)

        if r.status_code != 200:
            print(f"Failed: HTTP {r.status_code}")
            return None

        tif.write_bytes(r.content)

        return tif

    except Exception as e:
        print("Download error:", e)
        return None

def calculate_slope(dataset, row, col, lat):

    window = rasterio.windows.Window(
        max(0, col - 1),
        max(0, row - 1),
        3,
        3
    )

    data = dataset.read(1, window=window)

    if data.shape != (3, 3):
        return np.nan

    if np.isnan(data).any():
        return np.nan

    # DEM pixel size in degrees
    res_x = abs(dataset.transform.a)
    res_y = abs(dataset.transform.e)

    # Convert degrees to meters
    lat_rad = math.radians(lat)

    meters_per_degree_lat = 111320
    meters_per_degree_lon = 111320 * math.cos(lat_rad)

    dx = res_x * meters_per_degree_lon
    dy = res_y * meters_per_degree_lat

    dz_dx = (
        (data[0, 2] + 2 * data[1, 2] + data[2, 2])
        -
        (data[0, 0] + 2 * data[1, 0] + data[2, 0])
    ) / (8 * dx)

    dz_dy = (
        (data[2, 0] + 2 * data[2, 1] + data[2, 2])
        -
        (data[0, 0] + 2 * data[0, 1] + data[0, 2])
    ) / (8 * dy)

    slope = math.degrees(
        math.atan(
            math.sqrt(dz_dx ** 2 + dz_dy ** 2)
        )
    )

    return slope

# ------------------------------------------------------------
# Process ONLY rows missing terrain
# ------------------------------------------------------------

missing_indices = df[
    df["elevation_m"].isna() |
    df["slope_degrees"].isna()
].index

print("Records requiring terrain:", len(missing_indices))

for count, idx in enumerate(missing_indices, start=1):

    lat = df.at[idx, "latitude"]
    lon = df.at[idx, "longitude"]

    print(
        f"[{count}/{len(missing_indices)}] "
        f"lat={lat:.5f}, lon={lon:.5f}"
    )

    tif = get_tile(lat, lon)

    if tif is None:
        continue

    try:

        with rasterio.open(tif) as src:

            row, col = src.index(lon, lat)

            elevation = src.read(1)[row, col]

            if src.nodata is not None and elevation == src.nodata:
                elevation = np.nan

            slope = calculate_slope(
                src,
                row,
                col,
                lat
            )

            df.at[idx, "elevation_m"] = float(elevation)
            df.at[idx, "slope_degrees"] = float(slope)

    except Exception as e:

        print("Extraction error:", e)

    # checkpoint
    if count % 50 == 0:

        df.to_csv(
            OUTPUT_FILE,
            index=False
        )

        print("Checkpoint saved.")

# Final save

df.to_csv(
    OUTPUT_FILE,
    index=False
)

print("\nDONE")
print("Output:", OUTPUT_FILE)

print("\nTerrain availability:")
print("Elevation:", df["elevation_m"].notna().sum())
print("Slope:", df["slope_degrees"].notna().sum())