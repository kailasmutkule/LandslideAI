"""Train a deterministic demo risk classifier until real NER-labelled data is available."""
from pathlib import Path
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import StandardScaler
import joblib

FEATURES = ["rainfall_24h_mm", "temperature_c", "humidity_pct", "wind_speed_kmh", "pressure_hpa"]
MODEL_PATH = Path(__file__).resolve().parent / "risk_model.joblib"

def build_training_data(n=6000, seed=42):
    rng = np.random.default_rng(seed)
    rain = rng.uniform(0, 500, n)
    temp = rng.uniform(8, 38, n)
    humidity = rng.uniform(35, 100, n)
    wind = rng.uniform(0, 100, n)
    pressure = rng.uniform(900, 1030, n)
    score = (
        0.55 * np.clip(rain / 250, 0, 1) +
        0.20 * np.clip((humidity - 50) / 50, 0, 1) +
        0.10 * np.clip(wind / 80, 0, 1) +
        0.10 * np.clip((1015 - pressure) / 80, 0, 1) +
        0.05 * np.clip(abs(temp - 22) / 20, 0, 1)
    )
    # Four classes: intentionally a baseline/demo until labelled NER data is supplied.
    y = np.select([score < .20, score < .45, score < .70], ["LOW", "MEDIUM", "HIGH"], default="CRITICAL")
    X = np.column_stack([rain, temp, humidity, wind, pressure])
    return X, y

def train_and_save():
    X, y = build_training_data()
    model = Pipeline([
        ("scaler", StandardScaler()),
        ("classifier", RandomForestClassifier(n_estimators=250, random_state=42, class_weight="balanced")),
    ])
    model.fit(X, y)
    joblib.dump(model, MODEL_PATH)
    return model

if __name__ == "__main__":
    train_and_save()
    print(f"Saved model to {MODEL_PATH}")
