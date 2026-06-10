import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useArrayFromDataset, useDataset } from "@/lib/dataset-context";
import { AlgorithmVisualizer } from "@/components/AlgorithmVisualizer";
import { ALGORITHMS, ALGORITHM_KEYS, type AlgoKey } from "@/lib/algorithms";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/visualize")({
  head: () => ({
    meta: [
      { title: "Visualizar — AlgoLab" },
      { name: "description", content: "Animação passo a passo de algoritmos de ordenação." },
    ],
  }),
  component: Page,
});

function Page() {
  const { source } = useDataset();
  const array = useArrayFromDataset();
  const [algo, setAlgo] = useState<AlgoKey>("bubble");

  if (!source || array.length === 0) return <NeedsData />;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-sm text-muted-foreground">Algoritmo:</span>
        {ALGORITHM_KEYS.map((k) => (
          <Button key={k} size="sm" variant={algo === k ? "default" : "outline"} onClick={() => setAlgo(k)}>
            {ALGORITHMS[k].name}
          </Button>
        ))}
      </div>
      <AlgorithmVisualizer array={array} algoKey={algo} />
    </div>
  );
}

function NeedsData() {
  return (
    <div className="rounded-md border bg-card p-8 text-center space-y-3">
      <div className="text-lg font-semibold">Carregue um dataset primeiro</div>
      <p className="text-muted-foreground">Escolha uma fonte de dados na página inicial para começar.</p>
      <Link to="/" className="inline-block underline text-primary">Ir para o início</Link>
    </div>
  );
}
