import os
import re
import glob
import numpy as np
import pandas as pd
import xarray as xr

INPUT = "data/processed/landslides_ner_training_features.csv"
OUTPUT = "data/processed/landslides_ner_training_features_rainfall.csv"
GPM_DIR = "data/raw/gpm"

print("=" * 70)
print("POPULATING RAINFALL FEATURES FROM EXISTING GPM FILES")
print("=" * 70)

df = pd.read_csv(INPUT)
df["event_date"] = pd.to_datetime(df["event_date"])

print(f"Training rows: {len(df)}")
print(f"Unique dates: {df['event_date'].dt.date.nunique()}")

# ---------------------------------------------------------
# GPM files
# ---------------------------------------------------------
files = glob.glob(os.path.join(GPM_DIR, "*.nc4"))

pattern = re.compile(r"3IMERG\.(\d{8})-")

gpm_files = {}

for path in files:
    name = os.path.basename(path)
    match = pattern.search(name)

    if match:
        date = pd.to_datetime(
            match.group(1),
            format="%Y%m%d"
        ).date()

        gpm_files[date] = path

print(f"GPM files found: {len(files)}")
print(f"Recognized GPM dates: {len(gpm_files)}")

# ---------------------------------------------------------
# Cache
# ---------------------------------------------------------
cache = {}


def load_gpm(date):
    """
    Load one GPM file and return:
        latitudes
        longitudes
        rainfall grid
    """

    if date not in gpm_files:
        return None

    if date in cache:
        return cache[date]

    path = gpm_files[date]

    print(f"Loading GPM: {date}")

    try:
        ds = xr.open_dataset(path)

        # Find precipitation variable
        var_name = None

        for name in [
            "precipitationCal",
            "precipitation",
            "precipitationUncal"
        ]:
            if name in ds.variables:
                var_name = name
                break

        if var_name is None:
            print("WARNING: precipitation variable not found")
            ds.close()
            cache[date] = None
            return None

        da = ds[var_name]

        # Find latitude / longitude coordinate names
        lat_name = None
        lon_name = None

        for name in da.coords:
            lower = name.lower()

            if lower in ["lat", "latitude"]:
                lat_name = name

            elif lower in ["lon", "longitude"]:
                lon_name = name

        if lat_name is None or lon_name is None:
            print("WARNING: latitude/longitude not found")
            print("Coordinates:", list(da.coords))
            ds.close()
            cache[date] = None
            return None

        # -------------------------------------------------
        # IMPORTANT:
        # Select using xarray coordinates rather than
        # manually assuming array axis order.
        # -------------------------------------------------

        # Reduce time / other dimensions
        for dim in list(da.dims):
            if dim not in [lat_name, lon_name]:
                da = da.isel({dim: 0})

        da = da.transpose(lat_name, lon_name)

        lats = da[lat_name].values
        lons = da[lon_name].values
        rainfall = da.values

        print(
            f"  Grid shape: {rainfall.shape} | "
            f"Lat: {len(lats)} | Lon: {len(lons)}"
        )

        cache[date] = (
            lats,
            lons,
            rainfall
        )

        ds.close()

        return cache[date]

    except Exception as e:
        print(f"ERROR loading {date}: {e}")
        cache[date] = None
        return None


def get_rainfall(date, lat, lon):

    date = pd.Timestamp(date).date()

    data = load_gpm(date)

    if data is None:
        return np.nan

    lats, lons, rainfall = data

    try:

        # Normalize longitude if necessary
        if lon < 0 and np.min(lons) >= 0:
            lon = lon % 360

        # Nearest grid point
        lat_idx = int(np.abs(lats - lat).argmin())
        lon_idx = int(np.abs(lons - lon).argmin())

        # Safety check
        if lat_idx >= rainfall.shape[0]:
            return np.nan

        if lon_idx >= rainfall.shape[1]:
            return np.nan

        value = rainfall[lat_idx, lon_idx]

        value = float(value)

        if not np.isfinite(value):
            return np.nan

        return value

    except Exception as e:
        print(f"ERROR extracting {date}: {e}")
        return np.nan


# ---------------------------------------------------------
# Calculate rainfall
# ---------------------------------------------------------

results = []

unique_dates = (
    df["event_date"]
    .dropna()
    .sort_values()
    .unique()
)

print()
print(f"Processing {len(unique_dates)} unique event dates...")
print()

for i, event_date in enumerate(unique_dates, start=1):

    event_date = pd.Timestamp(event_date)

    print(
        f"[{i}/{len(unique_dates)}] "
        f"{event_date.date()}"
    )

    rows = df[df["event_date"] == event_date]

    for idx in rows.index:

        lat = df.loc[idx, "latitude"]
        lon = df.loc[idx, "longitude"]

        if pd.isna(lat) or pd.isna(lon):
            continue

        # ---------------------------------------------
        # 1-day
        # ---------------------------------------------

        r1 = get_rainfall(
            event_date,
            lat,
            lon
        )

        # ---------------------------------------------
        # 3 / 7 / 30 day windows
        #
        # Only calculate a window when ALL required
        # daily GPM observations exist.
        #
        # This prevents us from pretending sparse data
        # is a complete rainfall history.
        # ---------------------------------------------

        window_results = {}

        for days in [3, 7, 30]:

            values = []
            complete = True

            for offset in range(days):

                d = (
                    event_date -
                    pd.Timedelta(days=offset)
                )

                d_date = d.date()

                if d_date not in gpm_files:
                    complete = False
                    break

                r = get_rainfall(
                    d,
                    lat,
                    lon
                )

                if not np.isfinite(r):
                    complete = False
                    break

                values.append(r)

            if complete and len(values) == days:
                window_results[days] = float(
                    np.sum(values)
                )
            else:
                window_results[days] = np.nan

        results.append({
            "index": idx,
            "rainfall_1d_new": r1,
            "rainfall_3d_new": window_results[3],
            "rainfall_7d_new": window_results[7],
            "rainfall_30d_new": window_results[30],
        })


# ---------------------------------------------------------
# Apply results
# ---------------------------------------------------------

res = pd.DataFrame(results)

if not res.empty:

    res = res.set_index("index")

    for old, new in [
        ("rainfall_1d", "rainfall_1d_new"),
        ("rainfall_3d", "rainfall_3d_new"),
        ("rainfall_7d", "rainfall_7d_new"),
        ("rainfall_30d", "rainfall_30d_new"),
    ]:

        if old not in df.columns:
            df[old] = np.nan

        df.loc[res.index, old] = (
            res[new].combine_first(
                df.loc[res.index, old]
            )
        )

# ---------------------------------------------------------
# Availability flags
# ---------------------------------------------------------

for col in [
    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "rainfall_30d"
]:

    df[col + "_available"] = (
        df[col].notna().astype(int)
    )


# ---------------------------------------------------------
# Save
# ---------------------------------------------------------

df.to_csv(
    OUTPUT,
    index=False
)

print()
print("=" * 70)
print("RAINFALL PROCESSING COMPLETE")
print("=" * 70)

print(f"Output: {OUTPUT}")
print(f"Rows: {len(df)}")

print()
print("Rainfall availability:")

for col in [
    "rainfall_1d",
    "rainfall_3d",
    "rainfall_7d",
    "rainfall_30d"
]:

    available = df[col].notna().sum()

    print(
        f"{col:15s}: "
        f"{available:4d} / {len(df)} "
        f"({available / len(df) * 100:.1f}%)"
    )