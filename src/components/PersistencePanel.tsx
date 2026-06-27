import { useEffect, useState } from "react";
import { api, checkBackendOnline, type CompareResult, type InspectResult, type StorageFormat } from "@/lib/api-client";
import { useDataset } from "@/lib/dataset-context";
import { DATA_SOURCES } from "@/lib/datasources";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Download, HardDrive, FileText, Binary, AlertCircle, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

const FORMATS: StorageFormat[] = ["json", "csv", "pickle", "struct"];
const TEXT_FORMATS: StorageFormat[] = ["json", "csv"];
const BIN_FORMATS: StorageFormat[] = ["pickle", "struct"];

export function PersistencePanel() {
  const { source, setSource, setField, setItems, items } = useDataset();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [sourceId, setSourceId] = useState<string>(source?.id ?? DATA_SOURCES[0].id);
  const [format, setFormat] = useState<StorageFormat>("json");
  const [compare, setCompare] = useState<CompareResult | null>(null);
  const [textInspect, setTextInspect] = useState<InspectResult | null>(null);
  const [binInspect, setBinInspect] = useState<InspectResult | null>(null);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastOp, setLastOp] = useState<string | null>(null);

  useEffect(() => { checkBackendOnline().then(setBackendOnline); }, []);

  async function recheckBackend() {
    setBackendOnline(null);
    setBackendOnline(await checkBackendOnline());
  }

  async function doSaveAll() {
    setLoading("save"); setError(null);
    try {
      const r = await api.compare(sourceId);
      setCompare(r);
      setLastOp(`Salvou ${r.count} itens nos 4 formatos.`);
      await loadInspections();
    } catch (e: any) { setError(e.message); } finally { setLoading(null); }
  }

  async function loadInspections() {
    try {
      const [t, b] = await Promise.all([
        api.inspect(sourceId, "json"),
        api.inspect(sourceId, "pickle"),
      ]);
      setTextInspect(t); setBinInspect(b);
    } catch {}
  }

  async function doLoadOffline() {
    setLoading("load"); setError(null);
    try {
      const r = await api.load(sourceId, format);
      const src = DATA_SOURCES.find((s) => s.id === sourceId)!;
      setSource(src);
      setField(src.fields[0].key);
      setItems(r.items);
      setLastOp(`Carregado do disco: ${r.count} itens em ${r.load_ms} ms (${(r.size_bytes / 1024).toFixed(2)} KB, ${format}). Pronto para Visualizar/Comparar/Buscar.`);
    } catch (e: any) { setError(e.message); } finally { setLoading(null); }
  }

  async function doInspect(fmt: StorageFormat) {
    try {
      const r = await api.inspect(sourceId, fmt);
      if (r.is_text) setTextInspect(r); else setBinInspect(r);
    } catch (e: any) { setError(e.message); }
  }

  if (backendOnline === false) {
    const isLocalhost = api.baseUrl.includes("localhost") || api.baseUrl.includes("127.0.0.1");
    return (
      <div className="rounded-md border border-destructive bg-destructive/5 p-6 space-y-3">
        <div className="flex items-center gap-2 font-semibold text-destructive">
          <AlertCircle className="size-5" /> Backend Python offline
        </div>
        <p className="text-sm text-muted-foreground">
          Não foi possível conectar em <code className="font-mono text-xs">{api.baseUrl}</code>.
        </p>
        {isLocalhost ? (
          <>
            <p className="text-sm text-muted-foreground">Rode o backend FastAPI localmente:</p>
            <pre className="bg-card border rounded p-3 text-xs overflow-auto"><code>{`cd backend
python -m venv .venv
source .venv/bin/activate   # Windows: .venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000`}</code></pre>
            <p className="text-xs text-muted-foreground">
              Para publicar o app com o backend acessível ao seu professor, hospede o backend
              (Render / Railway / Fly.io) e defina <code className="font-mono">VITE_API_URL</code> no
              frontend apontando para essa URL. Detalhes em <code className="font-mono">README.md</code>.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              A URL configurada em <code className="font-mono">VITE_API_URL</code> não está respondendo.
              Pode ser cold start (Render free demora ~30s na primeira chamada) ou o serviço está fora do ar.
            </p>
            <p className="text-xs text-muted-foreground">
              Aguarde alguns segundos e clique em "Verificar novamente". Se persistir, confira o deploy do backend.
            </p>
          </>
        )}
        <Button size="sm" onClick={recheckBackend}><RefreshCw className="size-4" /> Verificar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2 font-semibold">
          <HardDrive className="size-4" /> Controles
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <div className="text-xs text-muted-foreground mb-1">Fonte</div>
            <Select value={sourceId} onValueChange={setSourceId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DATA_SOURCES.map((s) => <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <div className="text-xs text-muted-foreground mb-1">Formato (load offline)</div>
            <Select value={format} onValueChange={(v) => setFormat(v as StorageFormat)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => <SelectItem key={f} value={f}>{f}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end gap-2">
            <Button onClick={doSaveAll} disabled={loading !== null} className="flex-1">
              {loading === "save" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Salvar nos 4 formatos
            </Button>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={doLoadOffline} disabled={loading !== null}>
            {loading === "load" ? <Loader2 className="size-4 animate-spin" /> : <HardDrive className="size-4" />}
            Carregar do arquivo (offline)
          </Button>
          <span className="text-xs text-muted-foreground self-center">
            {items.length > 0 && `${items.length} itens carregados no app`}
          </span>
        </div>
        {lastOp && <div className="text-xs text-emerald-600 dark:text-emerald-400">{lastOp}</div>}
        {error && <div className="text-xs text-destructive">Erro: {error}</div>}
      </div>

      {compare && <ComparePanel data={compare} onInspect={doInspect} />}

      {(textInspect || binInspect) && (
        <div className="grid lg:grid-cols-2 gap-4">
          <InspectText data={textInspect} />
          <InspectBinary data={binInspect} />
        </div>
      )}
    </div>
  );
}

function ComparePanel({ data, onInspect }: { data: CompareResult; onInspect: (f: StorageFormat) => void }) {
  const chartData = data.results.map((r) => ({
    format: r.format,
    "Tamanho (KB)": r.size_kb,
    "Save (ms)": r.save_ms,
    "Load (ms)": r.load_ms,
  }));
  return (
    <div className="rounded-lg border bg-card p-5 space-y-4">
      <div className="font-semibold">Comparativo — {data.count} itens</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground border-b">
            <tr>
              <th className="text-left py-2">Formato</th>
              <th className="text-left">Tipo</th>
              <th className="text-right">Tamanho (KB)</th>
              <th className="text-right">Save (ms)</th>
              <th className="text-right">Load (ms)</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {data.results.map((r) => (
              <tr key={r.format} className="border-b last:border-0">
                <td className="py-2 font-mono">{r.format}</td>
                <td>{r.is_text ? <span className="text-emerald-600">texto</span> : <span className="text-amber-600">binário</span>}</td>
                <td className="text-right font-mono">{r.size_kb.toFixed(2)}</td>
                <td className="text-right font-mono">{r.save_ms.toFixed(2)}</td>
                <td className="text-right font-mono">{r.load_ms.toFixed(2)}</td>
                <td className="text-right">
                  <Button size="sm" variant="ghost" onClick={() => onInspect(r.format)}>inspecionar</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="format" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Tamanho (KB)" fill="hsl(var(--bar-pivot))" />
            <Bar dataKey="Save (ms)" fill="hsl(var(--bar-compare-b))" />
            <Bar dataKey="Load (ms)" fill="hsl(var(--bar-sorted))" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function InspectText({ data }: { data: InspectResult | null }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 font-semibold text-sm">
        <FileText className="size-4 text-emerald-600" /> Texto — legível ({data?.format ?? "—"})
      </div>
      <pre className="bg-muted/50 rounded p-3 text-[11px] font-mono overflow-auto max-h-80 whitespace-pre-wrap">
        {data && data.is_text ? data.preview : "Salve os arquivos para ver o conteúdo."}
      </pre>
    </div>
  );
}

function InspectBinary({ data }: { data: InspectResult | null }) {
  return (
    <div className="rounded-lg border bg-card p-4 space-y-2">
      <div className="flex items-center gap-2 font-semibold text-sm">
        <Binary className="size-4 text-amber-600" /> Binário — hexdump ({data?.format ?? "—"})
      </div>
      <div className="bg-muted/50 rounded p-3 text-[11px] font-mono overflow-auto max-h-80">
        {data && !data.is_text ? (
          <table>
            <tbody>
              {data.hexdump.map((row, i) => (
                <tr key={i}>
                  <td className="text-muted-foreground pr-3">{row.offset}</td>
                  <td className="pr-3 whitespace-nowrap">{row.hex}</td>
                  <td className="text-muted-foreground">{row.ascii}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : "Salve os arquivos para ver o hexdump."}
      </div>
    </div>
  );
}
