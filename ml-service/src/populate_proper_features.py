from pathlib import Path
import pandas as pd
import numpy as np
import rasterio
import math

INPUT = Path("data/processed/landslides_ner_training_proper.csv")
OUTPUT = Path("data/processed/landslides_ner_training_features.csv")
CACHE_DIR = Path("data/terrain_cache")

df = pd.read_csv(INPUT)
df["event_date"] = pd.to_datetime(df["event_date"])

print("Rows:", len(df))
print("Positive:", (df["landslide"] == 1).sum())
print("Negative:", (df["landslide"] == 0).sum())


# =========================================================
# TERRAIN
# =========================================================

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


def get_dem(lat, lon):

    tile = tile_name(lat, lon)

    tif = (
        CACHE_DIR /
        tile /
        f"{tile}.tif"
    )

    if tif.exists():
        return tif

    print("DEM not cached:", tile)
    return None


def calculate_slope(src, row, col, lat):

    if row < 1 or col < 1:
        return np.nan

    if (
        row >= src.height - 1 or
        col >= src.width - 1
    ):
        return np.nan

    data = src.read(
        1,
        window=rasterio.windows.Window(
            col - 1,
            row - 1,
            3,
            3
        )
    )

    if data.shape != (3, 3):
        return np.nan

    if np.isnan(data).any():
        return np.nan

    res_x = abs(src.transform.a)
    res_y = abs(src.transform.e)

    lat_rad = math.radians(lat)

    meters_lat = 111320
    meters_lon = 111320 * math.cos(lat_rad)

    dx = res_x * meters_lon
    dy = res_y * meters_lat

    dzdx = (
        (data[0, 2] + 2 * data[1, 2] + data[2, 2])
        -
        (data[0, 0] + 2 * data[1, 0] + data[2, 0])
    ) / (8 * dx)

    dzdy = (
        (data[2, 0] + 2 * data[2, 1] + data[2, 2])
        -
        (data[0, 0] + 2 * data[0, 1] + data[0, 2])
    ) / (8 * dy)

    return math.degrees(
        math.atan(
            math.sqrt(
                dzdx ** 2 +
                dzdy ** 2
            )
        )
    )


print("\nProcessing terrain...")

terrain_cache = {}

for idx in df.index:

    # Keep existing real terrain
    if (
        pd.notna(df.at[idx, "elevation_m"]) and
        pd.notna(df.at[idx, "slope_degrees"])
    ):
        continue

    lat = df.at[idx, "latitude"]
    lon = df.at[idx, "longitude"]

    tif = get_dem(lat, lon)

    if tif is None:
        continue

    try:

        with rasterio.open(tif) as src:

            row, col = src.index(lon, lat)

            elevation = src.read(
                1
            )[row, col]

            if (
                src.nodata is not None and
                elevation == src.nodata
            ):
                elevation = np.nan

            slope = calculate_slope(
                src,
                row,
                col,
                lat
            )

            df.at[idx, "elevation_m"] = float(
                elevation
            )

            df.at[idx, "slope_degrees"] = float(
                slope
            )

    except Exception as e:

        print(
            f"Terrain error at row {idx}: {e}"
        )

    if (idx + 1) % 250 == 0:

        print(
            f"Terrain processed: "
            f"{idx + 1}/{len(df)}"
        )


# =========================================================
# HISTORICAL FEATURES
# =========================================================
#
# IMPORTANT:
# Only REAL landslide events are used.
# Current event itself is excluded.
#
# For every sample we calculate:
# - previous events within 30 days
# - previous events within 90 days
# - previous events within 365 days
# - nearby historical events
#
# This prevents target leakage.
# =========================================================

events = df[
    df["landslide"] == 1
][
    [
        "latitude",
        "longitude",
        "event_date"
    ]
].copy()

events = events.sort_values(
    "event_date"
).reset_index(drop=True)

event_dates = events["event_date"].values
event_lats = events["latitude"].values
event_lons = events["longitude"].values


def haversine_km(
    lat1,
    lon1,
    lat2,
    lon2
):

    R = 6371.0

    lat1 = np.radians(lat1)
    lat2 = np.radians(lat2)

    dlat = lat2 - lat1
    dlon = np.radians(lon2 - lon1)

    a = (
        np.sin(dlat / 2) ** 2 +
        np.cos(lat1) *
        np.cos(lat2) *
        np.sin(dlon / 2) ** 2
    )

    return (
        2 *
        R *
        np.arcsin(
            np.sqrt(a)
        )
    )


print("\nCalculating historical features...")

for idx in df.index:

    current_date = df.at[
        idx,
        "event_date"
    ]

    lat = df.at[idx, "latitude"]
    lon = df.at[idx, "longitude"]

    # Strictly BEFORE current date
    previous_mask = (
        events["event_date"] <
        current_date
    )

    previous = events[
        previous_mask
    ]

    if len(previous) == 0:

        df.at[idx, "events_last_30d"] = 0
        df.at[idx, "events_last_90d"] = 0
        df.at[idx, "events_last_365d"] = 0
        df.at[idx, "historical_event_density"] = 0
        df.at[idx, "nearest_landslide_distance_km"] = 999

        continue

    days = (
        current_date -
        previous["event_date"]
    ).dt.days

    events30 = (
        (days >= 1) &
        (days <= 30)
    ).sum()

    events90 = (
        (days >= 1) &
        (days <= 90)
    ).sum()

    events365 = (
        (days >= 1) &
        (days <= 365)
    ).sum()

    df.at[idx, "events_last_30d"] = int(
        events30
    )

    df.at[idx, "events_last_90d"] = int(
        events90
    )

    df.at[idx, "events_last_365d"] = int(
        events365
    )

    # Density within approximately 25 km
    distances = haversine_km(
        lat,
        lon,
        previous["latitude"].values,
        previous["longitude"].values
    )

    nearby = distances <= 25

    df.at[idx, "historical_event_density"] = int(
        nearby.sum()
    )

    if len(distances) > 0:

        df.at[
            idx,
            "nearest_landslide_distance_km"
        ] = float(
            np.min(distances)
        )

    else:

        df.at[
            idx,
            "nearest_landslide_distance_km"
        ] = 999


    if (idx + 1) % 250 == 0:

        print(
            f"Historical features: "
            f"{idx + 1}/{len(df)}"
        )


# =========================================================
# DATE FEATURES
# =========================================================

df["year"] = df["event_date"].dt.year
df["month"] = df["event_date"].dt.month
df["day_of_year"] = (
    df["event_date"].dt.dayofyear
)


# =========================================================
# SAVE
# =========================================================

df.to_csv(
    OUTPUT,
    index=False
)

print("\n================================")
print("FEATURE DATASET CREATED")
print("================================")

print("Rows:", len(df))

print(
    "Elevation available:",
    df["elevation_m"].notna().sum()
)

print(
    "Slope available:",
    df["slope_degrees"].notna().sum()
)

print(
    "Historical density range:",
    df["historical_event_density"].min(),
    "to",
    df["historical_event_density"].max()
)

print(
    "30-day events range:",
    df["events_last_30d"].min(),
    "to",
    df["events_last_30d"].max()
)

print(
    "90-day events range:",
    df["events_last_90d"].min(),
    "to",
    df["events_last_90d"].max()
)

print(
    "365-day events range:",
    df["events_last_365d"].min(),
    "to",
    df["events_last_365d"].max()
)

print("\nSaved:")
print(OUTPUT)