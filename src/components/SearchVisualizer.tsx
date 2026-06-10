import { useEffect, useMemo, useRef, useState } from "react";
import { binarySearch, linearSearch, BINARY_PSEUDO, LINEAR_PSEUDO, countBinary, countLinear, type SearchStep } from "@/lib/search";
import { PseudocodePanel } from "./PseudocodePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer, Legend } from "recharts";
import { Switch } from "@/components/ui/switch";

interface Props { array: number[]; names: string[]; isSorted: boolean }

const empty = (a: number[]): SearchStep => ({
  array: a.slice(), visited: [], current: null,
  low: null, mid: null, high: null, discarded: [], found: null,
  comparisons: 0, message: "Aguardando...", pseudoLine: 0,
});

export function SearchVisualizer({ array, names, isSorted }: Props) {
  const [target, setTarget] = useState("");
  const [mode, setMode] = useState<"linear" | "binary">("linear");
  const [step, setStep] = useState<SearchStep>(empty(array));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(300);
  const [done, setDone] = useState(false);
  const [linearComps, setLinearComps] = useState<number | null>(null);
  const [binaryComps, setBinaryComps] = useState<number | null>(null);
  const [substring, setSubstring] = useState("");
  const [logScale, setLogScale] = useState(false);

  const genRef = useRef<Generator<SearchStep> | null>(null);

  useEffect(() => {
    setStep(empty(array));
    setDone(false); setPlaying(false); genRef.current = null;
  }, [array]);

  const start = () => {
    const t = Number(target);
    if (isNaN(t)) return;
    genRef.current = mode === "linear" ? linearSearch(array, t) : binarySearch(array, t);
    setStep(empty(array));
    setDone(false);
    setPlaying(true);
  };

  const advance = () => {
    if (!genRef.current) return false;
    const r = genRef.current.next();
    if (r.done) { setPlaying(false); setDone(true); return false; }
    setStep(r.value);
    if (r.value.found !== null) {
      setDone(true); setPlaying(false);
      if (mode === "linear") setLinearComps(r.value.comparisons);
      else setBinaryComps(r.value.comparisons);
    }
    return true;
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => { if (!advance()) clearInterval(id); }, speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed]);

  const matches = useMemo(() => {
    if (!substring.trim()) return [] as number[];
    const q = substring.toLowerCase();
    return names.map((n, i) => (n.toLowerCase().includes(q) ? i : -1)).filter((i) => i >= 0).slice(0, 30);
  }, [names, substring]);

  const growthData = useMemo(() => {
    const sizes = [10, 50, 100, 500, 1000];
    return sizes.map((n) => {
      const arr = Array.from({ length: n }, (_, i) => i + 1);
      const t = arr[arr.length - 1]; // worst case
      return { n, linear: countLinear(arr, t), binary: countBinary(arr, t) };
    });
  }, []);

  const max = Math.max(1, ...array);

  return (
    <div className="space-y-6">
      <div className="rounded-md border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <label className="text-xs text-muted-foreground">Alvo (numérico)</label>
            <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="ex: 50" className="w-40" />
          </div>
          <div className="flex gap-2">
            <Button variant={mode === "linear" ? "default" : "outline"} size="sm" onClick={() => setMode("linear")}>Linear</Button>
            <Button
              variant={mode === "binary" ? "default" : "outline"}
              size="sm"
              onClick={() => setMode("binary")}
              disabled={!isSorted}
              title={!isSorted ? "Ordene o dataset antes de usar busca binária" : ""}
            >
              Binária {!isSorted && "(ordene primeiro)"}
            </Button>
          </div>
          <Button onClick={start} size="sm" disabled={!target}>
            <Play className="size-4 mr-1" /> Buscar
          </Button>
          <Button onClick={() => setPlaying(false)} size="sm" variant="secondary" disabled={!playing}>
            <Pause className="size-4 mr-1" />
          </Button>
          <Button onClick={advance} size="sm" variant="secondary" disabled={playing || done || !genRef.current}>
            <SkipForward className="size-4 mr-1" />
          </Button>
          <Button onClick={() => { setStep(empty(array)); setDone(false); genRef.current = null; }} size="sm" variant="outline">
            <RotateCcw className="size-4 mr-1" />
          </Button>
          <div className="ml-auto flex items-center gap-2 min-w-[200px]">
            <span className="text-xs text-muted-foreground">Velocidade</span>
            <Slider min={10} max={2000} step={10} value={[speed]} onValueChange={(v) => setSpeed(v[0])} />
            <span className="text-xs font-mono w-14 text-right">{speed} ms</span>
          </div>
        </div>

        <div className="relative h-48 flex items-end gap-[2px] border-t pt-2">
          {array.map((v, i) => {
            const h = (v / max) * 160;
            let bg = "bg-bar";
            if (step.discarded.includes(i)) bg = "bg-muted opacity-40";
            if (step.visited.includes(i)) bg = "bg-bar-compare-a";
            if (i === step.current) bg = "bg-bar-compare-b bar-pulse";
            if (i === step.low) bg = "bg-blue-400";
            if (i === step.high) bg = "bg-pink-400";
            if (i === step.mid) bg = "bg-bar-pivot";
            if (step.found === i) bg = "bg-bar-sorted";
            return <div key={i} className={`${bg} flex-1 rounded-t-sm`} style={{ height: Math.max(2, h) }} />;
          })}
        </div>
        {mode === "binary" && (
          <div className="flex gap-3 text-xs">
            <Legend2 color="bg-blue-400" label="início (low)" />
            <Legend2 color="bg-bar-pivot" label="meio (mid)" />
            <Legend2 color="bg-pink-400" label="fim (high)" />
            <Legend2 color="bg-muted opacity-50" label="descartado" />
          </div>
        )}

        <div className="text-sm">{step.message}</div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded border p-2 text-sm">
            Comparações (Linear): <span className="font-mono font-semibold">{linearComps ?? "—"}</span>
          </div>
          <div className="rounded border p-2 text-sm">
            Comparações (Binária): <span className="font-mono font-semibold">{binaryComps ?? "—"}</span>
          </div>
        </div>
      </div>

      <PseudocodePanel
        lines={mode === "linear" ? LINEAR_PSEUDO : BINARY_PSEUDO}
        activeLine={step.pseudoLine}
      />

      <div className="rounded-md border bg-card p-4 space-y-2">
        <div className="text-sm font-semibold">Busca por substring (nome)</div>
        <Input value={substring} onChange={(e) => setSubstring(e.target.value)} placeholder="Digite parte do nome..." />
        <div className="flex flex-wrap gap-1 mt-2">
          {matches.length === 0 ? (
            <span className="text-xs text-muted-foreground">{substring ? "Nenhum resultado" : "Comece a digitar"}</span>
          ) : (
            matches.map((i) => (
              <span key={i} className="text-xs px-2 py-1 rounded bg-bar-compare-a/30 border border-bar-compare-a/50">
                {names[i]}
              </span>
            ))
          )}
        </div>
      </div>

      <div className="rounded-md border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold">Crescimento de comparações</div>
          <div className="flex items-center gap-2 text-xs">
            <span>Escala log Y</span>
            <Switch checked={logScale} onCheckedChange={setLogScale} />
          </div>
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="n" tick={{ fontSize: 10 }} />
              <YAxis scale={logScale ? "log" : "auto"} domain={logScale ? [1, "auto"] : [0, "auto"]} allowDataOverflow tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Line type="monotone" dataKey="linear" name="Linear" stroke="#ef4444" />
              <Line type="monotone" dataKey="binary" name="Binária" stroke="#10b981" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function Legend2({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-3 h-3 rounded ${color}`} /> <span className="text-muted-foreground">{label}</span>
    </div>
  );
}
