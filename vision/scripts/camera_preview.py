import cv2

from app.config import CAMERA_SOURCE, RAW_DIR
from app.file_naming import get_next_capture_path


def main():
    cap = cv2.VideoCapture(CAMERA_SOURCE)

    if not cap.isOpened():
        raise RuntimeError(f"No se pudo abrir la cámara: {CAMERA_SOURCE}")

    print("Pulsa C para capturar imagen")
    print("Pulsa Q para salir")

    while True:
        ret, frame = cap.read()

        if not ret:
            print("No se pudo leer el frame")
            break

        cv2.imshow("Phone Camera Preview", frame)

        key = cv2.waitKey(1) & 0xFF

        if key == ord("c"):
            capture_path = get_next_capture_path(RAW_DIR)
            cv2.imwrite(str(capture_path), frame)
            print(f"Imagen guardada en: {capture_path}")

        if key == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()