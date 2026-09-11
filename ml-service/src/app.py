from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import pickle
from pathlib import Path
from datetime import datetime


# ============================================================
# APP
# ============================================================

app = FastAPI(
    title="LandslideAI ML Service",
    description="AI-powered landslide risk prediction service",
    version="2.0.0"
)


# ============================================================
# PATHS
# ============================================================

MODEL_PATH = Path("models/landslide_xgb_temporal.pkl")

HISTORICAL_DATA_PATH = Path(
    "data/processed/landslides_ner_dated.csv"
)


# ============================================================
# MODEL
# ============================================================

with open(MODEL_PATH, "rb") as f:
    model_bundle = pickle.load(f)

model = model_bundle["model"]

print("Temporal XGBoost model loaded successfully.")
print(f"Model expects {model.n_features_in_} features.")


# ============================================================
# HISTORICAL DATA
# ============================================================

historical_df = pd.read_csv(HISTORICAL_DATA_PATH)

historical_df["event_date"] = pd.to_datetime(
    historical_df["event_date"]
)

historical_df = historical_df.dropna(
    subset=["latitude", "longitude", "event_date"]
).copy()

print(
    f"Historical landslide records loaded: "
    f"{len(historical_df)}"
)


# ============================================================
# REQUEST
# ============================================================

class PredictionRequest(BaseModel):

    latitude: float
    longitude: float

    rainfall_1d: float = 0.0
    rainfall_3d: float = 0.0
    rainfall_7d: float = 0.0
    rainfall_30d: float = 0.0

    rainfall_1d_available: int = 0
    rainfall_3d_available: int = 0
    rainfall_7d_available: int = 0
    rainfall_30d_available: int = 0

    elevation_m: float = 0.0
    slope_degrees: float = 0.0

    event_date: str


# ============================================================
# DISTANCE CALCULATION
# ============================================================

def haversine_distance_km(
    lat1,
    lon1,
    lat2,
    lon2
):

    import numpy as np

    lat1 = np.radians(lat1)
    lon1 = np.radians(lon1)

    lat2 = np.radians(lat2)
    lon2 = np.radians(lon2)

    dlat = lat2 - lat1
    dlon = lon2 - lon1

    a = (
        np.sin(dlat / 2) ** 2
        +
        np.cos(lat1)
        * np.cos(lat2)
        * np.sin(dlon / 2) ** 2
    )

    c = 2 * np.arcsin(np.sqrt(a))

    return 6371.0 * c


# ============================================================
# HISTORICAL FEATURES
# ============================================================

def calculate_historical_features(
    latitude,
    longitude,
    event_date
):

    previous = historical_df[
        historical_df["event_date"] < event_date
    ].copy()

    if len(previous) == 0:

        return {
            "historical_event_density": 0.0,
            "events_last_30d": 0,
            "events_last_90d": 0,
            "events_last_365d": 0,
            "nearest_landslide_distance_km": 100.0
        }

    days_difference = (
        event_date - previous["event_date"]
    ).dt.days

    distances = haversine_distance_km(
        latitude,
        longitude,
        previous["latitude"].values,
        previous["longitude"].values
    )

    # Events within 25 km
    nearby = distances <= 25

    historical_event_density = int(
        nearby.sum()
    )

    events_last_30d = int(
        ((days_difference > 0) &
         (days_difference <= 30) &
         nearby).sum()
    )

    events_last_90d = int(
        ((days_difference > 0) &
         (days_difference <= 90) &
         nearby).sum()
    )

    events_last_365d = int(
        ((days_difference > 0) &
         (days_difference <= 365) &
         nearby).sum()
    )

    if len(distances) > 0:

        nearest_distance = float(
            distances.min()
        )

    else:

        nearest_distance = 100.0

    return {
        "historical_event_density":
            historical_event_density,

        "events_last_30d":
            events_last_30d,

        "events_last_90d":
            events_last_90d,

        "events_last_365d":
            events_last_365d,

        "nearest_landslide_distance_km":
            min(nearest_distance, 100.0)
    }


