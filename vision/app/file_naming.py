from pathlib import Path
import re


CAPTURE_PATTERN = re.compile(r"^capture_(\d{6})\.png$")


def get_next_capture_path(raw_dir: Path) -> Path:
    raw_dir.mkdir(parents=True, exist_ok=True)

    max_number = 0

    for file in raw_dir.iterdir():
        if not file.is_file():
            continue

        match = CAPTURE_PATTERN.match(file.name)
        if match:
            number = int(match.group(1))
            if number > max_number:
                max_number = number

    next_number = max_number + 1
    filename = f"capture_{next_number:06d}.png"
    return raw_dir / filename