"""Persistência em CSV (texto, tabular)."""
import csv
import time
from typing import Any


def save(path: str, items: list[dict[str, Any]]) -> float:
    start = time.perf_counter()
    if not items:
        with open(path, "w", encoding="utf-8", newline="") as f:
            f.write("")
        return (time.perf_counter() - start) * 1000

    # Achata: name + chaves de values
    field_keys = sorted({k for it in items for k in it.get("values", {}).keys()})
    headers = ["name", *field_keys]
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=headers)
        writer.writeheader()
        for it in items:
            row = {"name": it["name"]}
            for k in field_keys:
                row[k] = it.get("values", {}).get(k, "")
            writer.writerow(row)
    return (time.perf_counter() - start) * 1000


def load(path: str) -> tuple[list[dict[str, Any]], float]:
    start = time.perf_counter()
    items: list[dict[str, Any]] = []
    with open(path, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = row.pop("name", "")
            values: dict[str, float] = {}
            for k, v in row.items():
                if v == "" or v is None:
                    continue
                try:
                    values[k] = float(v)
                except ValueError:
                    pass
            items.append({"name": name, "values": values})
    return items, (time.perf_counter() - start) * 1000
