import { cn } from "@/lib/format";

/** Grafik garis sederhana (SVG). Warna dari token tema supaya aman di mode gelap. */
export function LineChart({ data, labels, height = 220, formatY = (v) => v }) {
  const w = 640;
  const pad = { l: 44, r: 12, t: 16, b: 28 };
  const maks = Math.max(...data) * 1.15 || 1;
  const x = (i) => pad.l + (i * (w - pad.l - pad.r)) / (data.length - 1);
  const y = (v) => pad.t + (1 - v / maks) * (height - pad.t - pad.b);
  const garis = data.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
  const area = `${garis} L${x(data.length - 1)} ${height - pad.b} L${x(0)} ${height - pad.b} Z`;
  const ticks = [0, 0.5, 1].map((t) => t * maks);
  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="h-auto w-full" role="img" aria-label={`Grafik: ${labels.map((l, i) => `${l} ${data[i]}`).join(", ")}`}>
      <defs>
        <linearGradient id="area-g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.28" />
          <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
        </linearGradient>
      </defs>
      {ticks.map((t) => (
        <g key={t}>
          <line x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} stroke="var(--line)" strokeDasharray="4 6" />
          <text x={pad.l - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)">{formatY(Math.round(t))}</text>
        </g>
      ))}
      <path d={area} fill="url(#area-g)" />
      <path d={garis} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((v, i) => (
        <g key={i}>
          <circle cx={x(i)} cy={y(v)} r="4.5" fill="var(--surface)" stroke="var(--primary)" strokeWidth="2.5" />
          <text x={x(i)} y={height - 8} textAnchor="middle" fontSize="11" fill="var(--muted)">{labels[i]}</text>
        </g>
      ))}
    </svg>
  );
}

export function Donut({ items, size = 170 }) {
  const total = items.reduce((a, b) => a + b.value, 0) || 1;
  const r = 60;
  const c = 2 * Math.PI * r;
  const segmen = items.map((it, i) => ({
    ...it,
    len: (it.value / total) * c,
    awal: items.slice(0, i).reduce((a, b) => a + (b.value / total) * c, 0),
  }));
  return (
    <div className="flex flex-wrap items-center gap-6">
      <svg viewBox="0 0 160 160" width={size} height={size} role="img" aria-label={`Distribusi status: ${items.map((i) => `${i.label} ${i.value}`).join(", ")}`}>
        <circle cx="80" cy="80" r={r} fill="none" stroke="var(--soft)" strokeWidth="22" />
        {segmen.map((it) => (
          <circle key={it.label} cx="80" cy="80" r={r} fill="none" stroke={it.color} strokeWidth="22" strokeDasharray={`${it.len} ${c - it.len}`} strokeDashoffset={-it.awal} transform="rotate(-90 80 80)" />
        ))}
        <text x="80" y="78" textAnchor="middle" fontSize="26" fontWeight="800" fill="var(--fg)">{total}</text>
        <text x="80" y="98" textAnchor="middle" fontSize="11" fill="var(--muted)">order</text>
      </svg>
      <ul className="space-y-2 text-sm">
        {items.map((it) => (
          <li key={it.label} className="flex items-center gap-2">
            <span className="size-3 rounded-sm" style={{ background: it.color }} aria-hidden />
            <span className="text-muted">{it.label}</span>
            <b className={cn("ml-auto pl-4")}>{it.value}</b>
          </li>
        ))}
      </ul>
    </div>
  );
}
