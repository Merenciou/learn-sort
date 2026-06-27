# Learn Sort

Aplicação web interativa para visualização de algoritmos de ordenação e busca, construída com React, TanStack Start/Router e Tailwind CSS. Os dados utilizados nas animações vêm de APIs públicas, permitindo ordenar e buscar informações reais.

## Fonte de dados

Os datasets são carregados dinamicamente a partir das APIs públicas configuradas em [`src/lib/datasources.ts`](src/lib/datasources.ts). O usuário escolhe a fonte na interface, e o campo numérico usado para ordenação/busca também é selecionável.

| Fonte | API | Campos ordenáveis |
|---|---|---|
| PokéAPI | `https://pokeapi.co/api/v2/pokemon?limit=100` | Experiência base (`base_experience`), Peso (`weight`), Altura (`height`) |
| Países (World Bank) | `https://api.worldbank.org/v2/country/all/indicator/SP.POP.TOTL` | População (`population`), Ano (`year`) |
| Rick and Morty | `https://rickandmortyapi.com/api/character` | Nº de episódios (`episodes`), ID (`id`) |
| TVMaze | `https://api.tvmaze.com/shows` | Avaliação (`rating`), Popularidade (`weight`) |
| Studio Ghibli | `https://ghibliapi.vercel.app/films` | Ano (`year`), Avaliação RT (`score`), Duração em minutos (`duration`) |

Cada fonte define uma função `parse` que transforma a resposta da API em uma lista de objetos `{ name, values }`, onde `values` contém os campos numéricos disponíveis para ordenação e busca.

## Onde está cada algoritmo

Todos os algoritmos de ordenação e busca são implementados como **geradores JavaScript** (`function*`), emitindo um snapshot do estado a cada passo — isso é o que alimenta as animações passo a passo na interface.

### Algoritmos de ordenação — [`src/lib/algorithms.ts`](src/lib/algorithms.ts)

| Algoritmo | Função geradora | Estrutura | Complexidade (melhor / médio / pior) |
|---|---|---|---|
| Bubble Sort | `bubbleSort` | Array | O(n) / O(n²) / O(n²) |
| Selection Sort | `selectionSort` | Array | O(n²) / O(n²) / O(n²) |
| Insertion Sort | `insertionSort` | Array | O(n) / O(n²) / O(n²) |
| Merge Sort | `mergeSort` (com `mergeSortHelper` e `merge`) | Árvore recursiva + arrays auxiliares | O(n log n) / O(n log n) / O(n log n) |
| Quick Sort | `quickSort` (com `quickHelper`) | Array + pilha de recursão | O(n log n) / O(n log n) / O(n²) |
| Heap Sort | `heapSort` (com `heapify`) | Heap binário (max-heap) | O(n log n) / O(n log n) / O(n log n) |

O registro `ALGORITHMS` no final do arquivo centraliza, para cada algoritmo, o nome de exibição, a descrição didática, o pseudocódigo (usado no painel com destaque de linha), a complexidade e a referência ao gerador correspondente.

### Algoritmos de busca — [`src/lib/search.ts`](src/lib/search.ts)

| Algoritmo | Função geradora | Descrição |
|---|---|---|
| Busca Linear | `linearSearch` | Percorre o array sequencialmente até encontrar o alvo |
| Busca Binária | `binarySearch` | Divide o array ordenado pela metade a cada passo, descartando a parte que não pode conter o alvo |
| Busca por substring | `substringSearch` | Percorre os nomes dos itens verificando se contêm o texto buscado (case-insensitive), com animação item a item |

Também há versões "somente contagem" (`countLinear` e `countBinary`), usadas para gerar o gráfico de crescimento de comparações por tamanho de amostra.

## Onde estão as telas

| Tela | Arquivo |
|---|---|
| Visualização de ordenação | [`src/routes/visualize.tsx`](src/routes/visualize.tsx) |
| Comparação entre algoritmos | [`src/routes/compare.tsx`](src/routes/compare.tsx) |
| Busca (linear, binária e substring) | [`src/routes/search.tsx`](src/routes/search.tsx) |
| Layout raiz / navegação | [`src/routes/__root.tsx`](src/routes/__root.tsx) |
| Página inicial | [`src/routes/index.tsx`](src/routes/index.tsx) |

O estado do dataset selecionado (fonte e campo) é compartilhado entre as telas via [`src/lib/dataset-context.tsx`](src/lib/dataset-context.tsx).

## Rodando o projeto

```bash
bun install
bun run dev
```

Build de produção:

```bash
bun run build
```

## Backend Python — Persistência

Há um backend FastAPI em [`backend/`](backend/) que implementa cache do dataset em **4 formatos**:

| Formato | Tipo | Módulo Python |
|---|---|---|
| JSON | texto | `json` |
| CSV | texto | `csv` |
| pickle | binário | `pickle` |
| struct | binário (registro fixo) | `struct` |

