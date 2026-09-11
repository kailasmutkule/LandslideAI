import cdsapi
import pandas as pd
from pathlib import Path

INPUT = "data/processed/landslides_ner_historical_features.csv"
OUTPUT_DIR = Path("data/raw/soil_moisture")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

df = pd.read_csv(INPUT)
df["event_date"] = pd.to_datetime(df["event_date"])

dates = sorted(
    df["event_date"]
    .dt.strftime("%Y-%m-%d")
    .unique()
)

print(f"Landslide records: {len(df)}")
print(f"Unique dates: {len(dates)}")
print(f"First date: {dates[0]}")
print(f"Last date: {dates[-1]}")

client = cdsapi.Client()

for i, date in enumerate(dates, start=1):

    year, month, day = date.split("-")

    output_file = (
        OUTPUT_DIR
        / f"soil_moisture_{date}.nc"
    )

    if output_file.exists():
        print(
            f"[{i}/{len(dates)}] "
            f"{date} already downloaded"
        )
        continue

    print(
        f"\n[{i}/{len(dates)}] "
        f"Downloading {date}..."
    )

    request = {
        "variable": [
            "volumetric_soil_water_layer_1"
        ],
        "year": [year],
        "month": [month],
        "day": [day],
        "time": [
            "00:00",
            "01:00",
            "02:00",
            "03:00",
            "04:00",
            "05:00",
            "06:00",
            "07:00",
            "08:00",
            "09:00",
            "10:00",
            "11:00",
            "12:00",
            "13:00",
            "14:00",
            "15:00",
            "16:00",
            "17:00",
            "18:00",
            "19:00",
            "20:00",
            "21:00",
            "22:00",
            "23:00"
        ],
        "data_format": "netcdf",
        "download_format": "unarchived",
    }

    try:

        client.retrieve(
            "reanalysis-era5-land",
            request,
            str(output_file)
        )

        print(
            f"Downloaded: {output_file}"
        )

    except Exception as e:

        print(
            f"ERROR for {date}: {e}"
        )

print("\nDownload process completed.")