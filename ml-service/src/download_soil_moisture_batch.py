from pathlib import Path
import pandas as pd
import cdsapi
import calendar
import time

# ============================================================
# CONFIGURATION
# ============================================================

INPUT_FILE = Path("data/processed/landslides_ner_historical_features.csv")
OUTPUT_DIR = Path("data/raw/soil_moisture_batch")

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

VARIABLE = "volumetric_soil_water_layer_1"

# ============================================================
# LOAD LANDSLIDE DATES
# ============================================================

print("Loading landslide data...")

df = pd.read_csv(INPUT_FILE)

df["event_date"] = pd.to_datetime(df["event_date"])

dates = sorted(df["event_date"].dt.date.unique())

print(f"Total landslide records: {len(df)}")
print(f"Unique event dates: {len(dates)}")
print(f"First date: {dates[0]}")
print(f"Last date: {dates[-1]}")

# ============================================================
# GROUP DATES BY YEAR
# ============================================================

dates_by_year = {}

for date in dates:
    dates_by_year.setdefault(date.year, []).append(date)

print("\nDates by year:")

for year, year_dates in dates_by_year.items():
    print(f"{year}: {len(year_dates)} dates")

# ============================================================
# CDS CLIENT
# ============================================================

print("\nConnecting to Copernicus CDS...")

client = cdsapi.Client()

print("CDS client ready.")

# ============================================================
# DOWNLOAD ONE YEAR AT A TIME
# ============================================================

for year, year_dates in dates_by_year.items():

    output_file = OUTPUT_DIR / f"soil_moisture_{year}.nc"

    # If already downloaded, skip
    if output_file.exists() and output_file.stat().st_size > 10000:
        print(f"\n[{year}] Already exists -> skipping")
        continue

    months = sorted(set(date.month for date in year_dates))
    days = sorted(set(date.day for date in year_dates))

    print("\n" + "=" * 60)
    print(f"YEAR: {year}")
    print(f"Required dates: {len(year_dates)}")
    print(f"Months: {months}")
    print("=" * 60)

    # --------------------------------------------------------
    # IMPORTANT:
    # We request only the required months/days.
    # --------------------------------------------------------

    successful = False

    for attempt in range(1, 4):

        try:

            print(f"Downloading {year} (attempt {attempt}/3)...")

            request = {
                "variable": [VARIABLE],
                "year": [str(year)],
                "month": [f"{month:02d}" for month in months],
                "day": [f"{day:02d}" for day in days],
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
                    "23:00",
                ],
                "data_format": "netcdf",
                "download_format": "unarchived",
            }

            client.retrieve(
                "reanalysis-era5-land",
                request,
                str(output_file),
            )

            print(f"SUCCESS: {output_file}")

            successful = True
            break

        except Exception as e:

            print(f"ERROR downloading {year}:")
            print(e)

            if output_file.exists():
                try:
                    output_file.unlink()
                except Exception:
                    pass

            if attempt < 3:
                print("Waiting 30 seconds before retry...")
                time.sleep(30)

    if not successful:
        print(f"FAILED: {year}")
        print("Continuing with next year...")

# ============================================================
# SUMMARY
# ============================================================

files = list(OUTPUT_DIR.glob("*.nc"))

print("\n" + "=" * 60)
print("DOWNLOAD SUMMARY")
print("=" * 60)

print(f"Batch files downloaded: {len(files)}")

for file in sorted(files):
    size_mb = file.stat().st_size / (1024 * 1024)
    print(f"{file.name}: {size_mb:.2f} MB")

print("\nFinished.")