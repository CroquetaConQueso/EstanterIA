from __future__ import annotations

import argparse
import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from ultralytics import YOLO


def main():
    parser = argparse.ArgumentParser(
        description="Entrena un clasificador de slots (ocupado/vacio/anomalia)."
    )
    parser.add_argument(
        "--data",
        default=str(ROOT_DIR / "data" / "dataset" / "slot-classification-v1"),
        help="Ruta raíz del dataset de clasificación",
    )
    parser.add_argument(
        "--model",
        default="yolo11n-cls.pt",
        help="Modelo base de clasificación de Ultralytics",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=15,
        help="Número de epochs",
    )
    parser.add_argument(
        "--imgsz",
        type=int,
        default=224,
        help="Tamaño de imagen para entrenamiento",
    )
    parser.add_argument(
        "--batch",
        type=int,
        default=16,
        help="Batch size",
    )
    parser.add_argument(
        "--project",
        default=str(ROOT_DIR / "runs" / "slot_classification"),
        help="Carpeta raíz de resultados",
    )
    parser.add_argument(
        "--name",
        default="est001_v1",
        help="Nombre del experimento",
    )
    args = parser.parse_args()

    data_path = Path(args.data)
    if not data_path.exists():
        raise FileNotFoundError(f"No existe el dataset: {data_path}")

    for split in ["train", "val", "test"]:
        split_path = data_path / split
        if not split_path.exists():
            raise FileNotFoundError(f"Falta el split requerido: {split_path}")

    print("=== Entrenamiento de clasificación por slot ===")
    print(f"Dataset: {data_path}")
    print(f"Modelo base: {args.model}")
    print(f"Epochs: {args.epochs}")
    print(f"Image size: {args.imgsz}")
    print(f"Batch: {args.batch}")
    print(f"Salida: {args.project} / {args.name}")
    print()

    model = YOLO(args.model)

    model.train(
        data=str(data_path),
        epochs=args.epochs,
        imgsz=args.imgsz,
        batch=args.batch,
        project=args.project,
        name=args.name,
        pretrained=True,
        verbose=True,
    )

    print("\n=== Validación sobre split 'val' ===")
    model.val(
        data=str(data_path),
        split="val",
        imgsz=args.imgsz,
        batch=args.batch,
        project=args.project,
        name=f"{args.name}_val",
    )

    print("\n=== Validación sobre split 'test' ===")
    model.val(
        data=str(data_path),
        split="test",
        imgsz=args.imgsz,
        batch=args.batch,
        project=args.project,
        name=f"{args.name}_test",
    )

    print("\nEntrenamiento y validación completados.")


if __name__ == "__main__":
    main()