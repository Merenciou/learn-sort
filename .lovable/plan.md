
# Trabalho Final — Persistência de Dados (Python + Frontend)

## Como vamos trabalhar (importante ler antes)

O preview do Lovable **não executa Python** — ele roda só o frontend (Cloudflare Workers/TS). Então a estratégia híbrida funciona assim:

1. Eu crio aqui, no mesmo repositório, uma pasta `backend/` com o projeto FastAPI completo (código, `requirements.txt`, README de execução).
2. Eu adapto o frontend para conversar com esse backend via `http://localhost:8000` (configurável por `VITE_API_URL`).
3. Você baixa o projeto, roda `uvicorn` localmente e o frontend (rodando local com `bun dev` ou direto no preview Lovable apontando para `localhost:8000`) consome a API.
4. As iterações de código (ajustar endpoint, mudar layout do painel, melhorar hexdump) continuam aqui comigo — você só re-baixa quando quiser testar.

Trade-off: o preview do Lovable não vai mostrar os botões "Salvar/Offline" funcionando de verdade enquanto o FastAPI não estiver rodando na sua máquina. Para a apresentação do trabalho, você roda os dois lados localmente.

---

## O que será construído

### 1. Backend Python (`backend/`)

Estrutura:

```text
backend/
  main.py              # FastAPI app + CORS
  storage/
    __init__.py
    json_store.py      # json.dump/load
    csv_store.py       # csv.DictWriter/DictReader
    pickle_store.py    # pickle.dump/load
    struct_store.py    # struct.pack/unpack (registro fixo)
  data/                # arquivos gerados (.json/.csv/.pkl/.bin) — gitignored
  requirements.txt
  README.md            # como rodar: venv + pip install + uvicorn
```

Endpoints:

| Método | Rota | Função |
|---|---|---|
| `GET`  | `/api/sources` | Lista as fontes públicas disponíveis (espelha `datasources.ts`) |
| `GET`  | `/api/fetch/{source_id}` | Baixa da API pública, devolve JSON normalizado `[{name, values}]` |
| `POST` | `/api/save/{source_id}?format=json\|csv\|pickle\|struct` | Salva o dataset no formato pedido, retorna `{path, size_bytes, elapsed_ms}` |
| `GET`  | `/api/load/{source_id}?format=...` | **Modo offline**: lê do disco, devolve os dados + métricas de leitura |
| `GET`  | `/api/compare/{source_id}` | Salva nos 4 formatos, mede tempo de save/load + tamanho, devolve tabela comparativa |
| `GET`  | `/api/inspect/{source_id}?format=...` | Para texto: devolve primeiros ~500 chars. Para binário: devolve hexdump (offset, hex, ascii) dos primeiros ~256 bytes |

Cada store implementa `save(path, items) -> elapsed_ms` e `load(path) -> (items, elapsed_ms)`. Todas as leituras de texto usam `with open(..., encoding="utf-8")`. `load` trata `FileNotFoundError` retornando HTTP 404 com mensagem clara.

O `struct_store` usa registro de tamanho fixo: `name` truncado para 32 bytes UTF-8 + N floats (um por campo numérico do dataset), com header indicando a contagem e os nomes dos campos.

CORS liberado para `http://localhost:8080` e `http://localhost:5173` (dev do frontend).

### 2. Frontend — alterações pontuais

- **`src/lib/api-client.ts`** (novo): wrapper `fetch` usando `import.meta.env.VITE_API_URL ?? "http://localhost:8000"`.
- **`src/lib/datasources.ts`**: adicionar opção "via backend" — quando o usuário escolhe a fonte, mostrar dois botões: **"Carregar da API"** (comportamento atual, direto do JS) e **"Carregar via backend"** (chama `/api/fetch/...` e em seguida `/api/save/...` nos 4 formatos automaticamente).
- **`src/routes/index.tsx`**: adicionar bloco "Persistência" abaixo da escolha de dataset:
  - Botão **"Carregar do arquivo (offline)"** → chama `/api/load/...` com o formato selecionado.
  - Dropdown de formato (JSON / CSV / pickle / struct).
  - Indicador de origem dos dados atuais ("API direta" / "backend live" / "arquivo: dados.pkl").
- **Novo componente `src/components/PersistencePanel.tsx`**:
  - Tabela comparativa (formato, tamanho em KB, tempo save, tempo load) usando `/api/compare`.
  - Gráfico de barras simples (Recharts) com os 4 tamanhos lado a lado.
  - Inspetor lado-a-lado: trecho do JSON/CSV (monospace, syntax-highlight básico) vs hexdump do pickle/struct (offset | hex | ascii em fonte monoespaçada).
- **Nova rota `src/routes/persistence.tsx`**: hospeda o `PersistencePanel`, adiciona item no menu do `__root.tsx`.
- **Estado de loading e erro**: se o backend estiver offline, mostrar banner "Backend Python não está rodando. Veja `backend/README.md`".

### 3. Integração ordenação/busca

Quando o usuário carrega via backend ou via arquivo, os dados entram no mesmo `DatasetProvider` que já alimenta `visualize`, `compare` e `search`. Nenhum algoritmo precisa mudar — eles continuam recebendo `number[]` do contexto.

### 4. README atualizado

Seção nova "Backend e Persistência" explicando:
- Como rodar (`cd backend && python -m venv .venv && pip install -r requirements.txt && uvicorn main:app --reload`).
- Como configurar `VITE_API_URL` no frontend.
- Discussão comparativa dos 4 formatos (tamanho/tempo/legibilidade/portabilidade) — preenchida com números reais após você rodar uma vez.
- Checklist mapeando cada critério dos 500 pts ao arquivo/endpoint correspondente.

---

## Resposta direta à sua pergunta

**A melhor abordagem para você é a híbrida que escolhemos**: eu gero tudo aqui (backend Python + frontend integrado + README), você baixa, roda local. As iterações de ajuste fino você continua fazendo comigo aqui — outras IAs serviriam se quisesse uma segunda opinião, mas não são necessárias porque o escopo está bem definido.

Aprove o plano e eu já implemento backend + frontend + README na próxima resposta.
