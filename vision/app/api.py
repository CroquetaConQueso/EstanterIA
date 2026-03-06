from fastapi import FastAPI
from app.schemas import (
    PredictionRequest,
    PredictionResponse,
    CapturePredictRequest,
    CapturePredictionResponse,
)
from app.inference import predict_image
from app.camera import capture_image_from_camera

app = FastAPI(title="EstanterIA Vision API", version="0.1.0")


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/predict", response_model=PredictionResponse)
def predict(payload: PredictionRequest):
    return predict_image(payload.image_path)


@app.post("/capture-and-predict", response_model=CapturePredictionResponse)
def capture_and_predict(payload: CapturePredictRequest):
    capture_path = capture_image_from_camera()
    result = predict_image(str(capture_path))

    return CapturePredictionResponse(
        image_name=capture_path.name,
        image_path=str(capture_path),
        detections=result.detections,
        summary=result.summary,
    )