# ============================================================
# HEALTH CHECK
# ============================================================

@app.get("/")
def root():

    return {
        "service": "LandslideAI ML Service",
        "status": "running",
        "model": "XGBoost Temporal",
        "features": model.n_features_in_
    }


# ============================================================
# PREDICTION
# ============================================================

@app.post("/predict")
def predict(request: PredictionRequest):

    date = datetime.strptime(
        request.event_date,
        "%Y-%m-%d"
    )

    year = date.year
    month = date.month

    day_of_year = (
        date.timetuple().tm_yday
    )

    event_timestamp = pd.Timestamp(
        request.event_date
    )

    # --------------------------------------------------------
    # HISTORICAL FEATURES
    # --------------------------------------------------------

    historical_features = (
        calculate_historical_features(
            request.latitude,
            request.longitude,
            event_timestamp
        )
    )

    # --------------------------------------------------------
    # MODEL FEATURES
    # EXACT ORDER USED DURING TRAINING
    # --------------------------------------------------------

    features = pd.DataFrame([{

        "latitude":
            request.latitude,

        "longitude":
            request.longitude,

        "elevation_m":
            request.elevation_m,

        "slope_degrees":
            request.slope_degrees,

        "rainfall_1d":
            request.rainfall_1d,

        "rainfall_3d":
            request.rainfall_3d,

        "rainfall_7d":
            request.rainfall_7d,

        "rainfall_30d":
            request.rainfall_30d,

        "historical_event_density":
            historical_features[
                "historical_event_density"
            ],

        "events_last_30d":
            historical_features[
                "events_last_30d"
            ],

        "events_last_90d":
            historical_features[
                "events_last_90d"
            ],

        "events_last_365d":
            historical_features[
                "events_last_365d"
            ],

        "nearest_landslide_distance_km":
            historical_features[
                "nearest_landslide_distance_km"
            ],

        "year":
            year,

        "month":
            month,

        "day_of_year":
            day_of_year,

        "rainfall_1d_available":
            request.rainfall_1d_available,

        "rainfall_3d_available":
            request.rainfall_3d_available,

        "rainfall_7d_available":
            request.rainfall_7d_available,

        "rainfall_30d_available":
            request.rainfall_30d_available
    }])

    # --------------------------------------------------------
    # SAFETY CHECK
    # --------------------------------------------------------

    expected_features = model.get_booster().feature_names

    if expected_features:

        features = features[
            expected_features
        ]

    # --------------------------------------------------------
    # PREDICTION
    # --------------------------------------------------------

    probability = float(
        model.predict_proba(features)[0][1]
    )

    risk_score = probability * 100

    # --------------------------------------------------------
    # RISK LEVEL
    # --------------------------------------------------------

    if risk_score >= 70:

        risk_level = "HIGH"

    elif risk_score >= 40:

        risk_level = "MEDIUM"

    else:

        risk_level = "LOW"

    prediction = int(
        risk_score >= 50
    )

    # --------------------------------------------------------
    # RESPONSE
    # --------------------------------------------------------

    return {

        "prediction":
            prediction,

        "risk_score":
            round(risk_score, 2),

        "risk_level":
            risk_level,

        "model":
            "xgboost-temporal",

        "location": {

            "latitude":
                request.latitude,

            "longitude":
                request.longitude
        },

        "rainfall": {

            "rainfall_1d":
                request.rainfall_1d,

            "rainfall_3d":
                request.rainfall_3d,

            "rainfall_7d":
                request.rainfall_7d,

            "rainfall_30d":
                request.rainfall_30d
        },

        "terrain": {

            "elevation_m":
                request.elevation_m,

            "slope_degrees":
                request.slope_degrees
        },

        "historical": historical_features,

        "date":
            request.event_date
    }