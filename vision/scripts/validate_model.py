from ultralytics import YOLO

MODEL_PATH = "models/entrenados/best.pt"
DATA_YAML = "data/data.yaml"


def main():
    model = YOLO(MODEL_PATH)
    metrics = model.val(data=DATA_YAML)
    print(metrics)


if __name__ == "__main__":
    main()