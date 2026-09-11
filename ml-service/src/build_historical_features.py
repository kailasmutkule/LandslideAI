import pandas as pd
import numpy as np
from math import radians, sin, cos, sqrt, atan2

INPUT = "data/processed/landslides_ner_rainfall_features.csv"
OUTPUT = "data/processed/landslides_ner_historical_features.csv"

print("Loading landslide data...")

df = pd.read_csv(INPUT)

df["event_date"] = pd.to_datetime(df["event_date"], errors="coerce")

df = df.dropna(
    subset=["latitude", "longitude", "event_date"]
).copy()

df = df.sort_values("event_date").reset_index(drop=True)

print(f"Records: {len(df)}")


def haversine_km(lat1, lon1, lat2, lon2):

    R = 6371.0

    lat1 = radians(lat1)
    lat2 = radians(lat2)

    dlat = lat2 - lat1
    dlon = radians(lon2) - radians(lon1)

    a = (
        sin(dlat / 2) ** 2
        + cos(lat1)
        * cos(lat2)
        * sin(dlon / 2) ** 2
    )

    return 2 * R * atan2(
        sqrt(a),
        sqrt(1 - a)
    )


event_dates = df["event_date"].values

historical_density = []
events_30d = []
events_90d = []
events_365d = []
nearest_distance = []

print("Building historical features...")

for i, row in df.iterrows():

    current_date = row["event_date"]

    previous = df.iloc[:i]

    if len(previous) == 0:

        historical_density.append(0)
        events_30d.append(0)
        events_90d.append(0)
        events_365d.append(0)
        nearest_distance.append(np.nan)

        continue

    delta_days = (
        current_date - previous["event_date"]
    ).dt.days

    count_30 = (
        (delta_days >= 0)
        & (delta_days <= 30)
    ).sum()

    count_90 = (
        (delta_days >= 0)
        & (delta_days <= 90)
    ).sum()

    count_365 = (
        (delta_days >= 0)
        & (delta_days <= 365)
    ).sum()

    historical_density.append(
        len(previous)
    )

    events_30d.append(int(count_30))
    events_90d.append(int(count_90))
    events_365d.append(int(count_365))

    distances = []

    for _, old in previous.iterrows():

        distance = haversine_km(
            row["latitude"],
            row["longitude"],
            old["latitude"],
            old["longitude"]
        )

        distances.append(distance)

    nearest_distance.append(
        min(distances)
        if distances
        else np.nan
    )

    if (i + 1) % 100 == 0:

        print(
            f"Processed {i + 1}/{len(df)}"
        )


df["historical_event_density"] = historical_density

df["events_last_30d"] = events_30d

df["events_last_90d"] = events_90d

df["events_last_365d"] = events_365d

df["nearest_landslide_distance_km"] = nearest_distance


df.to_csv(
    OUTPUT,
    index=False
)

print()
print("Historical features completed.")
print(f"Output: {OUTPUT}")
print(f"Records: {len(df)}")

print()
print(
    df[
        [
            "historical_event_density",
            "events_last_30d",
            "events_last_90d",
            "events_last_365d",
            "nearest_landslide_distance_km"
        ]
    ].describe().round(2)
)