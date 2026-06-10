import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { useMemo } from "react";

interface Point { x: number; real: number }

interface Props {
  data: Point[];
  n: number;
}

export function ComplexityLiveChart({ data, n }: Props) {
  const enriched = useMemo(() => {
    if (data.length === 0) return [];
    const maxReal = Math.max(...data.map((d) => d.real), 1);
    const nMax = Math.max(n, 2);
    const n2max = nMax * nMax;
    const nlognMax = nMax * Math.log2(nMax || 2);
    return data.map((d) => {
      const x = d.x;
      const n2 = x * x;
      const nlogn = x * Math.log2(Math.max(2, x));
      return {
        x: d.x,
        real: d.real,
        n2: (n2 / n2max) * maxReal,
        nlogn: (nlogn / nlognMax) * maxReal,
      };
    });
  }, [data, n]);

  return (
    <div className="rounded-md border bg-card p-2" style={{ height: 200 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={enriched} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
          <XAxis dataKey="x" tick={{ fontSize: 10 }} label={{ value: "elementos processados", position: "insideBottom", offset: -2, fontSize: 10 }} />
          <YAxis tick={{ fontSize: 10 }} />
          <Tooltip contentStyle={{ fontSize: 11 }} />
          <Legend wrapperStyle={{ fontSize: 10 }} />
          <Line type="monotone" dataKey="real" name="operações reais" stroke="#a855f7" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="n2" name="O(n²) teórico" stroke="#ef4444" strokeDasharray="4 4" dot={false} />
          <Line type="monotone" dataKey="nlogn" name="O(n log n) teórico" stroke="#10b981" strokeDasharray="4 4" dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
