from __future__ import annotations

import argparse
import csv
import random
import shutil
import sys
from collections import Counter, defaultdict
from pathlib import Path

import cv2

ROOT_DIR = Path(__file__).resolve().parents[1]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from app.config import ROI_X, ROI_Y, ROI_WIDTH, ROI_HEIGHT


RAW_DIR = ROOT_DIR / "data" / "raw"
DATASET_DIR = ROOT_DIR / "data" / "dataset" / "slot-classification-v1"

STATE_TO_CLASS = {
    "P": "ocupado",
    "E": "vacio",
    "X": "anomalia",
}

CORE_SCENES = {
    "P-P-P-P",
    "E-P-P-P",
    "P-E-P-P",
    "P-P-E-P",
    "P-P-P-E",
    "E-E-P-P",
    "P-P-E-E",
    "E-E-E-E",
    "X-P-P-P",
    "P-X-P-P",
    "P-P-X-P",
    "P-P-P-X",
    "X-X-X-X",
}


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def reset_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)
    path.mkdir(parents=True, exist_ok=True)


def crop_with_roi(image, x: int, y: int, width: int, height: int):
    img_height, img_width = image.shape[:2]

    x = max(0, x)
    y = max(0, y)
    width = max(1, width)
    height = max(1, height)

    x2 = min(img_width, x + width)
    y2 = min(img_height, y + height)

    cropped = image[y:y2, x:x2]
    if cropped.size == 0:
        raise ValueError("La ROI resultante está vacía. Revisa ROI_X, ROI_Y, ROI_WIDTH y ROI_HEIGHT.")
    return cropped


def split_roi_into_slots(roi_image):
    roi_height, roi_width = roi_image.shape[:2]
    slot_width = roi_width // 4
    slots = []

    for i in range(4):
        x1 = i * slot_width
        x2 = roi_width if i == 3 else (i + 1) * slot_width
        slot = roi_image[:, x1:x2]
        slots.append(slot)

    return slots


def load_manifest(manifest_path: Path) -> list[dict]:
    if not manifest_path.exists():
        raise FileNotFoundError(f"No existe el manifest: {manifest_path}")

    rows = []
    with manifest_path.open("r", newline="", encoding="utf-8") as csvfile:
        reader = csv.DictReader(csvfile)
        for row in reader:
            if not row.get("filename"):
                continue

            scene = row.get("scene")
            if not scene:
                scene = "-".join([row["s1"], row["s2"], row["s3"], row["s4"]])

            row["scene"] = scene
            rows.append(row)

    if not rows:
        raise ValueError("El manifest.csv está vacío.")

    return rows


def split_group(rows: list[dict], seed: int) -> dict[str, list[dict]]:
    rows = rows[:]
    rng = random.Random(seed)
    rng.shuffle(rows)

    n = len(rows)

    if n == 1:
        return {"train": rows, "val": [], "test": []}
    if n == 2:
        return {"train": [rows[0]], "val": [rows[1]], "test": []}
    if n == 3:
        return {"train": rows[:2], "val": [rows[2]], "test": []}

    val_count = max(1, round(n * 0.15))
    test_count = max(1, round(n * 0.15))

    if val_count + test_count >= n:
        val_count = 1
        test_count = 1

    train_count = n - val_count - test_count

    train_rows = rows[:train_count]
    val_rows = rows[train_count:train_count + val_count]
    test_rows = rows[train_count + val_count:]

    return {"train": train_rows, "val": val_rows, "test": test_rows}


def prepare_output_dirs(dataset_dir: Path) -> None:
    for split_name in ["train", "val", "test"]:
        for class_name in STATE_TO_CLASS.values():
            ensure_dir(dataset_dir / split_name / class_name)


def process_row(row: dict, raw_shelf_dir: Path, dataset_dir: Path, split_name: str) -> Counter:
    filename = row["filename"]
    image_path = raw_shelf_dir / filename

    if not image_path.exists():
        raise FileNotFoundError(f"No existe la imagen RAW: {image_path}")

    image = cv2.imread(str(image_path))
    if image is None:
        raise ValueError(f"No se pudo leer la imagen: {image_path}")

    roi = crop_with_roi(image, ROI_X, ROI_Y, ROI_WIDTH, ROI_HEIGHT)
    slots = split_roi_into_slots(roi)

    slot_states = [row["s1"], row["s2"], row["s3"], row["s4"]]

    counts = Counter()

    stem = Path(filename).stem
    for i, (slot_img, slot_state) in enumerate(zip(slots, slot_states), start=1):
        class_name = STATE_TO_CLASS[slot_state]
        output_name = f"{stem}__slot_{i}.jpg"
        output_path = dataset_dir / split_name / class_name / output_name

        ok = cv2.imwrite(str(output_path), slot_img)
        if not ok:
            raise RuntimeError(f"No se pudo guardar el slot en: {output_path}")

        counts[class_name] += 1

    return counts


def main():
    parser = argparse.ArgumentParser(
        description="Construye el dataset de slots a partir de RAW + manifest.csv."
    )
    parser.add_argument("--shelf", required=True, help="Código de estantería, ej. EST-001")
    parser.add_argument("--seed", type=int, default=42, help="Semilla para el split")
    parser.add_argument("--clean", action="store_true", help="Borra y reconstruye el dataset destino")
    parser.add_argument("--core-only", action="store_true", help="Usa solo las escenas del núcleo v1")
    args = parser.parse_args()

    shelf = args.shelf.strip().upper()
    raw_shelf_dir = RAW_DIR / shelf
    manifest_path = raw_shelf_dir / "manifest.csv"

    rows = load_manifest(manifest_path)

    if args.core_only:
        rows = [row for row in rows if row["scene"] in CORE_SCENES]
        if not rows:
            raise ValueError("No hay filas del core v1 en el manifest.")

    if args.clean:
        reset_dir(DATASET_DIR)
    prepare_output_dirs(DATASET_DIR)

    grouped_by_scene = defaultdict(list)
    for row in rows:
        grouped_by_scene[row["scene"]].append(row)

    split_rows = {"train": [], "val": [], "test": []}
    for scene, scene_rows in grouped_by_scene.items():
        split_result = split_group(scene_rows, args.seed)
        for split_name, rows_for_split in split_result.items():
            split_rows[split_name].extend(rows_for_split)

    summary_by_split = {
        "train": Counter(),
        "val": Counter(),
        "test": Counter(),
    }

    for split_name, rows_for_split in split_rows.items():
        for row in rows_for_split:
            counts = process_row(row, raw_shelf_dir, DATASET_DIR, split_name)
            summary_by_split[split_name].update(counts)

    print("\nDataset construido correctamente.")
    print(f"Origen RAW: {raw_shelf_dir}")
    print(f"Destino: {DATASET_DIR}")

    print("\nResumen por split:")
    for split_name in ["train", "val", "test"]:
        total = sum(summary_by_split[split_name].values())
        print(f"\n[{split_name.upper()}] total slots: {total}")
        for class_name in ["ocupado", "vacio", "anomalia"]:
            print(f" - {class_name}: {summary_by_split[split_name][class_name]}")

    print("\nEscenas incluidas:")
    for scene in sorted(grouped_by_scene.keys()):
        print(f" - {scene}: {len(grouped_by_scene[scene])} RAW")


if __name__ == "__main__":
    main()