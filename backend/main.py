"""FastAPI app: persistência de datasets em texto e binário."""
import os
import time
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from sources import SOURCES, fetch_source
from storage import STORES, EXT, IS_TEXT

DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)

app = FastAPI(title="AlgoLab Persistence API", version="1.0.0")

# CORS: lista separada por vírgula em ALLOWED_ORIGINS, ou "*" (default) para liberar tudo.
_origins_env = os.environ.get("ALLOWED_ORIGINS", "*").strip()
_allow_origins = ["*"] if _origins_env == "*" else [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allow_origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _path_for(source_id: str, fmt: str) -> Path:
    if fmt not in STORES:
        raise HTTPException(400, f"Formato inválido: {fmt}")
    return DATA_DIR / f"{source_id}.{EXT[fmt]}"


@app.get("/")
def root():
    return {"name": "AlgoLab Persistence API", "endpoints": [
        "/api/sources", "/api/fetch/{id}", "/api/save/{id}", "/api/load/{id}",
        "/api/compare/{id}", "/api/inspect/{id}",
    ]}


@app.get("/api/sources")
def list_sources():
    return [
        {"id": sid, "label": cfg["label"], "fields": cfg["fields"]}
        for sid, cfg in SOURCES.items()
    ]


@app.get("/api/fetch/{source_id}")
async def fetch_endpoint(source_id: str):
    try:
        items = await fetch_source(source_id)
    except KeyError:
        raise HTTPException(404, f"Fonte desconhecida: {source_id}")
    except Exception as e:
        raise HTTPException(502, f"Falha ao buscar API pública: {e}")
    return {"source": source_id, "count": len(items), "items": items}


@app.post("/api/save/{source_id}")
async def save_endpoint(source_id: str, format: str = Query(...)):
    if source_id not in SOURCES:
        raise HTTPException(404, f"Fonte desconhecida: {source_id}")
    try:
        items = await fetch_source(source_id)
    except Exception as e:
        raise HTTPException(502, f"Falha ao buscar API: {e}")
    path = _path_for(source_id, format)
    elapsed = STORES[format].save(str(path), items)
    return {
        "source": source_id,
        "format": format,
        "path": str(path.relative_to(DATA_DIR.parent)),
        "size_bytes": path.stat().st_size,
        "save_ms": round(elapsed, 3),
        "count": len(items),
    }


@app.get("/api/load/{source_id}")
def load_endpoint(source_id: str, format: str = Query(...)):
    path = _path_for(source_id, format)
    if not path.exists():
        raise HTTPException(404, f"Arquivo não existe: {path.name}. Salve primeiro via /api/save.")
    try:
        items, elapsed = STORES[format].load(str(path))
    except FileNotFoundError:
        raise HTTPException(404, f"Arquivo não encontrado: {path.name}")
    except Exception as e:
        raise HTTPException(500, f"Erro ao ler {path.name}: {e}")
    return {
        "source": source_id,
        "format": format,
        "load_ms": round(elapsed, 3),
        "size_bytes": path.stat().st_size,
        "count": len(items),
        "items": items,
    }


@app.get("/api/compare/{source_id}")
async def compare_endpoint(source_id: str):
    if source_id not in SOURCES:
        raise HTTPException(404, f"Fonte desconhecida: {source_id}")
    try:
        items = await fetch_source(source_id)
    except Exception as e:
        raise HTTPException(502, f"Falha ao buscar API: {e}")

    results = []
    for fmt in STORES.keys():
        path = _path_for(source_id, fmt)
        save_ms = STORES[fmt].save(str(path), items)
        _, load_ms = STORES[fmt].load(str(path))
        results.append({
            "format": fmt,
            "is_text": IS_TEXT[fmt],
            "size_bytes": path.stat().st_size,
            "size_kb": round(path.stat().st_size / 1024, 3),
            "save_ms": round(save_ms, 3),
            "load_ms": round(load_ms, 3),
        })
    return {"source": source_id, "count": len(items), "results": results}


def _hexdump(data: bytes, width: int = 16) -> list[dict[str, Any]]:
    rows = []
    for offset in range(0, len(data), width):
        chunk = data[offset:offset + width]
        hex_part = " ".join(f"{b:02x}" for b in chunk)
        ascii_part = "".join(chr(b) if 32 <= b < 127 else "." for b in chunk)
        rows.append({"offset": f"{offset:08x}", "hex": hex_part, "ascii": ascii_part})
    return rows


@app.get("/api/inspect/{source_id}")
def inspect_endpoint(source_id: str, format: str = Query(...)):
    path = _path_for(source_id, format)
    if not path.exists():
        raise HTTPException(404, f"Arquivo não existe: {path.name}")
    size = path.stat().st_size
    if IS_TEXT[format]:
        with open(path, "r", encoding="utf-8") as f:
            preview = f.read(800)
        return {
            "format": format, "is_text": True, "size_bytes": size,
            "preview": preview, "truncated": size > 800,
        }
    with open(path, "rb") as f:
        raw = f.read(256)
    return {
        "format": format, "is_text": False, "size_bytes": size,
        "hexdump": _hexdump(raw), "truncated": size > 256,
    }


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
