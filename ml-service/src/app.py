from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import joblib
from pathlib import Path
from datetime import datetime

# --------------------------------------------------
# APP
# --------------------------------------------------

app = FastAPI(
    title="LandslideAI ML Service",
    description="AI-powered landslide risk prediction service",
    version="1.0.0"
)

# --------------------------------------------------
# PATHS
# --------------------------------------------------

MODEL_PATH = Path("models/landslide_xgb_model.pkl")

DATA_PATH = Path(
    "data/processed/landslides_ner_rainfall.csv"
)

# --------------------------------------------------
# LOAD MODEL
# --------------------------------------------------

model = joblib.load(MODEL_PATH)

print("Landslide XGBoost model loaded successfully.")

# --------------------------------------------------
# LOAD HISTORICAL DATA
# --------------------------------------------------

historical_df = pd.read_csv(DATA_PATH)

historical_df = historical_df.dropna(
    subset=["latitude", "longitude"]
).copy()

print(
    f"Historical landslide records loaded: "
    f"{len(historical_df)}"
)

# --------------------------------------------------
# REQUEST SCHEMA
# --------------------------------------------------

class PredictionRequest(BaseModel):
    latitude: float
    longitude: float
    rainfall_1d: float
    event_date: str


# --------------------------------------------------
# HISTORICAL EVENT DENSITY
# --------------------------------------------------

def calculate_historical_density(latitude, longitude):

    # Same 0.1 degree grid used during training
    lat_grid = int(latitude * 10)
    lon_grid = int(longitude * 10)

    historical_lat_grid = (
        (historical_df["latitude"] * 10)
        .astype(int)
    )

    historical_lon_grid = (
        (historical_df["longitude"] * 10)
        .astype(int)
    )

    count = (
        (
            (historical_lat_grid == lat_grid)
            &
            (historical_lon_grid == lon_grid)
        )
        .sum()
    )

    return int(count)


# --------------------------------------------------
# HEALTH CHECK
# --------------------------------------------------

@app.get("/")
def root():

    return {
        "service": "LandslideAI ML Service",
        "status": "running",
        "model": "XGBoost"
    }


# --------------------------------------------------
# PREDICTION
# --------------------------------------------------

@app.post("/predict")
def predict(request: PredictionRequest):

    date = datetime.strptime(
        request.event_date,
        "%Y-%m-%d"
    )

    year = date.year
    month = date.month
    day_of_year = date.timetuple().tm_yday

    rainfall_available = 1

    # Calculate actual historical density
    historical_event_density = (
        calculate_historical_density(
            request.latitude,
            request.longitude
        )
    )

    # --------------------------------------------------
    # MODEL INPUT
    # --------------------------------------------------

    features = pd.DataFrame([{
        "latitude": request.latitude,
        "longitude": request.longitude,
        "rainfall_1d": request.rainfall_1d,
        "rainfall_available": rainfall_available,
        "year": year,
        "month": month,
        "day_of_year": day_of_year,
        "historical_event_density":
            historical_event_density
    }])

    # --------------------------------------------------
    # PREDICTION
    # --------------------------------------------------

    probability = model.predict_proba(
        features
    )[0][1]

    risk_score = float(probability * 100)

    if risk_score >= 70:

        risk_level = "HIGH"

    elif risk_score >= 40:

        risk_level = "MEDIUM"

    else:

        risk_level = "LOW"

    prediction = int(risk_score >= 50)

    # --------------------------------------------------
    # RESPONSE
    # --------------------------------------------------

    return {

        "prediction": prediction,

        "risk_score": round(
            risk_score,
            2
        ),

        "risk_level": risk_level,

        "historical_event_density":
            historical_event_density,

        "location": {

            "latitude":
                request.latitude,

            "longitude":
                request.longitude
        },

        "rainfall_1d":
            request.rainfall_1d,

        "date":
            request.event_date
    }