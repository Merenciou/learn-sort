"""Persistência com struct: registros de tamanho fixo.

Layout:
  Header:
    magic         : 4 bytes  -> b"ALGB"
    n_items       : uint32   (little-endian)
    n_fields      : uint16
    field_names   : n_fields * (16 bytes UTF-8, padded/truncated)
  Record (repetido n_items vezes):
    name          : 32 bytes UTF-8 padded/truncado com \\x00
    values        : n_fields * float64
"""
import struct
import time
from typing import Any

MAGIC = b"ALGB"
NAME_BYTES = 32
FIELD_NAME_BYTES = 16


def _pack_str(s: str, size: int) -> bytes:
    raw = s.encode("utf-8")[:size]
    return raw + b"\x00" * (size - len(raw))


def _unpack_str(raw: bytes) -> str:
    return raw.rstrip(b"\x00").decode("utf-8", errors="replace")


def save(path: str, items: list[dict[str, Any]]) -> float:
    start = time.perf_counter()
    field_keys = sorted({k for it in items for k in it.get("values", {}).keys()})
    n_fields = len(field_keys)
    with open(path, "wb") as f:
        f.write(MAGIC)
        f.write(struct.pack("<IH", len(items), n_fields))
        for k in field_keys:
            f.write(_pack_str(k, FIELD_NAME_BYTES))
        record_fmt = f"<{NAME_BYTES}s" + "d" * n_fields
        for it in items:
            values = [float(it.get("values", {}).get(k, 0.0)) for k in field_keys]
            f.write(struct.pack(record_fmt, _pack_str(it["name"], NAME_BYTES), *values))
    return (time.perf_counter() - start) * 1000


def load(path: str) -> tuple[list[dict[str, Any]], float]:
    start = time.perf_counter()
    with open(path, "rb") as f:
        magic = f.read(4)
        if magic != MAGIC:
            raise ValueError(f"Magic inválido: {magic!r}")
        n_items, n_fields = struct.unpack("<IH", f.read(6))
        field_keys = [_unpack_str(f.read(FIELD_NAME_BYTES)) for _ in range(n_fields)]
        record_fmt = f"<{NAME_BYTES}s" + "d" * n_fields
        record_size = struct.calcsize(record_fmt)
        items: list[dict[str, Any]] = []
        for _ in range(n_items):
            chunk = f.read(record_size)
            unpacked = struct.unpack(record_fmt, chunk)
            name = _unpack_str(unpacked[0])
            values = {k: unpacked[1 + i] for i, k in enumerate(field_keys)}
            items.append({"name": name, "values": values})
    return items, (time.perf_counter() - start) * 1000
