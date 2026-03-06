from pathlib import Path
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# Modelo
MODEL_PATH = os.getenv("MODEL_PATH", "yolo11n.pt")
CONFIDENCE_THRESHOLD = float(os.getenv("CONFIDENCE_THRESHOLD", "0.25"))

# API
API_HOST = os.getenv("API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("API_PORT", "8001"))

# Cámara
CAMERA_SOURCE = os.getenv("CAMERA_SOURCE", "0")

# Clases objetivo del MVP académico
TARGET_CLASSES = ["lentejas", "arroz", "comida_gato"]

# Rutas útiles
DATA_DIR = BASE_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
RESULTADOS_DIR = BASE_DIR / "resultados"
RESULTADOS_JSON_DIR = RESULTADOS_DIR / "json"
RESULTADOS_PREDICCIONES_DIR = RESULTADOS_DIR / "predicciones"

# ROI
ROI_X = int(os.getenv("ROI_X", "0"))
ROI_Y = int(os.getenv("ROI_Y", "0"))
ROI_WIDTH = int(os.getenv("ROI_WIDTH", "0"))
ROI_HEIGHT = int(os.getenv("ROI_HEIGHT", "0"))