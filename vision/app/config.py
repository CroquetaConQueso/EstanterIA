from pathlib import Path
import os

BASE_DIR = Path(__file__).resolve().parent.parent

# Para empezar, dejamos el modelo por defecto como nombre de Ultralytics.
# Si no existe localmente, Ultralytics intentará descargarlo.
MODEL_PATH = os.getenv("MODEL_PATH", "yolo11n.pt")

CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.25"))

API_HOST = os.getenv("API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("API_PORT", "8001"))

# Clases objetivo del MVP académico
TARGET_CLASSES = ["lentejas", "arroz", "comida_gato"]

# Rutas útiles
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
RESULTADOS_DIR = BASE_DIR / "resultados"
RESULTADOS_JSON_DIR = RESULTADOS_DIR / "json"
RESULTADOS_PREDICCIONES_DIR = RESULTADOS_DIR / "predicciones"
ROI_X = 80
ROI_Y = 250
ROI_WIDTH = 1200
ROI_HEIGHT = 420