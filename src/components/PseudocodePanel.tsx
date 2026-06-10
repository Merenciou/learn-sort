interface Props {
  lines: string[];
  activeLine: number;
}

export function PseudocodePanel({ lines, activeLine }: Props) {
  return (
    <div className="rounded-md border bg-card overflow-hidden">
      <div className="px-3 py-2 border-b text-xs font-semibold text-muted-foreground">Pseudocódigo</div>
      <div className="max-h-64 overflow-auto font-mono text-xs">
        {lines.map((line, i) => (
          <div
            key={i}
            className={`px-3 py-1 whitespace-pre ${
              i === activeLine ? "bg-amber-200/60 dark:bg-amber-500/20 border-l-2 border-amber-500" : ""
            }`}
          >
            <span className="text-muted-foreground mr-2">{String(i + 1).padStart(2, "0")}</span>
            {line}
          </div>
        ))}
      </div>
    </div>
  );
}
