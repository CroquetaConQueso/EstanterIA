from collections import Counter
from pathlib import Path
from ultralytics import YOLO

from app.config import MODEL_PATH, CONFIDENCE_THRESHOLD, TARGET_CLASSES
from app.schemas import DetectionItem, PredictionResponse


_model = None


def get_model() -> YOLO:
    global _model
    if _model is None:
        _model = YOLO(MODEL_PATH)
    return _model


def predict_image(image_path: str, save_annotated: bool = False) -> PredictionResponse:
    model = get_model()

    results = model.predict(
        source=image_path,
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

    # Para mantener consistencia, garantizamos siempre las clases del MVP
    summary = {class_name: counter.get(class_name, 0) for class_name in TARGET_CLASSES}

    # Si el modelo preentrenado devuelve clases que no son las tuyas, también las añadimos.
    for detected_class, count in counter.items():
        if detected_class not in summary:
            summary[detected_class] = count

    annotated_image_path = None

    return PredictionResponse(
        image_path=image_path,
        detections=detections,
        summary=summary,
        annotated_image_path=annotated_image_path
    )