### Rodar

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Crie um `.env` na raiz do frontend (opcional, default já aponta para `localhost:8000`):

```
VITE_API_URL=http://localhost:8000
```

Em seguida, abra a aba **Persistência** no app. Lá você pode:

1. **Salvar nos 4 formatos** — baixa o dataset e grava `dados.json`, `dados.csv`, `dados.pkl` e `dados.bin` em `backend/data/`.
2. Ver o **painel comparativo** (tamanho em KB + tempo de save/load).
3. Inspecionar **texto vs binário** lado a lado (preview do JSON × hexdump do pickle).
4. **Carregar do arquivo (offline)** — alimenta o `DatasetProvider` lendo do disco, sem chamar a API. Os algoritmos de ordenação/busca funcionam normalmente sobre esses dados.

Veja [`backend/README.md`](backend/README.md) para a referência completa dos endpoints e o layout do formato `struct`.

### Mapa do trabalho (500 pts)

| Critério | Onde |
|---|---|
| Texto (JSON/CSV) | `backend/storage/json_store.py`, `backend/storage/csv_store.py` |
| Binário (pickle/struct) | `backend/storage/pickle_store.py`, `backend/storage/struct_store.py` |
| Modo offline | Botão "Carregar do arquivo" em `/persistence` + `GET /api/load/{id}` |
| Painel comparativo + hexdump | `src/components/PersistencePanel.tsx` + `GET /api/compare`, `GET /api/inspect` |
| Integração ordenação/busca | `DatasetProvider` recebe os itens do arquivo e alimenta `/visualize`, `/compare`, `/search` |

## Publicando o app (frontend Lovable + backend Python na nuvem)

O Lovable publica só o frontend. Para o professor (ou qualquer pessoa) testar os endpoints do backend pela internet, o `backend/` precisa estar hospedado em um serviço que rode Python. O fluxo é: **hospeda o backend → copia a URL pública → define `VITE_API_URL` no frontend → publica no Lovable**.

### 1. Hospedar o backend no Render (recomendado, free tier)

Pré-requisito: projeto no GitHub.

1. Acesse [render.com](https://render.com) e faça login com GitHub.
2. **New +** → **Web Service** → conecte este repositório.
3. Render detecta o `backend/render.yaml` automaticamente. Caso peça manualmente:
   - **Root Directory**: `backend`
   - **Runtime**: `Docker` (usa o `backend/Dockerfile`)
   - **Plan**: Free
4. Clique em **Create Web Service** e aguarde o build (~3-5 min na primeira vez).
5. Anote a URL gerada, algo como `https://algolab-backend.onrender.com`.
6. Teste: abra `https://SUA-URL.onrender.com/docs` — deve mostrar o Swagger do FastAPI.

> **Cold start**: o plano free do Render hiberna o serviço após ~15 min sem requisições. A primeira chamada depois disso demora ~30s. Para uma apresentação, abra a URL uma vez antes para "esquentar".

Alternativas equivalentes: **Railway** (`railway up` na pasta `backend/`), **Fly.io** (`fly launch` dentro de `backend/`, usa o mesmo Dockerfile), **Hugging Face Spaces** (SDK Docker apontando para o Dockerfile).

### 2. Apontar o frontend para o backend público

A URL do Render (`https://algolab-backend-0hao.onrender.com`) **já está embutida como fallback de produção** em [`src/lib/api-client.ts`](src/lib/api-client.ts), então o `Publish` do Lovable funciona sem configuração extra.

Se quiser sobrescrever (apontar para outro backend), crie um `.env` na raiz copiando de `.env.example`:

```
VITE_API_URL=https://outro-backend.onrender.com
```

> O `.env` é lido apenas em builds locais (`bun dev` / `bun run build` no seu PC). Como o `.gitignore` ignora `.env`, o Lovable nunca o vê — por isso o fallback no código é o que garante o funcionamento do site publicado.

### 3. Publicar o frontend pelo Lovable

Clique em **Publish** no canto superior direito do Lovable. O site publicado já chama o backend do Render.

### 4. Como o professor testa

Basta abrir o link publicado (algo como `https://learn-sort.lovable.app`) e ir na aba **Persistência**:
- Clica em **Salvar nos 4 formatos** → backend baixa o dataset, grava JSON/CSV/pickle/struct, devolve tabela comparativa.
- Inspeciona texto vs binário (preview + hexdump).
- Carrega offline (lê do disco do servidor sem chamar API externa).

Para validar os endpoints diretamente sem UI, o professor pode usar o Swagger em `https://SUA-URL.onrender.com/docs`.

### Alternativas se você não quer hospedar

- **Túnel local (Cloudflare Tunnel / ngrok)**: roda `uvicorn` no seu PC, expõe via `cloudflared tunnel --url http://localhost:8000`, usa essa URL como `VITE_API_URL`. Funciona só com seu PC ligado.
- **Tudo local**: professor baixa o ZIP, segue as instruções deste README para rodar frontend + backend localmente.
