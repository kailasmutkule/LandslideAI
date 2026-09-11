from pathlib import Path
import pandas as pd
import numpy as np

INPUT = Path("data/processed/landslides_ner_training_complete.csv")
OUTPUT = Path("data/processed/landslides_ner_training_final.csv")

df = pd.read_csv(INPUT)

print("Initial rows:", len(df))

# ---------------------------------------------------------
# 1. Remove columns that are identifiers / text descriptions
# ---------------------------------------------------------

DROP_COLUMNS = [
    "slide_no",
    "slide_name",
    "nh_sh_location",
    "material",
    "movement_type",
    "history",
]

df = df.drop(columns=DROP_COLUMNS, errors="ignore")


# ---------------------------------------------------------
# 2. Date features
# ---------------------------------------------------------

df["event_date"] = pd.to_datetime(
    df["event_date"],
    errors="coerce"
)

df["year"] = df["event_date"].dt.year
df["month"] = df["event_date"].dt.month
df["day_of_year"] = df["event_date"].dt.dayofyear


# ---------------------------------------------------------
# 3. Rainfall missing indicators
# ---------------------------------------------------------

for col in [
    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "rainfall_30d"
]:

    df[f"{col}_available"] = (
        df[col].notna().astype(int)
    )


# ---------------------------------------------------------
# 4. Rainfall imputation
#
# IMPORTANT:
# Missing rainfall is NOT treated as zero.
# Use median values and retain availability flags.
# ---------------------------------------------------------

rainfall_columns = [
    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "rainfall_30d"
]

for col in rainfall_columns:

    median = df[col].median()

    print(
        f"{col}: median used for missing values = {median:.2f}"
    )

    df[col] = df[col].fillna(median)


# ---------------------------------------------------------
# 5. Terrain
# ---------------------------------------------------------

for col in [
    "elevation_m",
    "slope_degrees"
]:

    median = df[col].median()

    print(
        f"{col}: median used for missing values = {median:.2f}"
    )

    df[col] = df[col].fillna(median)


# ---------------------------------------------------------
# 6. Historical features
#
# Existing historical values are retained for positives.
# Negative samples currently have missing historical
# distance, so calculate reasonable values.
# ---------------------------------------------------------

historical_columns = [
    "historical_event_density",
    "events_last_30d",
    "events_last_90d",
    "events_last_365d"
]

for col in historical_columns:

    df[col] = pd.to_numeric(
        df[col],
        errors="coerce"
    )

    df[col] = df[col].fillna(0)


# nearest distance:
# If no previous landslide is known, use a large distance.
#
# Use the 99th percentile instead of infinity because
# tree-based models work better with finite values.

distance = pd.to_numeric(
    df["nearest_landslide_distance_km"],
    errors="coerce"
)

distance_fill = distance.dropna().quantile(0.99)

print(
    "Nearest distance fill value:",
    round(distance_fill, 2)
)

df["nearest_landslide_distance_km"] = (
    distance.fillna(distance_fill)
)


# ---------------------------------------------------------
# 7. State encoding
# ---------------------------------------------------------

df["state"] = df["state"].fillna("Unknown")

state_codes = {
    state: i
    for i, state in enumerate(
        sorted(df["state"].unique())
    )
}

df["state_code"] = df["state"].map(state_codes)


# ---------------------------------------------------------
# 8. Remove event_date after extracting features
# ---------------------------------------------------------

df = df.drop(columns=["event_date"])


# ---------------------------------------------------------
# 9. Remove remaining non-numeric columns
# ---------------------------------------------------------

df = df.drop(
    columns=["state", "district"],
    errors="ignore"
)


# ---------------------------------------------------------
# 10. Safety check
# ---------------------------------------------------------

print("\nMissing values before final save:")

missing = df.isna().sum()

print(
    missing[missing > 0]
)


# Any remaining numeric NaN gets median filled

for col in df.columns:

    if df[col].isna().any():

        if pd.api.types.is_numeric_dtype(df[col]):

            df[col] = df[col].fillna(
                df[col].median()
            )


# ---------------------------------------------------------
# 11. Shuffle
# ---------------------------------------------------------

df = df.sample(
    frac=1,
    random_state=42
).reset_index(drop=True)


# ---------------------------------------------------------
# 12. Save
# ---------------------------------------------------------

df.to_csv(
    OUTPUT,
    index=False
)

print("\n================================")
print("FINAL TRAINING DATASET CREATED")
print("================================")

print("Rows:", len(df))
print("Columns:", len(df.columns))

print("\nTarget distribution:")
print(df["landslide"].value_counts())

print("\nFinal columns:")
print(df.columns.tolist())

print("\nFinal missing values:")
print(df.isna().sum().sum())

print("\nSaved:")
print(OUTPUT)