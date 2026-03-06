from collections import Counter
from pathlib import Path

import cv2
from ultralytics import YOLO

from app.config import (
    MODEL_PATH,
    CONFIDENCE_THRESHOLD,
    TARGET_CLASSES,
    ROI_X,
    ROI_Y,
    ROI_WIDTH,
    ROI_HEIGHT
)

from app.schemas import DetectionItem, PredictionResponse


_model = None


def get_model() -> YOLO:
    global _model
    if _model is None:
        _model = YOLO(MODEL_PATH)
    return _model


def crop_with_roi(image, x: int, y: int, width: int, height: int):
    img_height, img_width = image.shape[:2]

    # Evitar salirnos de la imagen
    x = max(0, x)
    y = max(0, y)

    x2 = min(img_width, x + width)
    y2 = min(img_height, y + height)

    return image[y:y2, x:x2]


def predict_image(image_path: str, save_annotated: bool = False) -> PredictionResponse:
    model = get_model()

    image = cv2.imread(image_path)

    if image is None:
        raise ValueError(f"No se pudo leer la imagen: {image_path}")

    # 🔹 Recorte de la región de interés
    roi_image = crop_with_roi(
        image,
        ROI_X,
        ROI_Y,
        ROI_WIDTH,
        ROI_HEIGHT
    )

    results = model.predict(
        source=roi_image,
        conf=CONFIDENCE_THRESHOLD,
        save=save_annotated
    )

    result = results[0]
    detections = []
    counter = Counter()

    if result.boxes is not None:
        for box in result.boxes:
            cls_id = int(box.cls[0].item())
            class_name = result.names[cls_id]
            confidence = float(box.conf[0].item())
            bbox = [float(x) for x in box.xyxy[0].tolist()]

            detections.append(
                DetectionItem(
                    class_name=class_name,
                    confidence=confidence,
                    bbox=bbox
                )
            )
            counter[class_name] += 1

    summary = {class_name: counter.get(class_name, 0) for class_name in TARGET_CLASSES}

    for detected_class, count in counter.items():
        if detected_class not in summary:
            summary[detected_class] = count

    return PredictionResponse(
        image_path=image_path,
        detections=detections,
        summary=summary,
        annotated_image_path=None
    )