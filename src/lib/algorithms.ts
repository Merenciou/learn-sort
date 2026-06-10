// Sorting algorithms as generators. Each yield emits a step snapshot.

export interface SortStep {
  array: number[];
  idxA: number | null;
  idxB: number | null;
  swapping: number[]; // indices currently being swapped/moved
  sorted: number[]; // indices already in final position
  pivot: number | null;
  message: string;
  pseudoLine: number;
  comparisons: number;
  swaps: number;
  processed: number; // elements processed so far (for complexity chart x-axis)
}

export interface AlgorithmMeta {
  name: string;
  structure: string;
  description: string;
  pseudocode: string[];
  complexity: { best: string; avg: string; worst: string; space: string };
  generator: (arr: number[]) => Generator<SortStep, void, unknown>;
}

const baseStep = (arr: number[], partial: Partial<SortStep>): SortStep => ({
  array: arr.slice(),
  idxA: null,
  idxB: null,
  swapping: [],
  sorted: [],
  pivot: null,
  message: "",
  pseudoLine: 0,
  comparisons: 0,
  swaps: 0,
  processed: 0,
  ...partial,
});

// ---------- Bubble Sort ----------
function* bubbleSort(input: number[]): Generator<SortStep> {
  const a = input.slice();
  const n = a.length;
  let comparisons = 0, swaps = 0;
  const sorted: number[] = [];
  yield baseStep(a, { message: "Início do Bubble Sort", pseudoLine: 0, comparisons, swaps });
  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      comparisons++;
      yield baseStep(a, {
        idxA: j, idxB: j + 1, sorted: sorted.slice(),
        message: `Comparando ${a[j]} e ${a[j + 1]}`,
        pseudoLine: 2, comparisons, swaps, processed: i,
      });
      if (a[j] > a[j + 1]) {
        [a[j], a[j + 1]] = [a[j + 1], a[j]];
        swaps++;
        yield baseStep(a, {
          idxA: j, idxB: j + 1, swapping: [j, j + 1], sorted: sorted.slice(),
          message: `Trocando ${a[j + 1]} e ${a[j]}`,
          pseudoLine: 3, comparisons, swaps, processed: i,
        });
      }
    }
    sorted.unshift(n - 1 - i);
  }
  sorted.push(0);
  yield baseStep(a, {
    sorted: Array.from({ length: n }, (_, i) => i),
    message: "Ordenação completa!", pseudoLine: 5, comparisons, swaps, processed: n,
  });
}

// ---------- Selection Sort ----------
function* selectionSort(input: number[]): Generator<SortStep> {
  const a = input.slice();
  const n = a.length;
  let comparisons = 0, swaps = 0;
  const sorted: number[] = [];
  yield baseStep(a, { message: "Início do Selection Sort", pseudoLine: 0 });
  for (let i = 0; i < n - 1; i++) {
    let min = i;
    for (let j = i + 1; j < n; j++) {
      comparisons++;
      yield baseStep(a, {
        idxA: min, idxB: j, sorted: sorted.slice(),
        message: `Procurando mínimo: comparando ${a[min]} e ${a[j]}`,
        pseudoLine: 2, comparisons, swaps, processed: i,
      });
      if (a[j] < a[min]) min = j;
    }
    if (min !== i) {
      [a[i], a[min]] = [a[min], a[i]];
      swaps++;
      yield baseStep(a, {
        idxA: i, idxB: min, swapping: [i, min], sorted: sorted.slice(),
        message: `Trocando posição ${i} com mínimo`,
        pseudoLine: 4, comparisons, swaps, processed: i,
      });
    }
    sorted.push(i);
  }
  sorted.push(n - 1);
  yield baseStep(a, {
    sorted: Array.from({ length: n }, (_, i) => i),
    message: "Ordenação completa!", pseudoLine: 6, comparisons, swaps, processed: n,
  });
}

// ---------- Insertion Sort ----------
function* insertionSort(input: number[]): Generator<SortStep> {
  const a = input.slice();
  const n = a.length;
  let comparisons = 0, swaps = 0;
  yield baseStep(a, { message: "Início do Insertion Sort", pseudoLine: 0 });
  for (let i = 1; i < n; i++) {
    let j = i;
    while (j > 0) {
      comparisons++;
      yield baseStep(a, {
        idxA: j - 1, idxB: j,
        message: `Comparando ${a[j - 1]} e ${a[j]}`,
        pseudoLine: 2, comparisons, swaps, processed: i,
      });
      if (a[j - 1] > a[j]) {
        [a[j - 1], a[j]] = [a[j], a[j - 1]];
        swaps++;
        yield baseStep(a, {
          idxA: j - 1, idxB: j, swapping: [j - 1, j],
          message: `Movendo ${a[j - 1]} à esquerda`,
          pseudoLine: 3, comparisons, swaps, processed: i,
        });
        j--;
      } else break;
    }
  }
  yield baseStep(a, {
    sorted: Array.from({ length: n }, (_, i) => i),
    message: "Ordenação completa!", pseudoLine: 5, comparisons, swaps, processed: n,
  });
}

