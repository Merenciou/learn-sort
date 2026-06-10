import { useEffect, useRef, useState } from "react";
import { ALGORITHMS, ALGORITHM_KEYS, type AlgoKey, type SortStep } from "@/lib/algorithms";
import { ComparisonBar } from "./ComparisonBar";
import { Button } from "@/components/ui/button";
import { Play, Pause, RotateCcw, Trophy } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";

interface Props { array: number[] }

interface AlgoState {
  step: SortStep;
  done: boolean;
  elapsed: number;
  finishedAt: number | null;
}

const emptyStep = (a: number[]): SortStep => ({
  array: a.slice(), idxA: null, idxB: null, swapping: [], sorted: [],
  pivot: null, message: "", pseudoLine: 0, comparisons: 0, swaps: 0, processed: 0,
});

export function ComparisonGrid({ array }: Props) {
  const [states, setStates] = useState<Record<AlgoKey, AlgoState>>(() => initStates(array));
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(200);
  const [metric, setMetric] = useState<"comparisons" | "swaps" | "time">("comparisons");

  const gensRef = useRef<Record<AlgoKey, Generator<SortStep, void, unknown> | null>>(initGens(array));
  const startRef = useRef<Record<AlgoKey, number>>(initZero());

  function reset() {
    setStates(initStates(array));
    gensRef.current = initGens(array);
    startRef.current = initZero();
    setPlaying(false);
  }

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [array.join(",")]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      setStates((prev) => {
        const next = { ...prev };
        let anyActive = false;
        for (const k of ALGORITHM_KEYS) {
          if (next[k].done) continue;
          const gen = gensRef.current[k];
          if (!gen) continue;
          const r = gen.next();
          if (r.done) {
            next[k] = { ...next[k], done: true, finishedAt: performance.now() };
            continue;
          }
          anyActive = true;
          if (startRef.current[k] === 0) startRef.current[k] = performance.now();
          next[k] = {
            step: r.value, done: false,
            elapsed: performance.now() - startRef.current[k],
            finishedAt: null,
          };
        }
        if (!anyActive) setPlaying(false);
        return next;
      });
    }, speed);
    return () => clearInterval(id);
  }, [playing, speed]);

  const allDone = ALGORITHM_KEYS.every((k) => states[k].done);
  const fastest = ALGORITHM_KEYS
    .filter((k) => states[k].done && states[k].finishedAt !== null)
    .sort((a, b) => (states[a].finishedAt! - startRef.current[a]) - (states[b].finishedAt! - startRef.current[b]))[0];

  const chartData = ALGORITHM_KEYS.map((k) => ({
    name: ALGORITHMS[k].name.replace(" Sort", ""),
    comparisons: states[k].step.comparisons,
    swaps: states[k].step.swaps,
    time: Number(states[k].elapsed.toFixed(0)),
  }));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button onClick={() => setPlaying(true)} disabled={playing || allDone} size="sm">
          <Play className="size-4 mr-1" /> Play
        </Button>
        <Button onClick={() => setPlaying(false)} disabled={!playing} size="sm" variant="secondary">
          <Pause className="size-4 mr-1" /> Pause
        </Button>
        <Button onClick={reset} size="sm" variant="outline">
          <RotateCcw className="size-4 mr-1" /> Reset
        </Button>
        <div className="ml-2 flex-1 min-w-[200px] max-w-[320px] flex items-center gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">Velocidade</span>
          <Slider min={10} max={2000} step={10} value={[speed]} onValueChange={(v) => setSpeed(v[0])} />
          <span className="text-xs font-mono w-16 text-right">{speed} ms</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {ALGORITHM_KEYS.map((k) => {
          const s = states[k];
          const isFastest = fastest === k && s.done;
          return (
            <div key={k} className="rounded-md border bg-card p-3 space-y-2 relative">
              {s.done && (
                <div className="absolute top-2 right-2 flex gap-1">
                  {isFastest && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-yellow-400 text-yellow-950 font-semibold flex items-center gap-1">
                      <Trophy className="size-3" /> Mais rápido
                    </span>
                  )}
                  <span className="text-[10px] px-2 py-0.5 rounded bg-bar-sorted/30 text-emerald-700 dark:text-emerald-300 font-semibold">
                    Concluído ✓
                  </span>
                </div>
              )}
              <div className="font-semibold text-sm">{ALGORITHMS[k].name}</div>
              <ComparisonBar step={s.step} height={140} showLabels={false} />
              <div className="grid grid-cols-3 gap-1 text-[10px]">
                <Mini label="Comp." value={s.step.comparisons} />
                <Mini label="Trocas" value={s.step.swaps} />
                <Mini label="Tempo" value={`${s.elapsed.toFixed(0)}ms`} />
              </div>
            </div>
          );
        })}
      </div>

      <div className="rounded-md border bg-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Métricas ao vivo</div>
          <div className="flex gap-1">
            {(["comparisons", "swaps", "time"] as const).map((m) => (
              <Button
                key={m}
                size="sm"
                variant={metric === m ? "default" : "outline"}
                onClick={() => setMetric(m)}
              >
                {m === "comparisons" ? "Comparações" : m === "swaps" ? "Trocas" : "Tempo"}
              </Button>
            ))}
          </div>
        </div>
        <div style={{ height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} layout="vertical" margin={{ left: 20, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis type="number" tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip contentStyle={{ fontSize: 11 }} />
              <Bar dataKey={metric} fill="#a855f7">
                {chartData.map((_, i) => (
                  <Cell key={i} fill={["#a855f7", "#f59e0b", "#ef4444", "#10b981", "#3b82f6", "#ec4899"][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {allDone && (
        <FinalTable states={states} fastest={fastest} />
      )}
    </div>
  );
}

function Mini({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded bg-muted/50 px-1.5 py-1">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-mono font-semibold">{value}</div>
    </div>
  );
}

function FinalTable({ states, fastest }: { states: Record<AlgoKey, AlgoState>; fastest: AlgoKey | undefined }) {
  function exportCsv() {
    const rows = [
      ["Algoritmo", "Comparações", "Trocas", "Tempo (ms)", "Melhor", "Médio", "Pior"],
      ...ALGORITHM_KEYS.map((k) => {
        const meta = ALGORITHMS[k];
        const s = states[k];
        return [meta.name, s.step.comparisons, s.step.swaps, s.elapsed.toFixed(0), meta.complexity.best, meta.complexity.avg, meta.complexity.worst];
      }),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "comparison.csv"; a.click();
    URL.revokeObjectURL(url);
  }
  return (
    <div className="rounded-md border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Resultado final</div>
        <Button size="sm" variant="outline" onClick={exportCsv}>Exportar CSV</Button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs text-muted-foreground border-b">
            <tr>
              <th className="text-left py-2">Algoritmo</th>
              <th className="text-right">Comparações</th>
              <th className="text-right">Trocas</th>
              <th className="text-right">Tempo (ms)</th>
              <th className="text-right">Complexidade (melhor/médio/pior)</th>
            </tr>
          </thead>
          <tbody>
            {ALGORITHM_KEYS.map((k) => {
              const meta = ALGORITHMS[k];
              const s = states[k];
              return (
                <tr key={k} className={`border-b last:border-b-0 ${fastest === k ? "bg-bar-sorted/15" : ""}`}>
                  <td className="py-2">{meta.name}</td>
                  <td className="text-right font-mono">{s.step.comparisons}</td>
                  <td className="text-right font-mono">{s.step.swaps}</td>
                  <td className="text-right font-mono">{s.elapsed.toFixed(0)}</td>
                  <td className="text-right font-mono text-xs">{meta.complexity.best} / {meta.complexity.avg} / {meta.complexity.worst}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function initStates(a: number[]): Record<AlgoKey, AlgoState> {
  const o = {} as Record<AlgoKey, AlgoState>;
  for (const k of ALGORITHM_KEYS) o[k] = { step: emptyStep(a), done: false, elapsed: 0, finishedAt: null };
  return o;
}
function initGens(a: number[]) {
  const o = {} as Record<AlgoKey, Generator<SortStep, void, unknown> | null>;
  for (const k of ALGORITHM_KEYS) o[k] = ALGORITHMS[k].generator(a);
  return o;
}
function initZero() {
  const o = {} as Record<AlgoKey, number>;
  for (const k of ALGORITHM_KEYS) o[k] = 0;
  return o;
}
