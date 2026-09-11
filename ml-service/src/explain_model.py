import pickle
import pandas as pd
import shap

MODEL_PATH = "models/landslide_xgb_temporal.pkl"
DATA_PATH = "data/processed/landslides_ner_training_features.csv"

print("Loading model...")
bundle = pickle.load(open(MODEL_PATH, "rb"))
model = bundle["model"]

print("Loading dataset...")
df = pd.read_csv(DATA_PATH)

exclude = [
    "landslide",
    "event_date",
    "state",
    "district",
    "slide_no",
    "slide_name",
    "nh_sh_location",
    "material",
    "movement_type",
    "history",
]

X = df.drop(columns=[c for c in exclude if c in df.columns], errors="ignore")

# Keep exactly the columns used by the trained model
X = X.select_dtypes(include=["number"])

print("Dataset shape:", X.shape)
print("Model expects:", model.n_features_in_)
print("Columns:")
for i, col in enumerate(X.columns):
    print(i, col)

print("\nCreating SHAP explainer...")

explainer = shap.TreeExplainer(model)
shap_values = explainer.shap_values(X)

print("SHAP calculation complete.")

importance = pd.DataFrame({
    "feature": X.columns,
    "mean_abs_shap": abs(shap_values).mean(axis=0)
})

importance = importance.sort_values(
    "mean_abs_shap",
    ascending=False
)

print("\nFEATURE IMPORTANCE BY SHAP:")
print(importance.to_string(index=False))

importance.to_csv(
    "data/processed/shap_feature_importance.csv",
    index=False
)

print("\nSaved:")
print("data/processed/shap_feature_importance.csv")