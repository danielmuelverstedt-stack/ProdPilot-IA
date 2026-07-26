export interface ChartBar {
  label: string;
  value: number;
  color?: string;
}

/** Barres verticales minimalistes en CSS pur : réservé aux petites comparaisons de tableau de bord. */
export function MiniBarChart({ data, height = 96, valueFormatter }: { data: ChartBar[]; height?: number; valueFormatter?: (value: number) => string }) {
  const max = Math.max(1, ...data.map((bar) => bar.value));
  return <div className="flex items-end gap-4" style={{ height }}>
    {data.map((bar) => <div key={bar.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
      <span className="text-xs font-semibold text-[var(--app-text)]">{valueFormatter ? valueFormatter(bar.value) : bar.value.toLocaleString("fr-BE")}</span>
      <div className="w-full max-w-14 rounded-t-md" style={{ height: `${Math.max(4, (bar.value / max) * (height - 32))}px`, backgroundColor: bar.color ?? "var(--app-primary)" }} />
      <span className="truncate text-[10px] font-medium text-slate-400">{bar.label}</span>
    </div>)}
  </div>;
}
