from pathlib import Path
import numpy as np
import pandas as pd

INPUT_FILE = Path("data/processed/landslides_ner_historical_features.csv")
OUTPUT_FILE = Path("data/processed/landslides_ner_training.csv")

RANDOM_SEED = 42

# ------------------------------------------------------------
# Load positive landslide records
# ------------------------------------------------------------

df = pd.read_csv(INPUT_FILE)
df["event_date"] = pd.to_datetime(df["event_date"])

positive = df.copy()
positive["landslide"] = 1

print("Positive samples:", len(positive))

# ------------------------------------------------------------
# Region bounds from actual landslide data
# ------------------------------------------------------------

lat_min = positive["latitude"].min()
lat_max = positive["latitude"].max()
lon_min = positive["longitude"].min()
lon_max = positive["longitude"].max()

print(f"Latitude range:  {lat_min:.4f} -> {lat_max:.4f}")
print(f"Longitude range: {lon_min:.4f} -> {lon_max:.4f}")

# ------------------------------------------------------------
# Known landslide coordinate/date combinations
# ------------------------------------------------------------

known_events = set(
    zip(
        positive["latitude"].round(3),
        positive["longitude"].round(3),
        positive["event_date"].dt.date
    )
)

# ------------------------------------------------------------
# Generate negative samples
# ------------------------------------------------------------

rng = np.random.default_rng(RANDOM_SEED)

negative_rows = []

target_negative = len(positive)

attempts = 0
max_attempts = target_negative * 100

while len(negative_rows) < target_negative and attempts < max_attempts:

    attempts += 1

    lat = rng.uniform(lat_min, lat_max)
    lon = rng.uniform(lon_min, lon_max)

    # Pick an actual historical event date
    date = positive.iloc[
        rng.integers(0, len(positive))
    ]["event_date"]

    key = (
        round(lat, 3),
        round(lon, 3),
        date.date()
    )

    # Don't accidentally create a known event
    if key in known_events:
        continue

    negative_rows.append({
        "slide_no": np.nan,
        "state": "BACKGROUND",
        "district": "BACKGROUND",
        "slide_name": "Non-landslide background sample",
        "nh_sh_location": np.nan,
        "latitude": lat,
        "longitude": lon,
        "material": np.nan,
        "movement_type": np.nan,
        "history": np.nan,
        "event_date": date,
        "landslide": 0,
        "elevation_m": np.nan,
        "slope_degrees": np.nan,
        "rainfall_1d": np.nan,
        "rainfall_3d": np.nan,
        "rainfall_7d": np.nan,
        "rainfall_30d": np.nan,
        "historical_event_density": 0,
        "events_last_30d": 0,
        "events_last_90d": 0,
        "events_last_365d": 0,
        "nearest_landslide_distance_km": np.nan
    })

negative = pd.DataFrame(negative_rows)

print("Negative samples:", len(negative))

# ------------------------------------------------------------
# Combine
# ------------------------------------------------------------

training = pd.concat(
    [positive, negative],
    ignore_index=True
)

training = training.sample(
    frac=1,
    random_state=RANDOM_SEED
).reset_index(drop=True)

# ------------------------------------------------------------
# Save
# ------------------------------------------------------------

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)

training.to_csv(
    OUTPUT_FILE,
    index=False
)

print("\nTraining dataset created:")
print(OUTPUT_FILE)

print("\nTarget distribution:")
print(training["landslide"].value_counts())

print("\nTotal rows:", len(training))