import { createFileRoute, Link } from "@tanstack/react-router";
import { useArrayFromDataset, useDataset } from "@/lib/dataset-context";
import { ComparisonGrid } from "@/components/ComparisonGrid";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Comparar — AlgoLab" },
      { name: "description", content: "Execute todos os algoritmos simultaneamente sobre o mesmo dataset." },
    ],
  }),
  component: Page,
});

function Page() {
  const { source } = useDataset();
  const array = useArrayFromDataset();
  if (!source || array.length === 0) {
    return (
      <div className="rounded-md border bg-card p-8 text-center space-y-3">
        <div className="text-lg font-semibold">Carregue um dataset primeiro</div>
        <Link to="/" className="underline text-primary">Ir para o início</Link>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Comparação em tempo real</h1>
      <ComparisonGrid array={array} />
    </div>
  );
}
