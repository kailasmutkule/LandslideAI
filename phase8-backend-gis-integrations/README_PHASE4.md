# Phase 4 — AI/ML Risk Prediction

Adds a Random Forest risk prediction service using rainfall, temperature, humidity, wind speed and pressure. Predictions are persisted in PostgreSQL.

## Important model note
The included training set is deterministic synthetic baseline data so the complete API can run immediately. It is **not a scientifically validated NER landslide model**. For the final SIH project, replace it with real labelled NER landslide/rainfall/environmental data and retrain.

## New endpoints
- `POST /api/risk/predict`
- `GET /api/risk/predictions`
- `GET /api/risk/predictions/{prediction_id}`

## Run
```bash
cd backend
python3.12 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
The model is trained automatically on first prediction if `app/ml/risk_model.joblib` is absent.
