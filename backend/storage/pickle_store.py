"""Persistência com pickle (binário nativo Python)."""
import pickle
import time
from typing import Any


def save(path: str, items: list[dict[str, Any]]) -> float:
    start = time.perf_counter()
    with open(path, "wb") as f:
        pickle.dump(items, f, protocol=pickle.HIGHEST_PROTOCOL)
    return (time.perf_counter() - start) * 1000


def load(path: str) -> tuple[list[dict[str, Any]], float]:
    start = time.perf_counter()
    with open(path, "rb") as f:
        items = pickle.load(f)
    return items, (time.perf_counter() - start) * 1000
