from pathlib import Path

import pandas as pd
import joblib

from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    roc_auc_score
)

DATA = Path("data/processed/landslides_ner_training_final.csv")
MODEL = Path("models/landslide_xgb_model.pkl")

df = pd.read_csv(DATA)

model = joblib.load(MODEL)

# ---------------------------------------------------------
# IMPORTANT:
# The final dataset was shuffled before saving.
# Recreate a deterministic split by using the original
# event information is not possible here because date was
# removed.
#
# Therefore this is a model sanity check, not a true
# temporal validation.
# ---------------------------------------------------------

X = df.drop(columns=["landslide"])
y = df["landslide"]

# Use the last 20% of the current deterministic dataset
split = int(len(df) * 0.8)

X_train = X.iloc[:split]
y_train = y.iloc[:split]

X_test = X.iloc[split:]
y_test = y.iloc[split:]

pred = model.predict(X_test)
prob = model.predict_proba(X_test)[:, 1]

print("\n==============================")
print("MODEL VALIDATION")
print("==============================")

print("Test samples:", len(X_test))

print(
    "Accuracy:",
    round(accuracy_score(y_test, pred), 4)
)

print(
    "ROC-AUC:",
    round(roc_auc_score(y_test, prob), 4)
)

print("\nClassification report:")
print(
    classification_report(
        y_test,
        pred,
        digits=4
    )
)

print("\nConfusion matrix:")
print(
    confusion_matrix(
        y_test,
        pred
    )
)