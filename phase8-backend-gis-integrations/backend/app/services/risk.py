from pathlib import Path
import joblib
import numpy as np
from app.ml.train_model import MODEL_PATH, train_and_save

_model = None

def get_model():
    global _model
    if _model is None:
        if not MODEL_PATH.exists():
            train_and_save()
        _model = joblib.load(MODEL_PATH)
    return _model

def predict(features):
    values = np.array([[features.rainfall_24h_mm, features.temperature_c, features.humidity_pct, features.wind_speed_kmh, features.pressure_hpa]], dtype=float)
    model = get_model()
    level = str(model.predict(values)[0])
    probabilities = model.predict_proba(values)[0]
    classes = list(model.named_steps["classifier"].classes_)
    score = float(sum(probabilities[i] * {"LOW": .15, "MEDIUM": .40, "HIGH": .70, "CRITICAL": .95}[c] for i, c in enumerate(classes)))
    return round(score * 100, 2), level
