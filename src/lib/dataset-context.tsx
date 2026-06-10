import { createContext, useContext, useState, type ReactNode } from "react";
import type { DataSource } from "./datasources";

export interface DatasetItem { name: string; values: Record<string, number> }

interface Ctx {
  source: DataSource | null;
  setSource: (s: DataSource | null) => void;
  field: string;
  setField: (f: string) => void;
  items: DatasetItem[];
  setItems: (i: DatasetItem[]) => void;
  size: number;
  setSize: (n: number) => void;
}

const DatasetContext = createContext<Ctx | null>(null);

export function DatasetProvider({ children }: { children: ReactNode }) {
  const [source, setSource] = useState<DataSource | null>(null);
  const [field, setField] = useState<string>("");
  const [items, setItems] = useState<DatasetItem[]>([]);
  const [size, setSize] = useState<number>(30);
  return (
    <DatasetContext.Provider value={{ source, setSource, field, setField, items, setItems, size, setSize }}>
      {children}
    </DatasetContext.Provider>
  );
}

export function useDataset() {
  const ctx = useContext(DatasetContext);
  if (!ctx) throw new Error("useDataset must be used inside DatasetProvider");
  return ctx;
}

export function useArrayFromDataset(): number[] {
  const { items, field, size } = useDataset();
  if (!items.length || !field) return [];
  return items.slice(0, size).map((it) => it.values[field] ?? 0);
}