// ---------- Merge Sort ----------
function* mergeSort(input: number[]): Generator<SortStep> {
  const a = input.slice();
  const n = a.length;
  const counter = { c: 0, s: 0 };
  yield baseStep(a, { message: "Início do Merge Sort", pseudoLine: 0 });
  yield* mergeSortHelper(a, 0, n - 1, counter);
  yield baseStep(a, {
    sorted: Array.from({ length: n }, (_, i) => i),
    message: "Ordenação completa!", pseudoLine: 6, comparisons: counter.c, swaps: counter.s, processed: n,
  });
}
function* mergeSortHelper(a: number[], l: number, r: number, c: { c: number; s: number }): Generator<SortStep> {
  if (l >= r) return;
  const m = Math.floor((l + r) / 2);
  yield* mergeSortHelper(a, l, m, c);
  yield* mergeSortHelper(a, m + 1, r, c);
  yield* merge(a, l, m, r, c);
}
function* merge(a: number[], l: number, m: number, r: number, c: { c: number; s: number }): Generator<SortStep> {
  const left = a.slice(l, m + 1);
  const right = a.slice(m + 1, r + 1);
  let i = 0, j = 0, k = l;
  while (i < left.length && j < right.length) {
    c.c++;
    yield baseStep(a, {
      idxA: l + i, idxB: m + 1 + j,
      message: `Mesclando: comparando ${left[i]} e ${right[j]}`,
      pseudoLine: 3, comparisons: c.c, swaps: c.s, processed: k,
    });
    if (left[i] <= right[j]) {
      a[k++] = left[i++];
    } else {
      a[k++] = right[j++];
      c.s++;
    }
    yield baseStep(a, {
      idxA: k - 1, swapping: [k - 1],
      message: `Posicionando elemento em ${k - 1}`,
      pseudoLine: 4, comparisons: c.c, swaps: c.s, processed: k,
    });
  }
  while (i < left.length) { a[k++] = left[i++]; c.s++; }
  while (j < right.length) { a[k++] = right[j++]; c.s++; }
}

// ---------- Quick Sort ----------
function* quickSort(input: number[]): Generator<SortStep> {
  const a = input.slice();
  const n = a.length;
  const c = { c: 0, s: 0 };
  yield baseStep(a, { message: "Início do Quick Sort", pseudoLine: 0 });
  yield* quickHelper(a, 0, n - 1, c);
  yield baseStep(a, {
    sorted: Array.from({ length: n }, (_, i) => i),
    message: "Ordenação completa!", pseudoLine: 8, comparisons: c.c, swaps: c.s, processed: n,
  });
}
function* quickHelper(a: number[], lo: number, hi: number, c: { c: number; s: number }): Generator<SortStep> {
  if (lo >= hi) return;
  const pivot = a[hi];
  let i = lo - 1;
  yield baseStep(a, {
    pivot: hi, message: `Pivô = ${pivot}`, pseudoLine: 2,
    comparisons: c.c, swaps: c.s, processed: lo,
  });
  for (let j = lo; j < hi; j++) {
    c.c++;
    yield baseStep(a, {
      idxA: j, idxB: hi, pivot: hi,
      message: `Comparando ${a[j]} com pivô ${pivot}`,
      pseudoLine: 4, comparisons: c.c, swaps: c.s, processed: j,
    });
    if (a[j] < pivot) {
      i++;
      if (i !== j) {
        [a[i], a[j]] = [a[j], a[i]];
        c.s++;
        yield baseStep(a, {
          idxA: i, idxB: j, swapping: [i, j], pivot: hi,
          message: `Trocando ${a[j]} e ${a[i]}`,
          pseudoLine: 5, comparisons: c.c, swaps: c.s, processed: j,
        });
      }
    }
  }
  [a[i + 1], a[hi]] = [a[hi], a[i + 1]];
  c.s++;
  yield baseStep(a, {
    idxA: i + 1, idxB: hi, swapping: [i + 1, hi], pivot: i + 1,
    message: `Posicionando pivô`,
    pseudoLine: 6, comparisons: c.c, swaps: c.s, processed: hi,
  });
  yield* quickHelper(a, lo, i, c);
  yield* quickHelper(a, i + 2, hi, c);
}

