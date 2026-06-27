# Backend Python — Persistência (FastAPI)

Backend que demonstra persistência do dataset do AlgoLab em **4 formatos** — 2 de texto (JSON, CSV) e 2 binários (pickle, struct) — com endpoints para salvar, carregar offline, comparar e inspecionar.

## Como rodar

Pré-requisito: Python 3.10+.

```bash
cd backend
python -m venv .venv
# Linux/macOS:
source .venv/bin/activate
# Windows:
.venv\Scripts\activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Acesse:
- API: `http://localhost:8000`
- Documentação interativa (Swagger): `http://localhost:8000/docs`

## Conectar com o frontend

No frontend, crie um arquivo `.env` na raiz do projeto com:

```
VITE_API_URL=http://localhost:8000
```

Depois rode `bun dev`. A aba **Persistência** vai conversar com o backend.

## Endpoints

| Método | Rota | Descrição |
|---|---|---|
| `GET` | `/api/sources` | Lista as fontes disponíveis |
| `GET` | `/api/fetch/{source_id}` | Baixa da API pública (sem salvar) |
| `POST` | `/api/save/{source_id}?format=json\|csv\|pickle\|struct` | Baixa e salva em disco |
| `GET` | `/api/load/{source_id}?format=...` | **Modo offline** — lê do arquivo |
| `GET` | `/api/compare/{source_id}` | Salva nos 4 formatos e mede tamanho/tempo |
| `GET` | `/api/inspect/{source_id}?format=...` | Trecho do arquivo (texto) ou hexdump (binário) |

## Onde está cada formato

| Formato | Arquivo | Módulo padrão | Tipo |
|---|---|---|---|
| JSON | `storage/json_store.py` | `json` | Texto |
| CSV | `storage/csv_store.py` | `csv` | Texto |
| pickle | `storage/pickle_store.py` | `pickle` | Binário |
| struct | `storage/struct_store.py` | `struct` | Binário (registro fixo) |

Todos usam `with open(...)` e os de texto usam `encoding="utf-8"`. O `load` trata "arquivo ainda não existe" devolvendo HTTP 404.

## Layout do formato `struct`

Registro de tamanho fixo (little-endian):

```
Header:
  magic      4 bytes   "ALGB"
  n_items    uint32
  n_fields   uint16
  field_names  n_fields × 16 bytes (UTF-8, padded com \x00)

Registro × n_items:
  name       32 bytes (UTF-8 padded/truncado)
  values     n_fields × float64
```

## Modo offline — teste rápido

1. Com a internet ligada: `curl -X POST "http://localhost:8000/api/save/ghibli?format=pickle"`
2. Desligue a internet.
3. `curl "http://localhost:8000/api/load/ghibli?format=pickle"` — devolve os dados normalmente.
