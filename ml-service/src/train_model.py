import pandas as pd
import numpy as np
import joblib
from pathlib import Path

from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
)
from xgboost import XGBClassifier

# --------------------------------------------------
# PATHS
# --------------------------------------------------

INPUT = Path("data/processed/landslide_ml_dataset.csv")
MODEL_DIR = Path("models")
MODEL_PATH = MODEL_DIR / "landslide_xgb_model.pkl"

# --------------------------------------------------
# LOAD DATA
# --------------------------------------------------

print("Loading ML dataset...")

df = pd.read_csv(INPUT)

print(f"Dataset shape: {df.shape}")

# --------------------------------------------------
# FEATURES
# --------------------------------------------------

FEATURES = [
    "latitude",
    "longitude",
    "rainfall_1d",
    "rainfall_available",
    "year",
    "month",
    "day_of_year",
    "historical_event_density",
]

X = df[FEATURES]
y = df["label"]

print("\nFeatures:")
print(FEATURES)

print("\nClass distribution:")
print(y.value_counts())

# --------------------------------------------------
# TRAIN / TEST SPLIT
# --------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y,
)

print("\nTraining samples:", len(X_train))
print("Testing samples :", len(X_test))

# --------------------------------------------------
# XGBOOST MODEL
# --------------------------------------------------

print("\nTraining XGBoost model...")

model = XGBClassifier(
    n_estimators=200,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="binary:logistic",
    eval_metric="logloss",
    random_state=42,
)

model.fit(X_train, y_train)

print("Training completed.")

# --------------------------------------------------
# PREDICTION
# --------------------------------------------------

y_pred = model.predict(X_test)
y_prob = model.predict_proba(X_test)[:, 1]

# --------------------------------------------------
# EVALUATION
# --------------------------------------------------

accuracy = accuracy_score(y_test, y_pred)
precision = precision_score(y_test, y_pred)
recall = recall_score(y_test, y_pred)
f1 = f1_score(y_test, y_pred)
auc = roc_auc_score(y_test, y_prob)

print("\n==============================")
print("MODEL PERFORMANCE")
print("==============================")

print(f"Accuracy : {accuracy:.4f}")
print(f"Precision: {precision:.4f}")
print(f"Recall   : {recall:.4f}")
print(f"F1 Score : {f1:.4f}")
print(f"ROC-AUC  : {auc:.4f}")

print("\nClassification Report:")
print(classification_report(y_test, y_pred))

# --------------------------------------------------
# FEATURE IMPORTANCE
# --------------------------------------------------

importance = pd.DataFrame({
    "feature": FEATURES,
    "importance": model.feature_importances_,
}).sort_values(
    "importance",
    ascending=False
)

print("\nFeature Importance:")
print(importance.to_string(index=False))

# --------------------------------------------------
# SAVE MODEL
# --------------------------------------------------

MODEL_DIR.mkdir(parents=True, exist_ok=True)

joblib.dump(model, MODEL_PATH)

print("\n==============================")
print("MODEL SAVED")
print("==============================")
print(f"Path: {MODEL_PATH}")