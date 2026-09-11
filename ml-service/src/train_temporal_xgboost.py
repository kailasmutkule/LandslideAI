from pathlib import Path

import pandas as pd
import numpy as np
import joblib

from xgboost import XGBClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    classification_report,
    confusion_matrix
)

DATA = Path(
    "data/processed/landslides_ner_training_features.csv"
)

MODEL = Path(
    "models/landslide_xgb_temporal.pkl"
)

df = pd.read_csv(DATA)

df["event_date"] = pd.to_datetime(
    df["event_date"]
)

print("Total rows:", len(df))
print("Date range:", df.event_date.min(), "to", df.event_date.max())

print("\nTarget:")
print(df.landslide.value_counts())

# =========================================================
# REMOVE COLUMNS NOT USED BY MODEL
# =========================================================

drop_columns = [
    "landslide",
    "event_date",
    "state",
    "district",
    "slide_no",
    "slide_name",
    "nh_sh_location",
    "material",
    "movement_type",
    "history"
]

features = [
    col for col in df.columns
    if col not in drop_columns
]

X = df[features].copy()
y = df["landslide"]

# Ensure numeric
X = X.apply(
    pd.to_numeric,
    errors="coerce"
)

# Fill remaining NaN using training-safe median later
# First create temporal split.

# =========================================================
# TEMPORAL SPLIT
# =========================================================
#
# TRAIN:      <= 2023
# VALIDATION: 2024-2025
# TEST:       2026
#
# =========================================================

train_mask = df["event_date"].dt.year <= 2023

validation_mask = (
    (df["event_date"].dt.year >= 2024) &
    (df["event_date"].dt.year <= 2025)
)

test_mask = (
    df["event_date"].dt.year == 2026
)

X_train = X[train_mask].copy()
y_train = y[train_mask].copy()

X_val = X[validation_mask].copy()
y_val = y[validation_mask].copy()

X_test = X[test_mask].copy()
y_test = y[test_mask].copy()

print("\n==============================")
print("TEMPORAL SPLIT")
print("==============================")

print("Train:", len(X_train))
print("Validation:", len(X_val))
print("Test:", len(X_test))

print("\nTrain target:")
print(y_train.value_counts())

print("\nValidation target:")
print(y_val.value_counts())

print("\nTest target:")
print(y_test.value_counts())

# =========================================================
# MEDIAN IMPUTATION
# =========================================================

train_medians = X_train.median()

X_train = X_train.fillna(train_medians)
X_val = X_val.fillna(train_medians)
X_test = X_test.fillna(train_medians)

# =========================================================
# MODEL
# =========================================================

model = XGBClassifier(
    n_estimators=300,
    max_depth=5,
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

# =========================================================
# EVALUATION FUNCTION
# =========================================================

def evaluate(name, X_data, y_data):

    if len(X_data) == 0:
        print(f"\n{name}: NO DATA")
        return

    predictions = model.predict(X_data)

    probabilities = model.predict_proba(
        X_data
    )[:, 1]

    print("\n==============================")
    print(name)
    print("==============================")

    print(
        "Accuracy:",
        round(
            accuracy_score(y_data, predictions),
            4
        )
    )

    print(
        "Precision:",
        round(
            precision_score(
                y_data,
                predictions,
                zero_division=0
            ),
            4
        )
    )

    print(
        "Recall:",
        round(
            recall_score(
                y_data,
                predictions,
                zero_division=0
            ),
            4
        )
    )

    print(
        "F1:",
        round(
            f1_score(
                y_data,
                predictions,
                zero_division=0
            ),
            4
        )
    )

    if y_data.nunique() == 2:

        print(
            "ROC-AUC:",
            round(
                roc_auc_score(
                    y_data,
                    probabilities
                ),
                4
            )
        )

    print("\nClassification report:")
    print(
        classification_report(
            y_data,
            predictions,
            digits=4,
            zero_division=0
        )
    )

    print("Confusion matrix:")
    print(
        confusion_matrix(
            y_data,
            predictions
        )
    )


# =========================================================
# EVALUATE
# =========================================================

evaluate(
    "VALIDATION 2024-2025",
    X_val,
    y_val
)

evaluate(
    "TEST 2026",
    X_test,
    y_test
)

# =========================================================
# FEATURE IMPORTANCE
# =========================================================

importance = pd.Series(
    model.feature_importances_,
    index=features
).sort_values(
    ascending=False
)

print("\n==============================")
print("FEATURE IMPORTANCE")
print("==============================")

print(
    importance.head(20).round(4)
)

# =========================================================
# SAVE MODEL + FEATURE LIST
# =========================================================

MODEL.parent.mkdir(
    parents=True,
    exist_ok=True
)

joblib.dump(
    {
        "model": model,
        "features": features,
        "train_medians": train_medians.to_dict()
    },
    MODEL
)

print("\n==============================")
print("MODEL SAVED")
print("==============================")

print(MODEL)
print("Features:", len(features))