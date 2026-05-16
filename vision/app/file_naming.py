from pathlib import Path
from datetime import datetime, timezone


def get_next_capture_path(raw_dir: Path, estanteria_codigo: str | None = None) -> Path:
    capture_dir = raw_dir
    shelf_dir = normalize_estanteria_dir(estanteria_codigo)
    if shelf_dir:
        capture_dir = raw_dir / shelf_dir

    capture_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    candidate = capture_dir / f"capture_{timestamp}.png"
    if not candidate.exists():
        return candidate

    suffix = 2
    while True:
        candidate = capture_dir / f"capture_{timestamp}_{suffix}.png"
        if not candidate.exists():
            return candidate
        suffix += 1


def normalize_estanteria_dir(estanteria_codigo: str | None) -> str | None:
    if not estanteria_codigo:
        return None

    value = estanteria_codigo.strip()
    if not value:
        return None

    safe = "".join(char for char in value if char.isalnum() or char in ("-", "_"))
    return safe or None
