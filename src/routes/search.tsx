import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useDataset } from "@/lib/dataset-context";
import { SearchVisualizer } from "@/components/SearchVisualizer";
import { Button } from "@/components/ui/button";

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
  const [sorted, setSorted] = useState(false);

  const { values, names } = useMemo(() => {
    const slice = items.slice(0, size);
    let arr = slice.map((it) => ({ v: it.values[field] ?? 0, n: it.name }));
    if (sorted) arr = arr.slice().sort((a, b) => a.v - b.v);
    return { values: arr.map((x) => x.v), names: arr.map((x) => x.n) };
  }, [items, field, size, sorted]);

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
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="text-xl font-bold mr-auto">Busca</h1>
        <Button size="sm" variant={sorted ? "default" : "outline"} onClick={() => setSorted((s) => !s)}>
          {sorted ? "Ordenado ✓" : "Ordenar dataset"}
        </Button>
      </div>
      <SearchVisualizer array={values} names={names} isSorted={sorted} />
    </div>
  );
}
