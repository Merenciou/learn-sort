import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useDataset } from "@/lib/dataset-context";
import { SearchVisualizer } from "@/components/SearchVisualizer";

export const Route = createFileRoute("/search")({
  head: () => ({
    meta: [
      { title: "Buscar — AlgoLab" },
      { name: "description", content: "Busca linear, binária e por substring sobre o dataset." },
    ],
  }),
  component: Page,
});

function Page() {
  const { source, field, items, size } = useDataset();
  // Local field state for the Search screen (independent from the header).
  const [localField, setLocalField] = useState<string>(field);

  useEffect(() => {
    if (!localField && field) setLocalField(field);
  }, [field, localField]);

  const effectiveField = localField || field;

  const { values, sortedValues, names } = useMemo(() => {
    const slice = items.slice(0, size);
    const arr = slice.map((it) => ({ v: it.values[effectiveField] ?? 0, n: it.name }));
    const sortedArr = arr.slice().sort((a, b) => a.v - b.v);
    return {
      values: arr.map((x) => x.v),
      sortedValues: sortedArr.map((x) => x.v),
      names: arr.map((x) => x.n),
    };
  }, [items, effectiveField, size]);

  if (!source || values.length === 0) {
    return (
      <div className="rounded-md border bg-card p-8 text-center space-y-3">
        <div className="text-lg font-semibold">Carregue um dataset primeiro</div>
        <Link to="/" className="underline text-primary">Ir para o início</Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Busca</h1>
      <SearchVisualizer
        values={values}
        sortedValues={sortedValues}
        names={names}
        fields={source.fields}
        selectedField={effectiveField}
        onFieldChange={setLocalField}
      />
    </div>
  );
}
