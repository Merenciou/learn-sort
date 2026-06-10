export function StepNarrator({ message }: { message: string }) {
  return (
    <div className="rounded-md border bg-muted/40 px-4 py-3 min-h-[58px]">
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Narração do passo</div>
      <div className="text-sm font-medium">{message || "—"}</div>
    </div>
  );
}
