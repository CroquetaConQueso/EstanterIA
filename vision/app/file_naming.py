from pathlib import Path
from datetime import datetime, timezone


def get_next_capture_path(raw_dir: Path) -> Path:
    raw_dir.mkdir(parents=True, exist_ok=True)

    timestamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
    candidate = raw_dir / f"capture_{timestamp}.png"
    if not candidate.exists():
        return candidate

    suffix = 2
    while True:
        candidate = raw_dir / f"capture_{timestamp}_{suffix}.png"
        if not candidate.exists():
            return candidate
        suffix += 1
