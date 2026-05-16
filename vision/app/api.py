from fastapi import FastAPI, HTTPException
from app.schemas import (
    PredictionRequest,
    PredictionResponse,
    CapturePredictRequest,
)
from app.inference import predict_image
from app.camera import capture_image_from_camera

app = FastAPI(title="EstanterIA Vision API", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest):
    try:
        return predict_image(
            payload.image_path,
            payload.estanteriaCodigo or "EST-001",
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@app.post("/capture-and-predict", response_model=PredictionResponse)
def capture_and_predict(payload: CapturePredictRequest):
    try:
        estanteria_codigo = payload.estanteriaCodigo or "EST-001"
        capture_path = capture_image_from_camera(estanteria_codigo)
        return predict_image(
            str(capture_path),
            estanteria_codigo,
        )
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
