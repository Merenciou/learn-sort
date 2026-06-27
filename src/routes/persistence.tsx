import { createFileRoute } from "@tanstack/react-router";
import { PersistencePanel } from "@/components/PersistencePanel";

export const Route = createFileRoute("/persistence")({
  head: () => ({
    meta: [
      { title: "Persistência — AlgoLab" },
      { name: "description", content: "Salve datasets em JSON, CSV, pickle e struct. Compare tamanhos, tempos e inspecione texto vs binário." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold">Persistência de Dados</h1>
        <p className="text-sm text-muted-foreground">
          Cache do dataset em disco via backend Python. Compare formatos de texto (JSON, CSV) e binários (pickle, struct), e use o modo offline para alimentar a ordenação/busca sem chamar a API.
        </p>
      </div>
      <PersistencePanel />
    </div>
  );
}
