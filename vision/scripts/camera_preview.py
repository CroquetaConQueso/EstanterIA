import cv2

# Cambia esta URL por la IP real que te da la app del móvil
CAMERA_SOURCE = "http://192.168.1.12:8080/video"
# Si quisieras webcam local del PC, sería:
# CAMERA_SOURCE = 0

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
            cv2.imwrite("data/raw/capture.png", frame)
            print("Imagen guardada en data/raw/capture.png")

        if key == ord("q"):
            break

    cap.release()
    cv2.destroyAllWindows()


if __name__ == "__main__":
    main()