// ---------- Heap Sort ----------
function* heapSort(input: number[]): Generator<SortStep> {
  const a = input.slice();
  const n = a.length;
  const c = { c: 0, s: 0 };
  yield baseStep(a, { message: "Construindo max-heap", pseudoLine: 0 });
  for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
    yield* heapify(a, n, i, c);
  }
  for (let i = n - 1; i > 0; i--) {
    [a[0], a[i]] = [a[i], a[0]];
    c.s++;
    yield baseStep(a, {
      idxA: 0, idxB: i, swapping: [0, i],
      message: `Movendo raiz para posição ${i}`,
      pseudoLine: 4, comparisons: c.c, swaps: c.s, processed: n - i,
    });
    yield* heapify(a, i, 0, c);
  }
  yield baseStep(a, {
    sorted: Array.from({ length: n }, (_, i) => i),
    message: "Ordenação completa!", pseudoLine: 6, comparisons: c.c, swaps: c.s, processed: n,
  });
}
function* heapify(a: number[], n: number, i: number, c: { c: number; s: number }): Generator<SortStep> {
  let largest = i;
  const l = 2 * i + 1, r = 2 * i + 2;
  if (l < n) {
    c.c++;
    yield baseStep(a, { idxA: largest, idxB: l, message: `Heapify: compara raiz com filho esq.`, pseudoLine: 2, comparisons: c.c, swaps: c.s, processed: i });
    if (a[l] > a[largest]) largest = l;
  }
  if (r < n) {
    c.c++;
    yield baseStep(a, { idxA: largest, idxB: r, message: `Heapify: compara com filho dir.`, pseudoLine: 2, comparisons: c.c, swaps: c.s, processed: i });
    if (a[r] > a[largest]) largest = r;
  }
  if (largest !== i) {
    [a[i], a[largest]] = [a[largest], a[i]];
    c.s++;
    yield baseStep(a, {
      idxA: i, idxB: largest, swapping: [i, largest],
      message: `Trocando para manter heap`,
      pseudoLine: 3, comparisons: c.c, swaps: c.s, processed: i,
    });
    yield* heapify(a, n, largest, c);
  }
}

export const ALGORITHMS: Record<string, AlgorithmMeta> = {
  bubble: {
    name: "Bubble Sort",
    structure: "Array",
    description:
      "Percorre o array repetidamente, comparando pares adjacentes e trocando-os se estiverem fora de ordem. Os maiores elementos 'borbulham' até o final a cada passagem.",
    pseudocode: [
      "para i de 0 até n-1:",
      "  para j de 0 até n-i-1:",
      "    se a[j] > a[j+1]:",
      "      trocar a[j] com a[j+1]",
      "    fim se",
      "fim para",
    ],
    complexity: { best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
    generator: bubbleSort,
  },
  selection: {
    name: "Selection Sort",
    structure: "Array",
    description:
      "A cada iteração encontra o menor elemento do subarray não ordenado e o troca com a primeira posição não ordenada.",
    pseudocode: [
      "para i de 0 até n-1:",
      "  min = i",
      "  para j de i+1 até n:",
      "    se a[j] < a[min]: min = j",
      "  trocar a[i] com a[min]",
      "fim para",
      "// ordenado",
    ],
    complexity: { best: "O(n²)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
    generator: selectionSort,
  },
  insertion: {
    name: "Insertion Sort",
    structure: "Array",
    description:
      "Constrói o array ordenado um elemento por vez, inserindo cada novo elemento em sua posição correta no início ordenado.",
    pseudocode: [
      "para i de 1 até n-1:",
      "  j = i",
      "  enquanto j>0 e a[j-1] > a[j]:",
      "    trocar a[j-1] com a[j]",
      "    j = j - 1",
      "fim para",
    ],
    complexity: { best: "O(n)", avg: "O(n²)", worst: "O(n²)", space: "O(1)" },
    generator: insertionSort,
  },
  merge: {
    name: "Merge Sort",
    structure: "Árvore recursiva + arrays auxiliares",
    description:
      "Divide o array recursivamente até segmentos unitários e depois mescla pares ordenados, produzindo o array final em O(n log n).",
    pseudocode: [
      "mergeSort(a, l, r):",
      "  se l >= r: retorna",
      "  m = (l+r)/2",
      "  mergeSort(a, l, m)",
      "  mergeSort(a, m+1, r)",
      "  merge(a, l, m, r)",
      "// finalizado",
    ],
    complexity: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(n)" },
    generator: mergeSort,
  },
  quick: {
    name: "Quick Sort",
    structure: "Array + pilha de recursão",
    description:
      "Escolhe um pivô, particiona o array para que elementos menores fiquem à esquerda e maiores à direita, e ordena recursivamente as duas partições.",
    pseudocode: [
      "quickSort(a, lo, hi):",
      "  se lo >= hi: retorna",
      "  pivot = a[hi]",
      "  i = lo - 1",
      "  para j de lo até hi-1:",
      "    se a[j] < pivot: i++; trocar(a[i], a[j])",
      "  trocar(a[i+1], a[hi])",
      "  recursão nas duas partições",
      "// finalizado",
    ],
    complexity: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
    generator: quickSort,
  },
  heap: {
    name: "Heap Sort",
    structure: "Heap binário (max-heap)",
    description:
      "Constrói um max-heap a partir do array e repetidamente extrai o maior elemento, colocando-o no final do array.",
    pseudocode: [
      "constrói max-heap",
      "para i de n-1 até 1:",
      "  heapify subindo o maior",
      "  trocar raiz com a[i]",
      "  reduz heap e heapify(0)",
      "fim para",
      "// finalizado",
    ],
    complexity: { best: "O(n log n)", avg: "O(n log n)", worst: "O(n log n)", space: "O(1)" },
    generator: heapSort,
  },
};

export const ALGORITHM_KEYS = ["bubble", "selection", "insertion", "merge", "quick", "heap"] as const;
export type AlgoKey = typeof ALGORITHM_KEYS[number];
