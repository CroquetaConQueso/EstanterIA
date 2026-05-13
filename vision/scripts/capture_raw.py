from __future__ import annotations

import argparse
import csv
import re
import sys
from pathlib import Path

import cv2

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.config import CAMERA_SOURCE


STATE_PATTERN = re.compile(r"^[PEX](?:-[PEX]){3}$")

RAW_DIR = ROOT_DIR / "data" / "raw"


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def validate_state(state: str) -> None:
    if not STATE_PATTERN.fullmatch(state):
        raise ValueError(
            f"Estado inválido: '{state}'. Usa formato tipo P-P-P-P, E-P-P-P, P-P-X-P..."
        )


def build_filename(shelf: str, state: str, index: int) -> str:
    return f"{shelf}__{state}__{index:03d}.jpg"


def get_next_index(raw_shelf_dir: Path, shelf: str, state: str) -> int:
    existing = sorted(raw_shelf_dir.glob(f"{shelf}__{state}__*.jpg"))
    if not existing:
        return 1

    max_idx = 0
    for file in existing:
        try:
            idx = int(file.stem.split("__")[-1])
            max_idx = max(max_idx, idx)
        except ValueError:
            continue

    return max_idx + 1


def capture_frame_from_camera(camera_source: str):
    cap = cv2.VideoCapture(camera_source)
    if not cap.isOpened():
        raise RuntimeError(f"No se pudo abrir la cámara/stream: {camera_source}")

    frame = None
    try:
        # Calentamiento pequeño para streams IP
        for _ in range(8):
            ret, current = cap.read()
            if ret:
                frame = current
    finally:
        cap.release()

    if frame is None:
        raise RuntimeError("No se pudo leer ningún frame de la cámara.")

    return frame


def append_manifest_row(manifest_path: Path, row: dict) -> None:
    file_exists = manifest_path.exists()

    with manifest_path.open("a", newline="", encoding="utf-8") as csvfile:
        fieldnames = ["filename", "shelf", "scene", "s1", "s2", "s3", "s4"]
        writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

        if not file_exists:
            writer.writeheader()

        writer.writerow(row)


def main():
    parser = argparse.ArgumentParser(
        description="Captura fotos RAW desde la cámara y las guarda con nombre automático + manifest.csv"
    )
    parser.add_argument("--shelf", required=True, help="Código de estantería, ej. EST-001")
    parser.add_argument("--state", required=True, help="Estado de slots, ej. P-P-P-P, E-P-P-P, P-P-X-P")
    parser.add_argument("--count", type=int, default=1, help="Número de capturas para esta escena")
    args = parser.parse_args()

    shelf = args.shelf.strip().upper()
    state = args.state.strip().upper()
    count = args.count

    if count <= 0:
        raise ValueError("El parámetro --count debe ser mayor que 0.")

    validate_state(state)

    raw_shelf_dir = RAW_DIR / shelf
    ensure_dir(raw_shelf_dir)

    manifest_path = raw_shelf_dir / "manifest.csv"

    states = state.split("-")
    next_index = get_next_index(raw_shelf_dir, shelf, state)

    print(f"Cámara: {CAMERA_SOURCE}")
    print(f"Estantería: {shelf}")
    print(f"Escena: {state}")
    print(f"Capturas: {count}")
    print(f"Destino RAW: {raw_shelf_dir}")
    print()

    for i in range(count):
        current_index = next_index + i
        filename = build_filename(shelf, state, current_index)
        output_path = raw_shelf_dir / filename

        input(f"Prepara la escena {state} y pulsa ENTER para capturar {filename}...")

        frame = capture_frame_from_camera(CAMERA_SOURCE)
        saved = cv2.imwrite(str(output_path), frame)
        if not saved:
            raise RuntimeError(f"No se pudo guardar la imagen en: {output_path}")

        append_manifest_row(
            manifest_path,
            {
                "filename": filename,
                "shelf": shelf,
                "scene": state,
                "s1": states[0],
                "s2": states[1],
                "s3": states[2],
                "s4": states[3],
            },
        )

        print(f"Guardada: {output_path}")

    print("\nProceso completado.")
    print(f"Manifest actualizado: {manifest_path}")


if __name__ == "__main__":
    main()