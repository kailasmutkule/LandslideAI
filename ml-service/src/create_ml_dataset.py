import pandas as pd
import numpy as np
from pathlib import Path

INPUT = Path("data/processed/landslides_ner_rainfall.csv")
OUTPUT = Path("data/processed/landslide_ml_dataset.csv")

print("Loading landslide data...")
df = pd.read_csv(INPUT)

df["event_date"] = pd.to_datetime(df["event_date"], errors="coerce")

# Keep valid coordinates
df = df.dropna(subset=["latitude", "longitude", "event_date"]).copy()

print(f"Positive landslide records: {len(df)}")

# --------------------------------------------------
# POSITIVE SAMPLES
# --------------------------------------------------

positive = df[
    [
        "latitude",
        "longitude",
        "event_date",
        "rainfall_1d",
        "state",
        "district",
    ]
].copy()

positive["label"] = 1

# --------------------------------------------------
# CREATE NEGATIVE / BACKGROUND SAMPLES
# --------------------------------------------------
# We generate locations inside the observed NER
# coordinate range and dates from the historical period.
#
# These are NOT claimed to be confirmed "safe" locations.
# They are background samples for an MVP classifier.

rng = np.random.default_rng(42)

n_negative = len(positive)

lat_min = positive["latitude"].min()
lat_max = positive["latitude"].max()
lon_min = positive["longitude"].min()
lon_max = positive["longitude"].max()

date_min = positive["event_date"].min()
date_max = positive["event_date"].max()

negative = pd.DataFrame({
    "latitude": rng.uniform(lat_min, lat_max, n_negative),
    "longitude": rng.uniform(lon_min, lon_max, n_negative),
    "event_date": pd.to_datetime(
        rng.integers(
            date_min.value // 10**9,
            date_max.value // 10**9,
            n_negative
        ),
        unit="s"
    ),
})

negative["rainfall_1d"] = np.nan
negative["state"] = "BACKGROUND"
negative["district"] = "BACKGROUND"
negative["label"] = 0

# --------------------------------------------------
# FEATURE ENGINEERING
# --------------------------------------------------

combined = pd.concat(
    [
        positive,
        negative
    ],
    ignore_index=True
)

combined["year"] = combined["event_date"].dt.year
combined["month"] = combined["event_date"].dt.month
combined["day_of_year"] = combined["event_date"].dt.dayofyear

# Historical spatial density
# Divide NER into approximately 0.1 degree cells
combined["lat_grid"] = np.floor(combined["latitude"] * 10) / 10
combined["lon_grid"] = np.floor(combined["longitude"] * 10) / 10

grid_counts = (
    positive.assign(
        lat_grid=np.floor(positive["latitude"] * 10) / 10,
        lon_grid=np.floor(positive["longitude"] * 10) / 10,
    )
    .groupby(["lat_grid", "lon_grid"])
    .size()
    .rename("historical_event_density")
    .reset_index()
)

combined = combined.merge(
    grid_counts,
    on=["lat_grid", "lon_grid"],
    how="left"
)

combined["historical_event_density"] = (
    combined["historical_event_density"]
    .fillna(0)
)

# Rainfall availability indicator
combined["rainfall_available"] = (
    combined["rainfall_1d"].notna().astype(int)
)

# Fill missing rainfall with median of available
rainfall_median = combined["rainfall_1d"].median()

combined["rainfall_1d"] = (
    combined["rainfall_1d"]
    .fillna(rainfall_median)
)

# Remove temporary grid columns
combined = combined.drop(
    columns=["lat_grid", "lon_grid"]
)

# --------------------------------------------------
# SAVE
# --------------------------------------------------

OUTPUT.parent.mkdir(parents=True, exist_ok=True)

combined.to_csv(OUTPUT, index=False)

print("\nML dataset created successfully!")
print("--------------------------------")
print(f"Output: {OUTPUT}")
print(f"Total rows: {len(combined)}")
print(f"Positive samples: {(combined['label'] == 1).sum()}")
print(f"Negative samples: {(combined['label'] == 0).sum()}")
print(
    f"Rainfall available: "
    f"{combined['rainfall_available'].sum()}"
)

print("\nFeatures:")
print(
    combined[
        [
            "latitude",
            "longitude",
            "rainfall_1d",
            "rainfall_available",
            "year",
            "month",
            "day_of_year",
            "historical_event_density",
            "label",
        ]
    ].head()
)