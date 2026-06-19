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

/**
 * ClickUp-dashboard-style pie: filled slices with leader-line labels ("STATUS n")
 * around the chart, plus a legend row beneath. Designed for dark cards.
 */
export default function ClickUpStatusPie({ data, radius = 82 }: { data: PieSlice[]; radius?: number }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <p className="text-sm text-slate-400">No tasks.</p>;

  const sideRoom = 120;
  const W = radius * 2 + sideRoom * 2;
  const topPad = 18;
  const H = radius * 2 + topPad * 2;
  const cx = W / 2;
  const cy = radius + topPad;
  const single = data.length === 1;

  let angle = 0;
  const wedges: React.ReactNode[] = [];
  const labels: React.ReactNode[] = [];

  data.forEach((d, i) => {
    const start = angle;
    angle += (d.value / total) * 360;
    const end = angle;
    const mid = (start + end) / 2;

    wedges.push(
      single ? (
        <circle key={`w${i}`} cx={cx} cy={cy} r={radius} fill={d.color} />
      ) : (
        <path key={`w${i}`} d={wedgePath(cx, cy, radius, start, end)} fill={d.color} stroke="#18181b" strokeWidth={1.5} />
      ),
    );

    const [ex, ey] = polar(cx, cy, radius, mid);
    const [ox, oy] = polar(cx, cy, radius + 12, mid);
    const right = ox >= cx;
    const cornerX = right ? W - 10 : 10;

    labels.push(
      <g key={`l${i}`}>
        <polyline points={`${ex},${ey} ${ox},${oy} ${cornerX},${oy}`} fill="none" stroke={d.color} strokeWidth={1} />
        <text
          x={cornerX}
          y={oy}
          dominantBaseline="middle"
          textAnchor={right ? "end" : "start"}
          fill={d.color}
          fontSize={11}
          fontWeight={700}
        >
          {d.label.toUpperCase()} {d.value}
        </text>
      </g>,
    );
  });

  return (
    <div className="flex flex-col items-center">
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Tasks by status">
        {wedges}
        {labels}
      </svg>
      <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 text-xs mt-4">
        {data.map((d, i) => (
          <li key={i} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: d.color }} aria-hidden="true" />
            <span className="text-slate-300">{d.label.toUpperCase()}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
