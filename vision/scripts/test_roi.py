import cv2

from app.config import ROI_X, ROI_Y, ROI_WIDTH, ROI_HEIGHT


IMAGE_PATH = "data/raw/estanteria_001.jpg"
OUTPUT_PATH = "resultados/predicciones/roi_preview.jpg"


def crop_with_roi(image, x: int, y: int, width: int, height: int):
    img_height, img_width = image.shape[:2]

    x = max(0, x)
    y = max(0, y)
    width = max(1, width)
    height = max(1, height)

    x2 = min(img_width, x + width)
    y2 = min(img_height, y + height)

    return image[y:y2, x:x2]


def main():
    image = cv2.imread(IMAGE_PATH)
    if image is None:
        raise ValueError(f"No se pudo leer la imagen: {IMAGE_PATH}")

    roi = crop_with_roi(image, ROI_X, ROI_Y, ROI_WIDTH, ROI_HEIGHT)
    cv2.imwrite(OUTPUT_PATH, roi)

    print(f"ROI guardada en: {OUTPUT_PATH}")


if __name__ == "__main__":
    main()