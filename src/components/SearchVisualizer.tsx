import { useEffect, useMemo, useRef, useState } from "react";
import {
  binarySearch,
  linearSearch,
  substringSearch,
  BINARY_PSEUDO,
  LINEAR_PSEUDO,
  countBinary,
  countLinear,
  type SearchStep,
  type SubstringStep,
} from "@/lib/search";
import { PseudocodePanel } from "./PseudocodePanel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Play, Pause, SkipForward, RotateCcw, Check } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FieldDef } from "@/lib/datasources";

interface Props {
  values: number[];          // values for currently selected local field, in dataset order
  sortedValues: number[];    // ascending-sorted copy
  names: string[];
  fields: FieldDef[];
  selectedField: string;
  onFieldChange: (f: string) => void;
}

const emptySearch = (a: number[]): SearchStep => ({
  array: a.slice(),
  visited: [],
  current: null,
  low: null,
  mid: null,
  high: null,
  discarded: [],
  found: null,
  comparisons: 0,
  message: "Aguardando início...",
  pseudoLine: 0,
});

export function SearchVisualizer({
  values,
  sortedValues,
  names,
  fields,
  selectedField,
  onFieldChange,
}: Props) {
  const [target, setTarget] = useState("");
  const [speed, setSpeed] = useState(400);
  const [playing, setPlaying] = useState(false);

  const [linearStep, setLinearStep] = useState<SearchStep>(emptySearch(values));
  const [binaryStep, setBinaryStep] = useState<SearchStep>(emptySearch(sortedValues));
  const [linearDone, setLinearDone] = useState(false);
  const [binaryDone, setBinaryDone] = useState(false);

  const linearGen = useRef<Generator<SearchStep> | null>(null);
  const binaryGen = useRef<Generator<SearchStep> | null>(null);

  // Reset whenever inputs change
  useEffect(() => {
    setLinearStep(emptySearch(values));
    setBinaryStep(emptySearch(sortedValues));
    setLinearDone(false);
    setBinaryDone(false);
    setPlaying(false);
    linearGen.current = null;
    binaryGen.current = null;
  }, [values, sortedValues]);

  const startBoth = () => {
    const t = Number(target);
    if (Number.isNaN(t)) return;
    linearGen.current = linearSearch(values, t);
    binaryGen.current = binarySearch(sortedValues, t);
    setLinearStep(emptySearch(values));
    setBinaryStep(emptySearch(sortedValues));
    setLinearDone(false);
    setBinaryDone(false);
    setPlaying(true);
  };

  const stepOnce = () => {
    let anyAdvanced = false;
    if (linearGen.current && !linearDone) {
      const r = linearGen.current.next();
      if (r.done) setLinearDone(true);
      else {
        anyAdvanced = true;
        setLinearStep(r.value);
        if (r.value.found !== null) setLinearDone(true);
      }
    }
    if (binaryGen.current && !binaryDone) {
      const r = binaryGen.current.next();
      if (r.done) setBinaryDone(true);
      else {
        anyAdvanced = true;
        setBinaryStep(r.value);
        if (r.value.found !== null) setBinaryDone(true);
      }
    }
    return anyAdvanced;
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (!stepOnce()) {
        setPlaying(false);
        clearInterval(id);
      }
    }, speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, linearDone, binaryDone]);

  useEffect(() => {
    if (linearDone && binaryDone) setPlaying(false);
  }, [linearDone, binaryDone]);

  const reset = () => {
    setLinearStep(emptySearch(values));
    setBinaryStep(emptySearch(sortedValues));
    setLinearDone(false);
    setBinaryDone(false);
    setPlaying(false);
    linearGen.current = null;
    binaryGen.current = null;
  };

  const bothFinished = linearDone && binaryDone;
  const linearComps = linearStep.comparisons;
  const binaryComps = binaryStep.comparisons;
  const linearWins = bothFinished && linearComps < binaryComps;
  const binaryWins = bothFinished && binaryComps < linearComps;

  return (
    <div className="space-y-6">
      {/* Controls header */}
      <div className="rounded-md border bg-card p-4 space-y-3">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="text-xs text-muted-foreground block">Campo de busca</label>
            <Select value={selectedField} onValueChange={onFieldChange}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecione campo" />
              </SelectTrigger>
              <SelectContent>
                {fields.map((f) => (
                  <SelectItem key={f.key} value={f.key}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs text-muted-foreground block">Alvo (numérico)</label>
            <Input
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="ex: 50"
              className="w-36"
            />
          </div>
          <Button onClick={startBoth} size="sm" disabled={!target}>
            <Play className="size-4 mr-1" /> Buscar (Linear + Binária)
          </Button>
          <Button onClick={() => setPlaying((p) => !p)} size="sm" variant="secondary" disabled={!linearGen.current || bothFinished}>
            {playing ? <Pause className="size-4 mr-1" /> : <Play className="size-4 mr-1" />}
            {playing ? "Pausar" : "Continuar"}
          </Button>
          <Button onClick={stepOnce} size="sm" variant="secondary" disabled={playing || bothFinished || !linearGen.current}>
            <SkipForward className="size-4 mr-1" /> Passo
          </Button>
          <Button onClick={reset} size="sm" variant="outline">
            <RotateCcw className="size-4 mr-1" /> Reset
          </Button>
          <div className="ml-auto flex items-center gap-2 min-w-[220px]">
            <span className="text-xs text-muted-foreground">Velocidade</span>
            <Slider min={50} max={2000} step={50} value={[speed]} onValueChange={(v) => setSpeed(v[0])} />
            <span className="text-xs font-mono w-14 text-right">{speed}ms</span>
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Ambos os algoritmos executam simultaneamente. A Busca Binária usa uma cópia ordenada do array do campo selecionado.
        </div>
      </div>

      {/* Two side-by-side panels */}
      <div className="grid lg:grid-cols-2 gap-4">
        <AlgoPanel
          title="Busca Linear"
          subtitle="array na ordem original"
          pseudo={LINEAR_PSEUDO}
          step={linearStep}
          done={linearDone}
          winner={linearWins}
          color="linear"
        />
        <AlgoPanel
          title="Busca Binária"
          subtitle="usando array ordenado"
          pseudo={BINARY_PSEUDO}
          step={binaryStep}
          done={binaryDone}
          winner={binaryWins}
          color="binary"
          showPointers
        />
      </div>

      {/* Final comparison summary */}
      {bothFinished && (
        <div className="grid sm:grid-cols-2 gap-3">
          <ResultCard label="Busca Linear" comps={linearComps} winner={linearWins} found={linearStep.found} />
          <ResultCard label="Busca Binária" comps={binaryComps} winner={binaryWins} found={binaryStep.found} />
        </div>
      )}

      {/* Substring section */}
      <SubstringSection names={names} values={values} fieldLabel={fields.find((f) => f.key === selectedField)?.label ?? ""} />

      {/* Growth chart */}
      <GrowthChart currentN={values.length} />
    </div>
  );
}

/* -------- Algorithm Panel -------- */
function AlgoPanel({
  title,
  subtitle,
  pseudo,
  step,
  done,
  winner,
  color,
  showPointers,
}: {
  title: string;
  subtitle: string;
  pseudo: string[];
  step: SearchStep;
  done: boolean;
  winner: boolean;
  color: "linear" | "binary";
  showPointers?: boolean;
}) {
  const max = Math.max(1, ...step.array);
  return (
    <div className={`rounded-md border bg-card p-3 space-y-2 ${winner ? "ring-2 ring-green-500" : ""}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="font-semibold text-sm">{title}</div>
          <div className="text-xs text-muted-foreground">{subtitle}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs">Comparações:</span>
          <span className="font-mono font-bold tabular-nums">{step.comparisons}</span>
          {done && (
            <span className={`text-xs px-2 py-0.5 rounded ${winner ? "bg-green-500/20 text-green-600 dark:text-green-400" : "bg-muted"}`}>
              {winner ? "🏆 menos comparações" : "concluído"}
            </span>
          )}
        </div>
      </div>

      <div className="relative h-36 flex items-end gap-[2px] border-t pt-2">
        {step.array.map((v, i) => {
          const h = (v / max) * 120;
          let bg = "bg-bar";
          if (step.discarded.includes(i)) bg = "bg-muted opacity-30";
          if (step.visited.includes(i)) bg = color === "linear" ? "bg-bar-compare-a" : "bg-bar-compare-a";
          if (i === step.current) bg = "bg-bar-compare-b bar-pulse";
          if (showPointers && i === step.low) bg = "bg-blue-400";
          if (showPointers && i === step.high) bg = "bg-pink-400";
          if (showPointers && i === step.mid) bg = "bg-bar-pivot";
          if (step.found === i) bg = "bg-bar-sorted";
          return <div key={i} className={`${bg} flex-1 rounded-t-sm`} style={{ height: Math.max(2, h) }} />;
        })}
      </div>

      {showPointers && (
        <div className="flex flex-wrap gap-3 text-[10px]">
          <Legend2 color="bg-blue-400" label="low" />
          <Legend2 color="bg-bar-pivot" label="mid" />
          <Legend2 color="bg-pink-400" label="high" />
          <Legend2 color="bg-muted opacity-40" label="descartado" />
        </div>
      )}

      <div className="text-xs text-muted-foreground min-h-[2.5em]">{step.message}</div>

      <PseudocodePanel lines={pseudo} activeLine={step.pseudoLine} />
    </div>
  );
}

function ResultCard({
  label,
  comps,
  winner,
  found,
}: {
  label: string;
  comps: number;
  winner: boolean;
  found: number | null;
}) {
  return (
    <div className={`rounded-md border p-3 ${winner ? "border-green-500 bg-green-500/10" : "bg-card"}`}>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-2xl font-mono font-bold ${winner ? "text-green-600 dark:text-green-400" : ""}`}>
        {comps}
        <span className="text-xs font-normal ml-2 text-muted-foreground">comparações</span>
      </div>
      <div className="text-xs mt-1">
        {found === null || found === -1 ? "não encontrado" : `encontrado em posição ${found}`}
      </div>
    </div>
  );
}

function Legend2({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1">
      <div className={`w-2.5 h-2.5 rounded ${color}`} />
      <span className="text-muted-foreground">{label}</span>
    </div>
  );
}

/* -------- Substring Search Section -------- */
function SubstringSection({
  names,
  values,
  fieldLabel,
}: {
  names: string[];
  values: number[];
  fieldLabel: string;
}) {
  const [query, setQuery] = useState("");
  const [step, setStep] = useState<SubstringStep | null>(null);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(250);
  const [done, setDone] = useState(false);
  const gen = useRef<Generator<SubstringStep> | null>(null);

  // Reset on query/names change
  useEffect(() => {
    gen.current = null;
    setStep(null);
    setDone(false);
    setPlaying(false);
  }, [query, names]);

  const start = () => {
    if (!query.trim()) return;
    gen.current = substringSearch(names, query.trim());
    setStep(null);
    setDone(false);
    setPlaying(true);
  };

  const advance = () => {
    if (!gen.current) {
      if (!query.trim()) return false;
      gen.current = substringSearch(names, query.trim());
    }
    const r = gen.current.next();
    if (r.done) {
      setDone(true);
      return false;
    }
    setStep(r.value);
    if (r.value.done) setDone(true);
    return !r.value.done;
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (!advance()) {
        setPlaying(false);
        clearInterval(id);
      }
    }, speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed]);

  const reset = () => {
    gen.current = null;
    setStep(null);
    setDone(false);
    setPlaying(false);
  };

  const q = query.trim().toLowerCase();

  return (
    <div className="rounded-md border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="font-semibold text-sm">Busca por substring (nome)</div>
          <div className="text-xs text-muted-foreground">
            Percorre cada item verificando se o nome contém o texto procurado.
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ex: char"
          className="w-48"
        />
        <Button size="sm" onClick={start} disabled={!query.trim()}>
          <Play className="size-4 mr-1" /> Iniciar
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setPlaying((p) => !p)} disabled={!gen.current || done}>
          {playing ? <Pause className="size-4 mr-1" /> : <Play className="size-4 mr-1" />}
          {playing ? "Pausar" : "Continuar"}
        </Button>
        <Button size="sm" variant="secondary" onClick={advance} disabled={playing || done || !query.trim()}>
          <SkipForward className="size-4 mr-1" /> Passo
        </Button>
        <Button size="sm" variant="outline" onClick={reset}>
          <RotateCcw className="size-4 mr-1" /> Reset
        </Button>
        <div className="ml-auto flex items-center gap-2 min-w-[200px]">
          <span className="text-xs text-muted-foreground">Velocidade</span>
          <Slider min={50} max={1500} step={50} value={[speed]} onValueChange={(v) => setSpeed(v[0])} />
          <span className="text-xs font-mono w-14 text-right">{speed}ms</span>
        </div>
      </div>

      {/* Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
        <div className="rounded border p-2">
          Verificados:{" "}
          <span className="font-mono font-semibold">
            {step?.checked.length ?? 0} / {names.length}
          </span>
        </div>
        <div className="rounded border p-2">
          Correspondências: <span className="font-mono font-semibold text-green-600 dark:text-green-400">{step?.matches.length ?? 0}</span>
        </div>
        <div className="rounded border p-2 col-span-2 sm:col-span-1">
          Status: <span className="font-semibold">{done ? "concluído" : step ? "em andamento" : "aguardando"}</span>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
        {names.map((n, i) => {
          const checked = step?.checked.includes(i);
          const isMatch = step?.matches.includes(i);
          const isCurrent = step && !step.done && step.index === i;
          const justFailed = isCurrent && !step!.matched;

          let cls = "border bg-background opacity-90";
          if (checked && !isMatch) cls = "border bg-muted opacity-40";
          if (isMatch) cls = "border-green-500 bg-green-500/15";
          if (isCurrent && step!.matched) cls = "border-green-500 bg-green-500/25 scale-105";
          if (justFailed) cls = "border-red-400 bg-red-500/20 scale-105";
          if (isCurrent) cls += " ring-2 ring-amber-400 animate-pulse";

          return (
            <div key={i} className={`rounded-md p-2 transition-all text-xs ${cls}`}>
              <div className="font-medium truncate flex items-center gap-1">
                {isMatch && <Check className="size-3 text-green-600 dark:text-green-400 shrink-0" />}
                <span>{highlight(n, q)}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mt-0.5">
                {fieldLabel}: <span className="font-mono">{values[i]}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-xs text-muted-foreground min-h-[1.5em]">
        {step?.message ?? "Digite um texto e clique em Iniciar."}
      </div>
    </div>
  );
}

function highlight(text: string, q: string) {
  if (!q) return text;
  const idx = text.toLowerCase().indexOf(q);
  if (idx < 0) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-amber-300/70 dark:bg-amber-400/40 text-foreground rounded px-0.5">
        {text.slice(idx, idx + q.length)}
      </mark>
      {text.slice(idx + q.length)}
    </>
  );
}

/* -------- Growth chart (improved) -------- */
function GrowthChart({ currentN }: { currentN: number }) {
  const [logScale, setLogScale] = useState(true);

  const data = useMemo(() => {
    const sizes = [1, 5, 10, 25, 50, 100, 250, 500, 1000, 5000, 10000, 100000, 1000000];
    return sizes.map((n) => ({
      n,
      linear: n,                            // worst case O(n)
      binary: Math.max(1, Math.ceil(Math.log2(n + 1))), // O(log n)
    }));
  }, []);

  const linearAtN = currentN;
  const binaryAtN = currentN > 0 ? Math.max(1, Math.ceil(Math.log2(currentN + 1))) : 0;

  return (
    <div className="rounded-md border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <div className="text-sm font-semibold">Crescimento de comparações (pior caso)</div>
          <div className="text-xs text-muted-foreground">
            Compare quantas comparações cada algoritmo faz à medida que o tamanho do array cresce.
            Para N = <span className="font-mono">{currentN}</span>: Linear ≈ <span className="font-mono text-rose-500">{linearAtN}</span>, Binária ≈{" "}
            <span className="font-mono text-emerald-500">{binaryAtN}</span>.
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span>Escala logarítmica</span>
          <Switch checked={logScale} onCheckedChange={setLogScale} />
        </div>
      </div>
      <div style={{ height: 260 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis
              dataKey="n"
              scale={logScale ? "log" : "auto"}
              domain={logScale ? [1, "auto"] : [0, "auto"]}
              type="number"
              allowDataOverflow
              tick={{ fontSize: 10 }}
              label={{ value: "Tamanho do array (N)", position: "insideBottom", offset: -2, style: { fontSize: 10 } }}
            />
            <YAxis
              scale={logScale ? "log" : "auto"}
              domain={logScale ? [1, "auto"] : [0, "auto"]}
              allowDataOverflow
              tick={{ fontSize: 10 }}
              label={{ value: "Comparações", angle: -90, position: "insideLeft", style: { fontSize: 10 } }}
            />
            <Tooltip
              contentStyle={{ fontSize: 11 }}
              formatter={(v: number, name: string) => [v.toLocaleString(), name]}
              labelFormatter={(l) => `N = ${Number(l).toLocaleString()}`}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="linear" name="Linear O(n)" stroke="#ef4444" dot={false} strokeWidth={2} />
            <Line type="monotone" dataKey="binary" name="Binária O(log n)" stroke="#10b981" dot={false} strokeWidth={2} />
            {currentN > 0 && (
              <ReferenceLine
                x={currentN}
                stroke="#f59e0b"
                strokeDasharray="4 4"
                label={{ value: `N atual = ${currentN}`, position: "top", fill: "#f59e0b", fontSize: 10 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className="text-[11px] text-muted-foreground">
        Para N = 1.000.000, a busca linear pode precisar de até <span className="font-mono">1.000.000</span> comparações,
        enquanto a binária precisa de apenas <span className="font-mono">~20</span>. Essa é a diferença entre O(n) e O(log n).
      </div>
    </div>
  );
}
