import math
import subprocess
from pathlib import Path

import numpy as np
import pandas as pd
import rasterio


INPUT = Path("data/processed/landslides_ner_dated.csv")
OUTPUT = Path("data/processed/landslides_ner_terrain.csv")
CACHE_DIR = Path("data/terrain_cache")

CACHE_DIR.mkdir(parents=True, exist_ok=True)


def get_tile_info(lat, lon):
    lat_floor = math.floor(lat)
    lon_floor = math.floor(lon)

    lat_prefix = "N" if lat_floor >= 0 else "S"
    lon_prefix = "E" if lon_floor >= 0 else "W"

    tile = (
        f"Copernicus_DSM_COG_30_"
        f"{lat_prefix}{abs(lat_floor):02d}_00_"
        f"{lon_prefix}{abs(lon_floor):03d}_00_DEM"
    )

    return tile


def download_tile(lat, lon):

    tile = get_tile_info(lat, lon)

    tile_dir = CACHE_DIR / tile
    tile_dir.mkdir(parents=True, exist_ok=True)

    tif_name = f"{tile}.tif"
    local_file = tile_dir / tif_name

    if local_file.exists():
        return local_file

    s3_path = f"s3://copernicus-dem-90m/{tile}/{tif_name}"

    print(f"Downloading DEM: {tile}")

    result = subprocess.run(
        [
            "aws",
            "s3",
            "cp",
            s3_path,
            str(local_file),
            "--no-sign-request",
        ],
        capture_output=True,
        text=True,
    )

    if result.returncode != 0:

        print("DEM download failed:")
        print(result.stderr)

        if local_file.exists():
            local_file.unlink()

        return None

    return local_file


def calculate_slope(dem, transform, latitude):

    pixel_width_deg = abs(transform.a)
    pixel_height_deg = abs(transform.e)

    meters_lat = 111320.0
    meters_lon = (
        111320.0 *
        math.cos(math.radians(latitude))
    )

    dx = pixel_width_deg * meters_lon
    dy = pixel_height_deg * meters_lat

    dz_dy, dz_dx = np.gradient(
        dem,
        dy,
        dx
    )

    slope = np.degrees(
        np.arctan(
            np.sqrt(
                dz_dx ** 2 +
                dz_dy ** 2
            )
        )
    )

    return slope


def extract_point(tif, lat, lon):

    with rasterio.open(tif) as src:

        row, col = src.index(lon, lat)

        dem = src.read(1).astype(float)

        nodata = src.nodata

        if nodata is not None:
            dem[dem == nodata] = np.nan

        if (
            row < 1
            or row >= dem.shape[0] - 1
            or col < 1
            or col >= dem.shape[1] - 1
        ):
            return np.nan, np.nan

        elevation = dem[row, col]

        slope = calculate_slope(
            dem,
            src.transform,
            lat
        )

        slope_value = slope[row, col]

        return float(elevation), float(slope_value)


def main():

    print("=" * 60)
    print("LANDSLIDE TERRAIN EXTRACTION")
    print("=" * 60)

    df = pd.read_csv(INPUT)

    print(f"Records: {len(df)}")

    if OUTPUT.exists():

        old = pd.read_csv(OUTPUT)

        if len(old) == len(df):

            df = old

            print(
                "Resuming existing terrain extraction..."
            )

        else:

            print(
                "Existing output size differs. "
                "Starting fresh."
            )

            df["elevation_m"] = np.nan
            df["slope_degrees"] = np.nan

    else:

        df["elevation_m"] = np.nan
        df["slope_degrees"] = np.nan

    for i in range(len(df)):

        if (
            pd.notna(df.loc[i, "elevation_m"])
            and
            pd.notna(df.loc[i, "slope_degrees"])
        ):
            continue

        lat = df.loc[i, "latitude"]
        lon = df.loc[i, "longitude"]

        if pd.isna(lat) or pd.isna(lon):
            continue

        print(
            f"\n[{i + 1}/{len(df)}] "
            f"{lat}, {lon}"
        )

        tif = download_tile(
            float(lat),
            float(lon)
        )

        if tif is None:
            continue

        try:

            elevation, slope = extract_point(
                tif,
                float(lat),
                float(lon)
            )

            df.loc[i, "elevation_m"] = elevation
            df.loc[i, "slope_degrees"] = slope

            print(
                f"Elevation: {elevation:.2f} m"
            )

            print(
                f"Slope: {slope:.2f}°"
            )

        except Exception as e:

            print(
                f"Extraction error: {e}"
            )

        if (i + 1) % 10 == 0:

            df.to_csv(
                OUTPUT,
                index=False
            )

            print(
                "Checkpoint saved."
            )

    df.to_csv(
        OUTPUT,
        index=False
    )

    print("\n" + "=" * 60)
    print("TERRAIN EXTRACTION COMPLETE")
    print("=" * 60)

    print(
        "Output:",
        OUTPUT
    )

    print(
        "Elevation values:",
        df["elevation_m"].notna().sum()
    )

    print(
        "Slope values:",
        df["slope_degrees"].notna().sum()
    )


if __name__ == "__main__":
    main()