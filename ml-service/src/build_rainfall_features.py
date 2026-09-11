from pathlib import Path
import re

import numpy as np
import pandas as pd
import xarray as xr


GPM_DIR = Path("data/raw/gpm")
INPUT = Path("data/processed/landslides_ner_terrain.csv")
OUTPUT = Path("data/processed/landslides_ner_rainfall_features.csv")


def get_date(path):
    match = re.search(r"3IMERG\.(\d{8})-", path.name)

    if match:
        return pd.to_datetime(
            match.group(1),
            format="%Y%m%d"
        )

    return None


def find_rainfall_variable(ds):

    # Prefer the standard IMERG precipitation variable.
    candidates = [
        "precipitationCal",
        "precipitation",
        "precipitationUncal",
    ]

    for name in candidates:
        if name in ds.data_vars:
            return name

    # Fallback: find a variable containing precipitation.
    for name in ds.data_vars:
        if "precip" in name.lower():
            return name

    raise ValueError(
        "Could not find precipitation variable. "
        f"Available variables: {list(ds.data_vars)}"
    )


def find_coordinate(ds, names):

    for name in names:
        if name in ds.coords:
            return name

        if name in ds.variables:
            return name

    return None


def extract_file(path):

    date = get_date(path)

    if date is None:
        return None

    print(f"Reading {path.name}")

    ds = xr.open_dataset(path)

    variable = find_rainfall_variable(ds)

    lat_name = find_coordinate(
        ds,
        ["lat", "latitude"]
    )

    lon_name = find_coordinate(
        ds,
        ["lon", "longitude"]
    )

    if lat_name is None or lon_name is None:
        raise ValueError(
            f"Could not identify coordinates in {path.name}"
        )

    data = ds[variable]

    # Remove time dimension if present.
    if "time" in data.dims:
        data = data.isel(time=0)

    return {
        "date": date,
        "lat": ds[lat_name].values,
        "lon": ds[lon_name].values,
        "rainfall": data.values,
    }


def nearest_value(latitudes, longitudes, rainfall, lat, lon):

    latitudes = np.asarray(latitudes)
    longitudes = np.asarray(longitudes)
    rainfall = np.asarray(rainfall)

    lat_index = int(
        np.abs(latitudes - lat).argmin()
    )

    lon_index = int(
        np.abs(longitudes - lon).argmin()
    )

    # GPM data can have either:
    # (lat, lon)
    # or
    # (lon, lat)
    #
    # Detect the orientation from the array shape.

    if rainfall.shape == (
        len(latitudes),
        len(longitudes),
    ):

        value = rainfall[
            lat_index,
            lon_index
        ]

    elif rainfall.shape == (
        len(longitudes),
        len(latitudes),
    ):

        value = rainfall[
            lon_index,
            lat_index
        ]


    else:

        raise ValueError(
            "Unexpected rainfall shape: "
            f"{rainfall.shape}; "
            f"lat={len(latitudes)}, "
            f"lon={len(longitudes)}"
        )

    if np.ma.is_masked(value):
        return np.nan

    value = float(value)

    if not np.isfinite(value):
        return np.nan

    return value

def main():

    print("=" * 70)
    print("GPM RAINFALL FEATURE EXTRACTION")
    print("=" * 70)

    df = pd.read_csv(INPUT)

    df["event_date"] = pd.to_datetime(
        df["event_date"]
    )

    gpm_files = sorted(
        GPM_DIR.glob("*.nc4")
    )

    print(f"Landslide records: {len(df)}")
    print(f"GPM files: {len(gpm_files)}")

    rainfall_records = []

    for path in gpm_files:

        try:

            result = extract_file(path)

            if result is None:
                continue

            rainfall_records.append(result)

        except Exception as e:

            print(
                f"ERROR: {path.name}: {e}"
            )

    print(
        f"Successfully read: "
        f"{len(rainfall_records)} GPM files"
    )

    if not rainfall_records:
        raise RuntimeError(
            "No GPM files could be read."
        )

    # Build rainfall table.
    rows = []

    for i, event in df.iterrows():

        lat = float(event["latitude"])
        lon = float(event["longitude"])
        date = event["event_date"]

        daily_values = {}

        for rainfall_data in rainfall_records:

            gpm_date = rainfall_data["date"]

            if gpm_date <= date:

                value = nearest_value(
                    rainfall_data["lat"],
                    rainfall_data["lon"],
                    rainfall_data["rainfall"],
                    lat,
                    lon,
                )

                daily_values[gpm_date] = value

        def accumulation(days):

            values = []

            for d in range(days):

                target_date = (
                    date -
                    pd.Timedelta(days=d)
                )

                if target_date in daily_values:

                    value = daily_values[
                        target_date
                    ]

                    if pd.notna(value):
                        values.append(value)

            # Only return an accumulation when
            # all required days are available.
            if len(values) != days:
                return np.nan

            return float(sum(values))

        rainfall_1d = accumulation(1)
        rainfall_3d = accumulation(3)
        rainfall_7d = accumulation(7)
        rainfall_30d = accumulation(30)

        rows.append(
            {
                "rainfall_1d": rainfall_1d,
                "rainfall_3d": rainfall_3d,
                "rainfall_7d": rainfall_7d,
                "rainfall_30d": rainfall_30d,
            }
        )

        if (i + 1) % 100 == 0:
            print(
                f"Processed: {i + 1}/{len(df)}"
            )

    rainfall_df = pd.DataFrame(rows)

    output = pd.concat(
        [
            df.reset_index(drop=True),
            rainfall_df,
        ],
        axis=1,
    )

    output.to_csv(
        OUTPUT,
        index=False
    )

    print("\n" + "=" * 70)
    print("RAINFALL FEATURE EXTRACTION COMPLETE")
    print("=" * 70)

    print("Output:", OUTPUT)

    print(
        "\nAvailable values:"
    )

    print(
        output[
            [
                "rainfall_1d",
                "rainfall_3d",
                "rainfall_7d",
                "rainfall_30d",
            ]
        ].notna().sum()
    )

    print(
        "\nMissing values:"
    )

    print(
        output[
            [
                "rainfall_1d",
                "rainfall_3d",
                "rainfall_7d",
                "rainfall_30d",
            ]
        ].isna().sum()
    )


if __name__ == "__main__":
    main()