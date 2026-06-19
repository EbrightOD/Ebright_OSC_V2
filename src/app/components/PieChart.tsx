"use client";

export interface PieSlice {
  label: string;
  value: number;
  color: string;
}

function polar(cx: number, cy: number, r: number, deg: number): [number, number] {
  const a = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
}

function wedgePath(cx: number, cy: number, r: number, start: number, end: number): string {
  const [sx, sy] = polar(cx, cy, r, start);
  const [ex, ey] = polar(cx, cy, r, end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${sx} ${sy} A ${r} ${r} 0 ${large} 1 ${ex} ${ey} Z`;
}

/** Dependency-free SVG pie chart with a legend (to the right, or below). */
export default function PieChart({
  data,
  size = 150,
  legend = "right",
}: {
  data: PieSlice[];
  size?: number;
  legend?: "right" | "bottom";
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) {
    return <p className="text-sm text-slate-400">No tasks to chart.</p>;
  }

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const single = data.length === 1;

  let angle = 0;
  const wedges = data.map((d, i) => {
    const start = angle;
    angle += (d.value / total) * 360;
    const end = angle;
    return single ? (
      <circle key={i} cx={cx} cy={cy} r={r} fill={d.color} />
    ) : (
      <path key={i} d={wedgePath(cx, cy, r, start, end)} fill={d.color} stroke="#fff" strokeWidth={1} />
    );
  });

  const bottom = legend === "bottom";

  return (
    <div className={bottom ? "flex flex-col items-center gap-4" : "flex items-center gap-5"}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0" role="img" aria-label="Tasks by status">
        {wedges}
      </svg>
      <ul className={bottom ? "flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs" : "text-xs space-y-1.5 min-w-0"}>
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-sm inline-block shrink-0" style={{ backgroundColor: d.color }} aria-hidden="true" />
            <span className="text-slate-700">{d.label}</span>
            <span className="text-slate-400 tabular-nums">
              {d.value} ({Math.round((d.value / total) * 100)}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
