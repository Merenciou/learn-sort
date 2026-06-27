"""Módulos de persistência: cada store implementa save(path, items) e load(path)."""
from . import json_store, csv_store, pickle_store, struct_store

STORES = {
    "json": json_store,
    "csv": csv_store,
    "pickle": pickle_store,
    "struct": struct_store,
}

EXT = {
    "json": "json",
    "csv": "csv",
    "pickle": "pkl",
    "struct": "bin",
}

IS_TEXT = {"json": True, "csv": True, "pickle": False, "struct": False}
