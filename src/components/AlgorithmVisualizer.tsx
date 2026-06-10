import { useEffect, useMemo, useRef, useState } from "react";
import { ALGORITHMS, type AlgoKey, type SortStep } from "@/lib/algorithms";
import { ComparisonBar } from "./ComparisonBar";
import { PseudocodePanel } from "./PseudocodePanel";
import { StepNarrator } from "./StepNarrator";
import { ComplexityLiveChart } from "./ComplexityLiveChart";
import { Button } from "@/components/ui/button";
import { Play, Pause, SkipForward, RotateCcw } from "lucide-react";
import { Slider } from "@/components/ui/slider";

interface Props { array: number[]; algoKey: AlgoKey }

const emptyStep = (a: number[]): SortStep => ({
  array: a.slice(), idxA: null, idxB: null, swapping: [], sorted: [],
  pivot: null, message: "Aguardando início...", pseudoLine: 0,
  comparisons: 0, swaps: 0, processed: 0,
});

export function AlgorithmVisualizer({ array, algoKey }: Props) {
  const meta = ALGORITHMS[algoKey];
  const [step, setStep] = useState<SortStep>(() => emptyStep(array));
  const [playing, setPlaying] = useState(false);
  const [done, setDone] = useState(false);
  const [speed, setSpeed] = useState(200);
  const [elapsed, setElapsed] = useState(0);
  const [points, setPoints] = useState<{ x: number; real: number }[]>([]);

  const genRef = useRef<Generator<SortStep, void, unknown> | null>(null);
  const startTime = useRef<number>(0);

  const reset = () => {
    genRef.current = meta.generator(array);
    setStep(emptyStep(array));
    setPlaying(false);
    setDone(false);
    setElapsed(0);
    setPoints([]);
    startTime.current = 0;
  };

  useEffect(() => {
    reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [algoKey, array.join(",")]);

  const advance = () => {
    if (!genRef.current) genRef.current = meta.generator(array);
    const r = genRef.current.next();
    if (r.done) {
      setPlaying(false);
      setDone(true);
      return false;
    }
    const s = r.value;
    if (startTime.current === 0) startTime.current = performance.now();
    setStep(s);
    setElapsed(performance.now() - startTime.current);
    setPoints((p) => [...p, { x: s.processed, real: s.comparisons + s.swaps }]);
    return true;
  };

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      if (!advance()) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed]);

  return (
    <div className="grid lg:grid-cols-3 gap-4">
      <div className="lg:col-span-2 space-y-4">
        <div className="rounded-md border bg-card p-4">
          <ComparisonBar step={step} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setPlaying(true)} disabled={playing || done} size="sm">
            <Play className="size-4 mr-1" /> Play
          </Button>
          <Button onClick={() => setPlaying(false)} disabled={!playing || done} size="sm" variant="secondary">
            <Pause className="size-4 mr-1" /> Pause
          </Button>
          <Button onClick={() => advance()} disabled={playing || done} size="sm" variant="secondary">
            <SkipForward className="size-4 mr-1" /> Step
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

        <div className="grid grid-cols-3 gap-2">
          <Metric label="Comparações" value={step.comparisons} />
          <Metric label="Trocas" value={step.swaps} />
          <Metric label="Tempo" value={`${elapsed.toFixed(0)} ms`} />
        </div>

        <StepNarrator message={step.message} />

        <ComplexityLiveChart data={points} n={array.length} />

        {algoKey === "heap" && <HeapTreeView array={step.array} sorted={step.sorted} />}
      </div>

      <div className="space-y-4">
        <div className="rounded-md border bg-card p-4 space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Estrutura de dados</div>
          <div className="font-semibold">{meta.structure}</div>
        </div>
        <div className="rounded-md border bg-card p-4 space-y-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Como funciona</div>
          <p className="text-sm leading-relaxed">{meta.description}</p>
        </div>
        <PseudocodePanel lines={meta.pseudocode} activeLine={step.pseudoLine} />
        <div className="rounded-md border bg-card p-4 space-y-1 text-sm">
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Complexidade</div>
          <Row k="Melhor" v={meta.complexity.best} />
          <Row k="Médio" v={meta.complexity.avg} />
          <Row k="Pior" v={meta.complexity.worst} />
          <Row k="Espaço" v={meta.complexity.space} />
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border bg-card px-3 py-2">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="text-lg font-mono font-semibold">{value}</div>
    </div>
  );
}
function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between border-b last:border-b-0 py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className="font-mono">{v}</span>
    </div>
  );
}

function HeapTreeView({ array, sorted }: { array: number[]; sorted: number[] }) {
  const sortedSet = new Set(sorted);
  // Render levels until length
  const levels: number[][] = [];
  let i = 0, levelSize = 1;
  while (i < array.length) {
    const lvl: number[] = [];
    for (let k = 0; k < levelSize && i < array.length; k++, i++) {
      if (!sortedSet.has(i)) lvl.push(array[i]);
      else lvl.push(NaN);
    }
    levels.push(lvl);
    levelSize *= 2;
  }
  return (
    <div className="rounded-md border bg-card p-4">
      <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Árvore Heap</div>
      <div className="flex flex-col items-center gap-2">
        {levels.map((lvl, li) => (
          <div key={li} className="flex justify-center gap-2">
            {lvl.map((v, i) => (
              <div
                key={i}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-mono border ${
                  isNaN(v) ? "bg-bar-sorted/40 border-bar-sorted/40 text-muted-foreground" : "bg-bar-pivot/20 border-bar-pivot"
                }`}
              >
                {isNaN(v) ? "·" : v}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
