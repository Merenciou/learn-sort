export interface SearchStep {
  array: number[];
  visited: number[];
  current: number | null;
  low: number | null;
  mid: number | null;
  high: number | null;
  discarded: number[];
  found: number | null;
  comparisons: number;
  message: string;
  pseudoLine: number;
}

export function* linearSearch(arr: number[], target: number): Generator<SearchStep> {
  let comparisons = 0;
  const visited: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    comparisons++;
    visited.push(i);
    yield {
      array: arr.slice(), visited: visited.slice(), current: i,
      low: null, mid: null, high: null, discarded: [], found: null,
      comparisons, message: `Comparando posição ${i}: ${arr[i]} com alvo ${target}`,
      pseudoLine: 1,
    };
    if (arr[i] === target) {
      yield {
        array: arr.slice(), visited: visited.slice(), current: i,
        low: null, mid: null, high: null, discarded: [], found: i,
        comparisons, message: `Encontrado em posição ${i}!`, pseudoLine: 2,
      };
      return;
    }
  }
  yield {
    array: arr.slice(), visited: visited.slice(), current: null,
    low: null, mid: null, high: null, discarded: [], found: -1,
    comparisons, message: "Não encontrado.", pseudoLine: 4,
  };
}

export function* binarySearch(arr: number[], target: number): Generator<SearchStep> {
  let low = 0, high = arr.length - 1, comparisons = 0;
  const discarded: number[] = [];
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    comparisons++;
    yield {
      array: arr.slice(), visited: [], current: mid,
      low, mid, high, discarded: discarded.slice(), found: null,
      comparisons, message: `low=${low} mid=${mid} high=${high}, testando ${arr[mid]}`,
      pseudoLine: 2,
    };
    if (arr[mid] === target) {
      yield {
        array: arr.slice(), visited: [], current: mid,
        low, mid, high, discarded: discarded.slice(), found: mid,
        comparisons, message: `Encontrado em posição ${mid}!`, pseudoLine: 3,
      };
      return;
    } else if (arr[mid] < target) {
      for (let i = low; i <= mid; i++) discarded.push(i);
      low = mid + 1;
      yield {
        array: arr.slice(), visited: [], current: null,
        low, mid: null, high, discarded: discarded.slice(), found: null,
        comparisons, message: `Alvo maior, descartar metade esquerda`, pseudoLine: 4,
      };
    } else {
      for (let i = mid; i <= high; i++) discarded.push(i);
      high = mid - 1;
      yield {
        array: arr.slice(), visited: [], current: null,
        low, mid: null, high, discarded: discarded.slice(), found: null,
        comparisons, message: `Alvo menor, descartar metade direita`, pseudoLine: 5,
      };
    }
  }
  yield {
    array: arr.slice(), visited: [], current: null,
    low: null, mid: null, high: null, discarded: discarded.slice(), found: -1,
    comparisons, message: "Não encontrado.", pseudoLine: 6,
  };
}

export const LINEAR_PSEUDO = [
  "para i de 0 até n-1:",
  "  se a[i] == alvo:",
  "    retorna i",
  "fim para",
  "retorna -1 (não encontrado)",
];
export const BINARY_PSEUDO = [
  "low = 0, high = n-1",
  "enquanto low <= high:",
  "  mid = (low+high)/2",
  "  se a[mid] == alvo: retorna mid",
  "  se a[mid] < alvo: low = mid+1",
  "  senão: high = mid-1",
  "retorna -1",
];

// Count-only versions for the growth chart
export function countLinear(arr: number[], target: number) {
  let c = 0;
  for (let i = 0; i < arr.length; i++) { c++; if (arr[i] === target) return c; }
  return c;
}
export function countBinary(arr: number[], target: number) {
  let lo = 0, hi = arr.length - 1, c = 0;
  while (lo <= hi) {
    const m = Math.floor((lo + hi) / 2);
    c++;
    if (arr[m] === target) return c;
    if (arr[m] < target) lo = m + 1; else hi = m - 1;
  }
  return c;
}

// --- Substring search (over names) ---
export interface SubstringStep {
  index: number;            // currently checked
  matched: boolean;         // current item matches?
  matches: number[];        // indices found so far
  checked: number[];        // indices already visited
  comparisons: number;
  message: string;
  done: boolean;
}

export function* substringSearch(names: string[], query: string): Generator<SubstringStep> {
  const q = query.toLowerCase();
  const matches: number[] = [];
  const checked: number[] = [];
  for (let i = 0; i < names.length; i++) {
    checked.push(i);
    const hit = names[i].toLowerCase().includes(q);
    if (hit) matches.push(i);
    yield {
      index: i,
      matched: hit,
      matches: matches.slice(),
      checked: checked.slice(),
      comparisons: i + 1,
      message: `Verificando "${names[i]}": contém "${query}"? → ${hit ? "SIM" : "NÃO"}`,
      done: false,
    };
  }
  yield {
    index: -1, matched: false,
    matches: matches.slice(), checked: checked.slice(),
    comparisons: names.length,
    message: `Busca concluída: ${matches.length} de ${names.length} itens contêm "${query}".`,
    done: true,
  };
}
