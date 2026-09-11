from pathlib import Path
import pandas as pd
import numpy as np
import xarray as xr
import re

INPUT_FILE = Path("data/processed/landslides_ner_training_terrain.csv")
OUTPUT_FILE = Path("data/processed/landslides_ner_training_complete.csv")
GPM_DIR = Path("data/raw/gpm")

df = pd.read_csv(INPUT_FILE)

print("Training records:", len(df))

# ---------------------------------------------------------
# Build date -> GPM file mapping
# ---------------------------------------------------------

gpm_files = {}

for file in GPM_DIR.glob("*.nc4"):

    match = re.search(r"\.(\d{8})-", file.name)

    if match:
        date = pd.to_datetime(
            match.group(1),
            format="%Y%m%d"
        ).date()

        gpm_files[date] = file

print("GPM files found:", len(gpm_files))

# ---------------------------------------------------------
# Cache opened GPM files
# ---------------------------------------------------------

dataset_cache = {}

def get_dataset(date):

    if date in dataset_cache:
        return dataset_cache[date]

    file = gpm_files.get(date)

    if file is None:
        return None

    print("Opening:", file.name)

    ds = xr.open_dataset(
        file,
        engine="netcdf4"
    )

    dataset_cache[date] = ds

    return ds


# ---------------------------------------------------------
# Find rainfall variable
# ---------------------------------------------------------

def get_rainfall_variable(ds):

    candidates = [
        "precipitationCal",
        "precipitation",
        "precipitationCal_cnt"
    ]

    for name in candidates:
        if name in ds.variables:
            return name

    # fallback: find a variable containing precipitation
    for name in ds.data_vars:
        if "precip" in name.lower():
            return name

    return None


# ---------------------------------------------------------
# Extract nearest GPM grid rainfall
# ---------------------------------------------------------

def extract_rainfall(ds, lat, lon):

    variable = get_rainfall_variable(ds)

    if variable is None:
        return np.nan

    da = ds[variable]

    # Remove singleton dimensions if present
    da = da.squeeze()

    # Find latitude / longitude coordinate names
    lat_name = None
    lon_name = None

    for name in da.coords:

        lower = name.lower()

        if lower in ["lat", "latitude"]:
            lat_name = name

        if lower in ["lon", "longitude"]:
            lon_name = name

    if lat_name is None or lon_name is None:
        return np.nan

    try:

        point = da.sel(
            {
                lat_name: lat,
                lon_name: lon
            },
            method="nearest"
        )

        value = point.values

        # If any dimensions remain, average them
        if np.ndim(value) > 0:
            value = np.nanmean(value)

        value = float(value)

        if not np.isfinite(value):
            return np.nan

        return value

    except Exception as e:

        print("Extraction error:", e)

        return np.nan


# ---------------------------------------------------------
# Process rainfall
# ---------------------------------------------------------

df["event_date"] = pd.to_datetime(
    df["event_date"]
).dt.date

available = 0
missing = 0

for idx in df.index:

    date = df.at[idx, "event_date"]

    lat = df.at[idx, "latitude"]
    lon = df.at[idx, "longitude"]

    ds = get_dataset(date)

    if ds is None:

        missing += 1
        continue

    rainfall = extract_rainfall(
        ds,
        lat,
        lon
    )

    if np.isfinite(rainfall):

        df.at[idx, "rainfall_1d"] = rainfall
        available += 1

    else:

        missing += 1

    if (idx + 1) % 100 == 0:

        print(
            f"Processed {idx + 1}/{len(df)} | "
            f"Rainfall available: {available}"
        )

        df.to_csv(
            OUTPUT_FILE,
            index=False
        )


# ---------------------------------------------------------
# Final save
# ---------------------------------------------------------

df.to_csv(
    OUTPUT_FILE,
    index=False
)

for ds in dataset_cache.values():
    ds.close()

print("\n================================")
print("RAINFALL EXTRACTION COMPLETE")
print("================================")

print("Rows:", len(df))
print("Rainfall available:", df["rainfall_1d"].notna().sum())
print("Rainfall missing:", df["rainfall_1d"].isna().sum())

print("\nOutput:")
print(OUTPUT_FILE)