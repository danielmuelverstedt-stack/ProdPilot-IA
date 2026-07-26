export interface ChartPoint {
  label: string;
  value: number;
}

/** Aire/ligne minimaliste en SVG, sans dépendance externe : réservé aux petites tendances de tableau de bord. */
export function MiniAreaChart({ data, color = "var(--app-primary)", height = 96, valueSuffix = "" }: { data: ChartPoint[]; color?: string; height?: number; valueSuffix?: string }) {
  const width = 100;
  const max = Math.max(1, ...data.map((point) => point.value));
  const stepX = data.length > 1 ? width / (data.length - 1) : 0;
  const points = data.map((point, index) => ({ x: index * stepX, y: height - (point.value / max) * (height - 16) - 8, ...point }));
  const linePath = points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  const lastPoint = points[points.length - 1];
  const areaPath = lastPoint ? `${linePath} L${lastPoint.x.toFixed(2)},${height} L0,${height} Z` : "";

  return <div>
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="h-24 w-full" role="img" aria-label="Graphique d’évolution">
      {areaPath ? <path d={areaPath} fill={color} fillOpacity={0.12} stroke="none" /> : null}
      <path d={linePath} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point) => <circle key={point.label} cx={point.x} cy={point.y} r={1.8} fill={color} vectorEffect="non-scaling-stroke" />)}
    </svg>
    <div className="mt-1 flex justify-between text-[10px] font-medium text-slate-400">
      {data.map((point) => <span key={point.label} title={`${point.value.toLocaleString("fr-BE")}${valueSuffix}`}>{point.label}</span>)}
    </div>
  </div>;
}
