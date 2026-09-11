from pathlib import Path
import pandas as pd
import numpy as np

INPUT = Path("data/processed/landslides_ner_training_terrain.csv")
OUTPUT = Path("data/processed/landslides_ner_training_proper.csv")

df = pd.read_csv(INPUT)

df["event_date"] = pd.to_datetime(df["event_date"])

# ---------------------------------------------------------
# POSITIVE EVENTS
# ---------------------------------------------------------

positive = df[df["landslide"] == 1].copy()

print("Positive events:", len(positive))

# ---------------------------------------------------------
# CREATE MATCHED NEGATIVES
#
# For every real landslide:
# - same date
# - nearby location
# - random spatial offset
#
# This prevents the model from learning that negatives
# simply have different dates/conditions.
# ---------------------------------------------------------

rng = np.random.default_rng(42)

negatives = []

positive_coords = positive[
    ["latitude", "longitude", "event_date"]
].copy()

for _, row in positive.iterrows():

    lat = row["latitude"]
    lon = row["longitude"]
    date = row["event_date"]

    # Random distance approximately 5-15 km
    distance_km = rng.uniform(5, 15)

    bearing = rng.uniform(0, 2 * np.pi)

    # Approximate degree offsets
    dlat = (
        distance_km * np.cos(bearing)
    ) / 111.32

    dlon = (
        distance_km * np.sin(bearing)
    ) / (
        111.32 * np.cos(np.radians(lat))
    )

    new_lat = lat + dlat
    new_lon = lon + dlon

    # Keep inside approximate NER bounds
    if not (
        22.0 <= new_lat <= 29.0 and
        88.0 <= new_lon <= 97.0
    ):
        continue

    negatives.append({
        "state": row["state"],
        "district": row["district"],
        "latitude": new_lat,
        "longitude": new_lon,
        "event_date": date,
        "landslide": 0
    })

negative = pd.DataFrame(negatives)

print("Negative samples:", len(negative))

# ---------------------------------------------------------
# Keep only required common columns
# ---------------------------------------------------------

positive = positive[
    [
        "state",
        "district",
        "latitude",
        "longitude",
        "event_date",
        "landslide",
        "elevation_m",
        "slope_degrees",
        "rainfall_1d",
        "rainfall_3d",
        "rainfall_7d",
        "rainfall_30d",
        "historical_event_density",
        "events_last_30d",
        "events_last_90d",
        "events_last_365d",
        "nearest_landslide_distance_km"
    ]
].copy()

# Add empty feature columns to negatives.
# They will be populated in the next processing step.

for col in [
    "elevation_m",
    "slope_degrees",
    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "rainfall_30d",
    "historical_event_density",
    "events_last_30d",
    "events_last_90d",
    "events_last_365d",
    "nearest_landslide_distance_km"
]:
    negative[col] = np.nan

negative = negative[positive.columns]

# ---------------------------------------------------------
# Combine
# ---------------------------------------------------------

result = pd.concat(
    [positive, negative],
    ignore_index=True
)

result = result.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)

result.to_csv(
    OUTPUT,
    index=False
)

print("\n==============================")
print("PROPER DATASET CREATED")
print("==============================")

print("Rows:", len(result))
print("\nTarget:")
print(result["landslide"].value_counts())

print("\nOutput:")
print(OUTPUT)