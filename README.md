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
