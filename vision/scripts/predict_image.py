import argparse
from app.inference import predict_image


def main():
    parser = argparse.ArgumentParser(description="Predicción simple sobre una imagen")
    parser.add_argument("--image", required=True, help="Ruta de la imagen a procesar")
    parser.add_argument(
        "--save",
        action="store_true",
        help="Guardar imagen anotada si el modelo lo permite"
    )

    args = parser.parse_args()

    result = predict_image(args.image, save_annotated=args.save)
    print(result.model_dump_json(indent=2))


if __name__ == "__main__":
    main()