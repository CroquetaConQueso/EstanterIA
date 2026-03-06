from fastapi import FastAPI
from app.schemas import PredictionRequest, PredictionResponse
from app.inference import predict_image

app = FastAPI(title="EstanterIA Vision API", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest):
    return predict_image(payload.image_path)