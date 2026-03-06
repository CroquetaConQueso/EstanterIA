from pathlib import Path
import cv2

from app.config import CAMERA_SOURCE, RAW_DIR
from app.file_naming import get_next_capture_path


def capture_image_from_camera() -> Path:
    cap = cv2.VideoCapture(CAMERA_SOURCE)

    if not cap.isOpened():
        raise RuntimeError(f"No se pudo abrir la cámara: {CAMERA_SOURCE}")

    ret, frame = cap.read()
    cap.release()

    if not ret or frame is None:
        raise RuntimeError("No se pudo capturar un frame desde la cámara")

    capture_path = get_next_capture_path(RAW_DIR)
    cv2.imwrite(str(capture_path), frame)

    return capture_path