from ultralytics import YOLO

MODEL_BASE = "yolo11n.pt"
DATA_YAML = "data/data.yaml"


def main():
    model = YOLO(MODEL_BASE)

    model.train(
        data=DATA_YAML,
        epochs=50,
        imgsz=640,
        project="runs/train",
        name="estanteria_mvp"
    )


if __name__ == "__main__":
    main()