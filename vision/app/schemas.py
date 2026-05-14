from pydantic import AliasChoices, BaseModel, Field
from typing import List, Optional


class PredictionRequest(BaseModel):
    image_path: str = Field(validation_alias=AliasChoices("imagePath", "image_path"))
    estanteriaCodigo: Optional[str] = None


class CapturePredictRequest(BaseModel):
    estanteriaCodigo: Optional[str] = None


class ImagenVisualResponse(BaseModel):
    nombreArchivo: str
    ruta: str


class ResumenVisualResponse(BaseModel):
    estadoGeneralVisual: str
    slotsTotales: int
    ocupados: int
    vacios: int
    anomalias: int
    hayHuecosVacios: bool
    hayAnomalias: bool


class SlotVisualResponse(BaseModel):
    slotId: str
    orden: int
    estadoVisual: str
    confianza: float


class PredictionResponse(BaseModel):
    estanteriaCodigo: str
    modeloVersion: str
    capturadaEn: str
    imagen: ImagenVisualResponse
    resumen: ResumenVisualResponse
    slots: List[SlotVisualResponse]
