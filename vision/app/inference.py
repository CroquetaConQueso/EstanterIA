from pathlib import Path
from datetime import datetime, timezone

import cv2
from ultralytics import YOLO

from app.config import (
    CAPTURES_PUBLIC_PATH,
    CONFIDENCE_THRESHOLD,
    MODEL_PATH,
    MODEL_VERSION,
    RAW_DIR,
    ROI_HEIGHT,
    ROI_WIDTH,
    ROI_X,
    ROI_Y,
    SLOT_CLASS_MAP,
)
from app.schemas import (
    ImagenVisualResponse,
    PredictionResponse,
    ResumenVisualResponse,
    SlotVisualResponse,
)


_model = None


def get_model() -> YOLO:
    global _model
    if _model is None:
        _model = YOLO(MODEL_PATH)
    return _model


def crop_with_roi(image, x: int, y: int, width: int, height: int):
    img_height, img_width = image.shape[:2]

    if width <= 0 or height <= 0:
        return image

    x = max(0, x)
    y = max(0, y)
    x2 = min(img_width, x + width)
    y2 = min(img_height, y + height)

    if x2 <= x or y2 <= y:
        return image

    return image[y:y2, x:x2]


def split_roi_into_slots(roi_image, total_slots: int = 4):
    height, width = roi_image.shape[:2]
    slot_width = width // total_slots
    slots = []

    for index in range(total_slots):
        x1 = index * slot_width
        x2 = width if index == total_slots - 1 else (index + 1) * slot_width
        slots.append(roi_image[0:height, x1:x2])

    return slots


def normalize_class_name(class_name: str) -> str:
    return class_name.strip().lower().replace("-", "_").replace(" ", "_")


def map_class_to_estado_visual(class_name: str) -> str:
    normalized = normalize_class_name(class_name)
    return SLOT_CLASS_MAP.get(normalized, "ANOMALIA")


def classify_slot(model: YOLO, slot_image, orden: int) -> SlotVisualResponse:
    results = model.predict(
        source=slot_image,
        conf=CONFIDENCE_THRESHOLD,
        verbose=False,
    )
    result = results[0]

    if result.probs is None:
        return SlotVisualResponse(
            slotId=f"slot_{orden}",
            orden=orden,
            estadoVisual="ANOMALIA",
            confianza=0.0,
        )

    class_id = int(result.probs.top1)
    class_name = result.names[class_id]
    confidence = float(result.probs.top1conf.item())

    return SlotVisualResponse(
        slotId=f"slot_{orden}",
        orden=orden,
        estadoVisual=map_class_to_estado_visual(class_name),
        confianza=round(confidence, 4),
    )


def calculate_estado_general(vacios: int, anomalias: int) -> str:
    if vacios == 0 and anomalias == 0:
        return "OK"
    if vacios > 0 and anomalias == 0:
        return "HUECOS_VACIOS"
    if vacios == 0 and anomalias > 0:
        return "ANOMALIAS"
    return "MIXTO"


def build_resumen(slots: list[SlotVisualResponse]) -> ResumenVisualResponse:
    ocupados = sum(1 for slot in slots if slot.estadoVisual == "OCUPADO")
    vacios = sum(1 for slot in slots if slot.estadoVisual == "VACIO")
    anomalias = sum(1 for slot in slots if slot.estadoVisual == "ANOMALIA")

    return ResumenVisualResponse(
        estadoGeneralVisual=calculate_estado_general(vacios, anomalias),
        slotsTotales=len(slots),
        ocupados=ocupados,
        vacios=vacios,
        anomalias=anomalias,
        hayHuecosVacios=vacios > 0,
        hayAnomalias=anomalias > 0,
    )


def predict_image(
    image_path: str,
    estanteria_codigo: str = "EST-001",
    save_annotated: bool = False,
) -> PredictionResponse:
    model = get_model()
    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(f"No se pudo leer la imagen: {image_path}")

    roi_image = crop_with_roi(
        image,
        ROI_X,
        ROI_Y,
        ROI_WIDTH,
        ROI_HEIGHT,
    )

    slot_images = split_roi_into_slots(roi_image, total_slots=4)
    slots = [
        classify_slot(model, slot_image, index + 1)
        for index, slot_image in enumerate(slot_images)
    ]
    resumen = build_resumen(slots)

    image_name = Path(image_path).name
    capture_relative_path = get_capture_relative_path(image_path)
    public_path = f"{CAPTURES_PUBLIC_PATH.rstrip('/')}/{capture_relative_path}"
    captured_at = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")

    return PredictionResponse(
        estanteriaCodigo=estanteria_codigo,
        modeloVersion=MODEL_VERSION,
        capturadaEn=captured_at,
        imagen=ImagenVisualResponse(
            nombreArchivo=image_name,
            ruta=public_path,
        ),
        resumen=resumen,
        slots=slots,
    )


def get_capture_relative_path(image_path: str) -> str:
    try:
        raw_dir = RAW_DIR.resolve()
        image_resolved = Path(image_path).resolve()
        return image_resolved.relative_to(raw_dir).as_posix()
    except ValueError:
        return Path(image_path).name
