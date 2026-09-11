from pathlib import Path

import pandas as pd
import numpy as np
import joblib

from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score
)

INPUT = Path("data/processed/landslides_ner_training_final.csv")
MODEL_PATH = Path("models/landslide_xgb_model.pkl")

df = pd.read_csv(INPUT)

print("Dataset:", df.shape)

# ---------------------------------------------------------
# Features / target
# ---------------------------------------------------------

X = df.drop(columns=["landslide"])
y = df["landslide"]

print("\nTarget distribution:")
print(y.value_counts())

# ---------------------------------------------------------
# Train / validation split
# ---------------------------------------------------------

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42,
    stratify=y
)

print("\nTraining samples:", len(X_train))
print("Testing samples:", len(X_test))

# ---------------------------------------------------------
# XGBoost
# ---------------------------------------------------------

model = XGBClassifier(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    objective="binary:logistic",
    eval_metric="logloss",
    random_state=42,
    n_jobs=-1
)

print("\nTraining XGBoost...")

model.fit(
    X_train,
    y_train
)

print("Training complete.")

# ---------------------------------------------------------
# Predictions
# ---------------------------------------------------------

pred = model.predict(X_test)
prob = model.predict_proba(X_test)[:, 1]

accuracy = accuracy_score(y_test, pred)
auc = roc_auc_score(y_test, prob)

print("\n==============================")
print("MODEL RESULTS")
print("==============================")

print("Accuracy:", round(accuracy, 4))
print("ROC-AUC:", round(auc, 4))

print("\nClassification Report:")
print(
    classification_report(
        y_test,
        pred,
        digits=4
    )
)

print("\nConfusion Matrix:")
print(
    confusion_matrix(
        y_test,
        pred
    )
)

# ---------------------------------------------------------
# Feature importance
# ---------------------------------------------------------

importance = pd.Series(
    model.feature_importances_,
    index=X.columns
).sort_values(
    ascending=False
)

print("\n==============================")
print("FEATURE IMPORTANCE")
print("==============================")

print(
    importance.head(20).round(4)
)

# ---------------------------------------------------------
# Save model
# ---------------------------------------------------------

MODEL_PATH.parent.mkdir(
    parents=True,
    exist_ok=True
)

joblib.dump(
    model,
    MODEL_PATH
)

print("\nModel saved:")
print(MODEL_PATH)