"""Espelha src/lib/datasources.ts no servidor: define fontes públicas e como normalizar."""
from typing import Any
import httpx


async def _fetch_json(url: str) -> Any:
    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        r = await client.get(url)
        r.raise_for_status()
        return r.json()


async def _parse_pokeapi(raw: Any) -> list[dict[str, Any]]:
    out: list[dict[str, Any]] = []
    async with httpx.AsyncClient(timeout=30.0) as client:
        for r in raw.get("results", [])[:60]:
            d = (await client.get(r["url"])).json()
            out.append({
                "name": d["name"],
                "values": {
                    "base_experience": d.get("base_experience") or 0,
                    "weight": d.get("weight") or 0,
                    "height": d.get("height") or 0,
                },
            })
    return out


def _parse_countries(raw: Any) -> list[dict[str, Any]]:
    rows = raw[1] if isinstance(raw, list) and len(raw) > 1 else []
    out = []
    for r in rows:
        if not r or r.get("value") is None or not r.get("country", {}).get("value"):
            continue
        out.append({
            "name": r["country"]["value"],
            "values": {
                "population": float(r.get("value") or 0),
                "year": float(r.get("date") or 0),
            },
        })
    return out[:80]


def _parse_rickmorty(raw: Any) -> list[dict[str, Any]]:
    return [
        {"name": c["name"], "values": {"episodes": len(c.get("episode", [])), "id": c["id"]}}
        for c in raw.get("results", [])
    ]


def _parse_tvmaze(raw: Any) -> list[dict[str, Any]]:
    return [
        {
            "name": s["name"],
            "values": {
                "rating": round((s.get("rating", {}).get("average") or 0) * 10),
                "weight": s.get("weight") or 0,
            },
        }
        for s in raw[:80]
    ]


def _parse_ghibli(raw: Any) -> list[dict[str, Any]]:
    return [
        {
            "name": f["title"],
            "values": {
                "year": int(f.get("release_date") or 0),
                "score": int(f.get("rt_score") or 0),
                "duration": int(f.get("running_time") or 0),
            },
        }
        for f in raw
    ]


SOURCES: dict[str, dict[str, Any]] = {
    "pokeapi": {
        "label": "PokéAPI",
        "url": "https://pokeapi.co/api/v2/pokemon?limit=100",
        "fields": ["base_experience", "weight", "height"],
        "parse": _parse_pokeapi,
        "async_parse": True,
    },
    "countries": {
        "label": "Países (World Bank)",
        "url": "https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL?format=json&date=2022&per_page=400",
        "fields": ["population", "year"],
        "parse": _parse_countries,
        "async_parse": False,
    },
    "rickmorty": {
        "label": "Rick and Morty",
        "url": "https://rickandmortyapi.com/api/character",
        "fields": ["episodes", "id"],
        "parse": _parse_rickmorty,
        "async_parse": False,
    },
    "tvmaze": {
        "label": "TVMaze",
        "url": "https://api.tvmaze.com/shows",
        "fields": ["rating", "weight"],
        "parse": _parse_tvmaze,
        "async_parse": False,
    },
    "ghibli": {
        "label": "Studio Ghibli",
        "url": "https://ghibliapi.vercel.app/films",
        "fields": ["year", "score", "duration"],
        "parse": _parse_ghibli,
        "async_parse": False,
    },
}


async def fetch_source(source_id: str) -> list[dict[str, Any]]:
    if source_id not in SOURCES:
        raise KeyError(source_id)
    cfg = SOURCES[source_id]
    raw = await _fetch_json(cfg["url"])
    if cfg["async_parse"]:
        return await cfg["parse"](raw)
    return cfg["parse"](raw)
