import type { SortStep } from "@/lib/algorithms";

interface Props {
  step: SortStep;
  height?: number;
  showLabels?: boolean;
}

export function ComparisonBar({ step, height = 320, showLabels = true }: Props) {
  const { array, idxA, idxB, swapping, sorted, pivot } = step;
  const max = Math.max(1, ...array);
  const sortedSet = new Set(sorted);
  const swapSet = new Set(swapping);

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Connector SVG */}
      {idxA !== null && idxB !== null && array.length > 0 && (
        <Connector idxA={idxA} idxB={idxB} array={array} max={max} height={height} />
      )}
      <div className="flex items-end gap-[2px] h-full w-full px-1">
        {array.map((v, i) => {
          const h = (v / max) * (height - 40);
          let bg = "bg-bar";
          let cls = "";
          let label: string | null = null;
          let labelBg = "";
          if (sortedSet.has(i)) bg = "bg-bar-sorted";
          if (pivot === i) bg = "bg-bar-pivot";
          if (i === idxA) {
            bg = "bg-bar-compare-a";
            cls = "bar-pulse border-t-4 border-amber-500";
            label = String(v); labelBg = "bg-amber-400 text-amber-950";
          }
          if (i === idxB) {
            bg = "bg-bar-compare-b";
            cls = "bar-pulse border-t-4 border-orange-500";
            label = String(v); labelBg = "bg-orange-400 text-orange-950";
          }
          if (swapSet.has(i)) {
            bg = "bg-bar-swap";
            cls = "bar-shake";
          }
          return (
            <div key={i} className="relative flex-1 flex flex-col items-center justify-end" style={{ minWidth: 2 }}>
              {showLabels && label !== null && (
                <div className={`absolute -top-1 ${labelBg} text-[10px] px-1 rounded font-mono z-10`}>
                  {label}
                </div>
              )}
              {pivot === i && (
                <div className="absolute -top-5 text-[9px] font-semibold text-purple-700 dark:text-purple-300">pivô</div>
              )}
              <div
                className={`${bg} ${cls} w-full rounded-t-sm transition-colors duration-150`}
                style={{ height: Math.max(2, h) }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Connector({ idxA, idxB, array, max, height }: { idxA: number; idxB: number; array: number[]; max: number; height: number }) {
  const n = array.length;
  if (n === 0) return null;
  const wPct = (i: number) => ((i + 0.5) / n) * 100;
  const xA = wPct(idxA);
  const xB = wPct(idxB);
  const yA = height - 40 - (array[idxA] / max) * (height - 40);
  const yB = height - 40 - (array[idxB] / max) * (height - 40);
  const top = Math.min(yA, yB) - 14;
  const left = Math.min(xA, xB);
  const right = Math.max(xA, xB);
  const midX = (left + right) / 2;
  return (
    <svg className="absolute inset-0 pointer-events-none" width="100%" height="100%" style={{ overflow: "visible" }}>
      <line
        x1={`${left}%`} y1={top} x2={`${right}%`} y2={top}
        stroke="currentColor" className="text-amber-500"
        strokeWidth="1.5" strokeDasharray="4 3"
      />
      <text x={`${midX}%`} y={top - 4} textAnchor="middle" className="fill-amber-600 text-[10px] font-semibold">
        ↔ comparando
      </text>
    </svg>
  );
}
