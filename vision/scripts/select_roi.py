import argparse
from pathlib import Path
import cv2


OUTPUT_DIR = Path("resultados/predicciones")
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


def main():
    parser = argparse.ArgumentParser(description="Seleccionar ROI manualmente sobre una imagen")
    parser.add_argument("--image", required=True, help="Ruta de la imagen")
    args = parser.parse_args()

    image_path = Path(args.image)

    if not image_path.exists():
        raise FileNotFoundError(f"No existe la imagen: {image_path}")

    image = cv2.imread(str(image_path))

    if image is None:
        raise ValueError(f"No se pudo leer la imagen: {image_path}")

    h, w = image.shape[:2]
    print(f"Imagen cargada correctamente: {image_path}")
    print(f"Resolución: {w}x{h}")

    # Ventana redimensionable
    cv2.namedWindow("Selecciona la estanteria", cv2.WINDOW_NORMAL)
    roi = cv2.selectROI("Selecciona la estanteria", image, showCrosshair=True, fromCenter=False)
    cv2.destroyAllWindows()

    x, y, roi_w, roi_h = roi

    if roi_w == 0 or roi_h == 0:
        print("No se seleccionó ninguna ROI.")
        return

    cropped = image[y:y+roi_h, x:x+roi_w]

    # Guardar recorte
    roi_preview_path = OUTPUT_DIR / "roi_preview.png"
    cv2.imwrite(str(roi_preview_path), cropped)

    # Guardar original con rectángulo dibujado
    image_with_rect = image.copy()
    cv2.rectangle(image_with_rect, (x, y), (x + roi_w, y + roi_h), (0, 255, 0), 2)

    roi_marked_path = OUTPUT_DIR / "roi_marked.png"
    cv2.imwrite(str(roi_marked_path), image_with_rect)

    print("\nROI seleccionada:")
    print(f"ROI_X = {x}")
    print(f"ROI_Y = {y}")
    print(f"ROI_WIDTH = {roi_w}")
    print(f"ROI_HEIGHT = {roi_h}")

    print(f"\nRecorte guardado en: {roi_preview_path}")
    print(f"Imagen marcada guardada en: {roi_marked_path}")


if __name__ == "__main__":
    main()