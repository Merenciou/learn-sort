"""Persistência em JSON (texto, legível, portável)."""
import json
import time
from typing import Any


def save(path: str, items: list[dict[str, Any]]) -> float:
    start = time.perf_counter()
    with open(path, "w", encoding="utf-8") as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    return (time.perf_counter() - start) * 1000


def load(path: str) -> tuple[list[dict[str, Any]], float]:
    start = time.perf_counter()
    with open(path, "r", encoding="utf-8") as f:
        items = json.load(f)
    return items, (time.perf_counter() - start) * 1000
