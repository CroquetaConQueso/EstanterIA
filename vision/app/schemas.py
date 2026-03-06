from pydantic import BaseModel
from typing import List, Dict, Optional


class PredictionRequest(BaseModel):
    image_path: str


class CapturePredictRequest(BaseModel):
    estanteriaCodigo: Optional[str] = None


class DetectionItem(BaseModel):
    class_name: str
    confidence: float
    bbox: List[float]


class PredictionResponse(BaseModel):
    image_path: str
    detections: List[DetectionItem]
    summary: Dict[str, int]
    annotated_image_path: Optional[str] = None


class CapturePredictionResponse(BaseModel):
    image_name: str
    image_path: str
    detections: List[DetectionItem]
    summary: Dict[str, int]