import os
import pandas as pd
import cdsapi
from datetime import timedelta

INPUT = "data/processed/landslides_ner_training_features.csv"
OUT_DIR = "data/raw/soil_moisture_ner"
os.makedirs(OUT_DIR, exist_ok=True)

df = pd.read_csv(INPUT)
df["event_date"] = pd.to_datetime(df["event_date"])

dates = sorted(df["event_date"].dt.date.unique())

client = cdsapi.Client()

# Download dates in groups of 10
for i in range(0, len(dates), 10):

    batch = dates[i:i+10]

    print(f"\nBATCH {i//10 + 1}")
    print(f"Dates: {batch[0]} -> {batch[-1]}")

    # Group by year/month because CDS requests require this structure
    groups = {}

    for d in batch:
        key = (d.year, d.month)
        groups.setdefault(key, []).append(d.day)

    for (year, month), days in groups.items():

        existing = []

        for day in days:
            path = os.path.join(
                OUT_DIR,
                f"soil_moisture_{year}-{month:02d}-{day:02d}.nc"
            )

            if os.path.exists(path):
                existing.append(day)

        days_to_download = [
            d for d in days if d not in existing
        ]

        if not days_to_download:
            print(f"{year}-{month:02d}: already downloaded")
            continue

        print(
            f"Downloading {year}-{month:02d}: "
            f"{days_to_download}"
        )

        temp = os.path.join(
            OUT_DIR,
            f"batch_{year}_{month:02d}.nc"
        )

        request = {
            "variable": [
                "volumetric_soil_water_layer_1"
            ],
            "year": [str(year)],
            "month": [f"{month:02d}"],
            "day": [f"{d:02d}" for d in days_to_download],
            "time": ["12:00"],
            "area": [30, 88, 21, 98],
            "data_format": "netcdf",
            "download_format": "unarchived"
        }

        client.retrieve(
            "reanalysis-era5-land",
            request,
            temp
        )

        print(f"Downloaded: {temp}")

print("\nSOIL MOISTURE DOWNLOAD COMPLETE")