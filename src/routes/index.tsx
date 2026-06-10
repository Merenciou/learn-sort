import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { DATA_SOURCES, loadDataSource, type DataSource } from "@/lib/datasources";
import { useDataset } from "@/lib/dataset-context";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Database, BarChart3, Search } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AlgoLab — Visualizador de Algoritmos" },
      { name: "description", content: "Escolha uma fonte de dados pública e explore algoritmos de ordenação e busca em ação." },
    ],
  }),
  component: Home,
});

function Home() {
  const { source, setSource, field, setField, items, setItems, size, setSize } = useDataset();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pick(src: DataSource) {
    setLoading(true); setError(null);
    try {
      const data = await loadDataSource(src);
      setSource(src);
      setItems(data);
      setField(src.fields[0].key);
    } catch (e: any) {
      setError(e.message ?? "Falha ao carregar API");
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-8">
      <section className="text-center space-y-3 py-6">
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight">
          Veja algoritmos <span className="bg-gradient-to-r from-bar-pivot via-bar-compare-b to-bar-sorted bg-clip-text text-transparent">em ação</span>
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Carregue dados reais de uma API pública e visualize passo a passo como diferentes algoritmos de ordenação e busca operam sobre eles.
        </p>
      </section>

      <section className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 font-semibold">
          <Database className="size-4" /> 1. Escolha uma fonte de dados
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {DATA_SOURCES.map((s) => (
            <button
              key={s.id}
              onClick={() => pick(s)}
              className={`text-left rounded-md border p-3 transition-colors hover:bg-accent ${
                source?.id === s.id ? "border-primary bg-primary/5" : ""
              }`}
            >
              <div className="font-semibold text-sm">{s.label}</div>
              <div className="text-[10px] text-muted-foreground mt-1 truncate">{s.fields.length} campos</div>
            </button>
          ))}
        </div>
        {loading && (
          <div className="text-sm text-muted-foreground flex items-center gap-2"><Loader2 className="size-4 animate-spin" /> Carregando dataset...</div>
        )}
        {error && <div className="text-sm text-destructive">Erro: {error}</div>}
      </section>

      {source && items.length > 0 && (
        <section className="rounded-lg border bg-card p-5 space-y-4">
          <div className="flex items-center gap-2 font-semibold">
            <BarChart3 className="size-4" /> 2. Configure o dataset
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-muted-foreground mb-2">Campo de ordenação</div>
              <div className="flex flex-wrap gap-2">
                {source.fields.map((f) => (
                  <Button
                    key={f.key}
                    size="sm"
                    variant={field === f.key ? "default" : "outline"}
                    onClick={() => setField(f.key)}
                  >
                    {f.label}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground mb-2">Tamanho do array: <span className="font-mono">{size}</span></div>
              <Slider min={5} max={Math.min(80, items.length)} step={1} value={[size]} onValueChange={(v) => setSize(v[0])} />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">
            {items.length} itens carregados de <span className="font-semibold">{source.label}</span>.
          </div>
          <div className="grid sm:grid-cols-3 gap-3 pt-2">
            <ActionCard to="/visualize" icon={<BarChart3 className="size-5" />} title="Visualizar" desc="Animação passo a passo de um algoritmo" />
            <ActionCard to="/compare" icon={<BarChart3 className="size-5" />} title="Comparar" desc="Todos os algoritmos em tempo real" />
            <ActionCard to="/search" icon={<Search className="size-5" />} title="Buscar" desc="Linear, binária e por substring" />
          </div>
        </section>
      )}
    </div>
  );
}

function ActionCard({ to, icon, title, desc }: { to: string; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Link to={to} className="rounded-md border p-4 hover:border-primary hover:bg-primary/5 transition-colors block">
      <div className="flex items-center gap-2 font-semibold">{icon}{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{desc}</div>
    </Link>
  );
}
