import os
import time
import pandas as pd
import cdsapi

INPUT = "data/processed/landslides_ner_training_features.csv"
OUT_DIR = "data/raw/soil_moisture_ner"

os.makedirs(OUT_DIR, exist_ok=True)

# Load training dates
df = pd.read_csv(INPUT)
df["event_date"] = pd.to_datetime(df["event_date"])

dates = sorted(df["event_date"].dt.date.unique())

print(f"Training rows: {len(df)}")
print(f"Unique dates: {len(dates)}")
print(f"First date: {dates[0]}")
print(f"Last date: {dates[-1]}")

client = cdsapi.Client()

for i, date in enumerate(dates, 1):

    year = str(date.year)
    month = f"{date.month:02d}"
    day = f"{date.day:02d}"

    output = os.path.join(
        OUT_DIR,
        f"soil_moisture_{date}.nc"
    )

    if os.path.exists(output):
        print(f"[{i}/{len(dates)}] Already exists: {date}")
        continue

    print(f"\n[{i}/{len(dates)}] Downloading {date}...")

    request = {
        "variable": [
            "volumetric_soil_water_layer_1"
        ],
        "year": [year],
        "month": [month],
        "day": [day],
        "time": ["12:00"],
        "area": [30, 88, 21, 98],
        "data_format": "netcdf",
        "download_format": "unarchived"
    }

    try:
        client.retrieve(
            "reanalysis-era5-land",
            request,
            output
        )

        size_mb = os.path.getsize(output) / (1024 * 1024)

        print(
            f"SUCCESS: {date} "
            f"({size_mb:.2f} MB)"
        )

    except Exception as e:
        print(f"FAILED: {date}")
        print(e)

        if os.path.exists(output):
            os.remove(output)

        print("Waiting 10 seconds before continuing...")
        time.sleep(10)

print("\n================================")
print("SOIL MOISTURE DOWNLOAD COMPLETE")
print("================================")