/**
 * Cliente HTTP para o backend Python (FastAPI).
 *
 * Resolução da BASE_URL:
 * 1. VITE_API_URL (env do build) — usado se definido.
 * 2. Em localhost — http://localhost:8000 (dev).
 * 3. Caso contrário (produção) — URL pública do Render.
 */
const PROD_API_URL = "https://algolab-backend-0hao.onrender.com";
const envUrl = (import.meta as any).env?.VITE_API_URL as string | undefined;

function resolveBaseUrl(): string {
  if (envUrl && envUrl.trim().length > 0) return envUrl;
  if (typeof window !== "undefined") {
    const h = window.location.hostname;
    if (h === "localhost" || h === "127.0.0.1") return "http://localhost:8000";
  }
  return PROD_API_URL;
}

const BASE_URL = resolveBaseUrl();

export type StorageFormat = "json" | "csv" | "pickle" | "struct";

export interface BackendItem { name: string; values: Record<string, number> }

export interface SaveResult {
  source: string;
  format: StorageFormat;
  path: string;
  size_bytes: number;
  save_ms: number;
  count: number;
}

export interface LoadResult {
  source: string;
  format: StorageFormat;
  load_ms: number;
  size_bytes: number;
  count: number;
  items: BackendItem[];
}

export interface CompareRow {
  format: StorageFormat;
  is_text: boolean;
  size_bytes: number;
  size_kb: number;
  save_ms: number;
  load_ms: number;
}

export interface CompareResult { source: string; count: number; results: CompareRow[] }

export interface InspectTextResult { format: StorageFormat; is_text: true; size_bytes: number; preview: string; truncated: boolean }
export interface HexRow { offset: string; hex: string; ascii: string }
export interface InspectBinaryResult { format: StorageFormat; is_text: false; size_bytes: number; hexdump: HexRow[]; truncated: boolean }
export type InspectResult = InspectTextResult | InspectBinaryResult;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, init);
  if (!res.ok) {
    let detail = res.statusText;
    try { const j = await res.json(); detail = j.detail ?? detail; } catch {}
    throw new Error(`${res.status}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  baseUrl: BASE_URL,
  fetchSource: (id: string) =>
    request<{ source: string; count: number; items: BackendItem[] }>(`/api/fetch/${id}`),
  save: (id: string, format: StorageFormat) =>
    request<SaveResult>(`/api/save/${id}?format=${format}`, { method: "POST" }),
  load: (id: string, format: StorageFormat) =>
    request<LoadResult>(`/api/load/${id}?format=${format}`),
  compare: (id: string) => request<CompareResult>(`/api/compare/${id}`),
  inspect: (id: string, format: StorageFormat) =>
    request<InspectResult>(`/api/inspect/${id}?format=${format}`),
};

export async function checkBackendOnline(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/`, { method: "GET" });
    return res.ok;
  } catch { return false; }
}
