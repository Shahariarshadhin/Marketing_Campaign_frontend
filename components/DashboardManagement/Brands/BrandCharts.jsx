"use client";
// Pure SVG donut charts — no external charting library needed
// Shows Budget breakdown + Impression distribution across all brands

import { useState } from "react";

const parseNum = (str) =>
  parseFloat(String(str || "0").replace(/[^0-9.-]/g, "")) || 0;

// ─── SVG Donut ────────────────────────────────────────────────────────────────
function buildArcs(segments, circumf) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  return segments.reduce((acc, seg) => {
    const pct    = seg.value / total;
    const dash   = pct * circumf;
    const gap    = circumf - dash;
    const offset = acc.reduce((s, a) => s + a.dash, 0);
    return [...acc, { ...seg, dash, gap, offset, pct }];
  }, []);
}

function DonutChart({ segments, size = 120, thickness = 22 }) {
  const [hovered, setHovered] = useState(null);
  const r       = (size - thickness) / 2;
  const cx      = size / 2;
  const cy      = size / 2;
  const circumf = 2 * Math.PI * r;
  const total   = segments.reduce((s, sg) => s + sg.value, 0);

  if (total === 0) {
    return (
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={r} fill="none"
          stroke="#e5e7eb" strokeWidth={thickness} />
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle"
          fontSize="11" fill="#9ca3af">No data</text>
      </svg>
    );
  }

  const arcs = buildArcs(segments, circumf);

  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      {/* Background track */}
      <circle cx={cx} cy={cy} r={r} fill="none"
        stroke="#f3f4f6" strokeWidth={thickness} />
      {arcs.map((arc, i) => (
        <circle key={i} cx={cx} cy={cy} r={r} fill="none"
          stroke={arc.color}
          strokeWidth={hovered === i ? thickness + 3 : thickness}
          strokeDasharray={`${arc.dash} ${arc.gap}`}
          strokeDashoffset={-arc.offset}
          strokeLinecap="round"
          style={{ transition: "stroke-width 0.2s ease", cursor: "pointer" }}
          onMouseEnter={() => setHovered(i)}
          onMouseLeave={() => setHovered(null)}
        />
      ))}
      {/* Center label — rotate back to read normally */}
      <g style={{ transform: `rotate(90deg)`, transformOrigin: `${cx}px ${cy}px` }}>
        {hovered !== null ? (
          <>
            <text x={cx} y={cy - 7} textAnchor="middle" fontSize="11"
              fontWeight="700" fill={arcs[hovered]?.color}>
              {arcs[hovered]?.label}
            </text>
            <text x={cx} y={cy + 9} textAnchor="middle" fontSize="11"
              fontWeight="600" fill="#374151">
              {(arcs[hovered]?.pct * 100).toFixed(0)}%
            </text>
          </>
        ) : (
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize="12"
            fontWeight="700" fill="#1f2937">
            {segments.length}
          </text>
        )}
      </g>
    </svg>
  );
}

// ─── Legend row ───────────────────────────────────────────────────────────────
function LegendRow({ color, label, pct, value, prefix = "" }) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2 min-w-0">
        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: color }} />
        <span className="text-xs text-gray-600 truncate">{label}</span>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0 ml-3">
        <span className="text-xs text-gray-400 tabular-nums w-16 text-right">
          {prefix}{value.toLocaleString()}
        </span>
        <span className="text-xs font-bold tabular-nums w-9 text-right" style={{ color }}>
          {pct.toFixed(0)}%
        </span>
      </div>
    </div>
  );
}

// ─── Chart card wrapper ───────────────────────────────────────────────────────
function ChartCard({ title, subtitle, total, totalLabel, children, note }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex-1 min-w-[260px]">
      <div className="mb-4">
        <p className="text-xs text-gray-400 font-medium mb-0.5">{title}</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight">{total}</p>
        <p className="text-xs text-gray-400 mt-0.5">{totalLabel}</p>
      </div>
      {children}
      {note && <p className="text-xs text-gray-400 mt-4 pt-3 border-t border-gray-100">{note}</p>}
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function BrandCharts({ brands, chartDate }) {
  if (!brands || brands.length === 0) return null;

  const dateLabel = chartDate
    ? new Date(chartDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })
    : 'Today';

  // ── Budget chart data ──────────────────────────────────────────────────────
  // Per brand: total budget
  const PALETTE = [
    "#1a73e8", "#34a853", "#ea4335", "#fbbc04", "#ff6d00",
    "#46bdc6", "#9c27b0", "#00897b", "#e91e63", "#3949ab",
    "#8d6e63", "#546e7a", "#d4e157", "#26a69a", "#ef5350",
  ];

  const budgetPerBrand = brands
    .map((b, i) => ({
      label: b.name,
      value: parseNum(b.stats?.totalBudget),
      color: b.color || PALETTE[i % PALETTE.length],
    }))
    .filter(x => x.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalBudget = budgetPerBrand.reduce((s, x) => s + x.value, 0);

  // ── Impression chart data ──────────────────────────────────────────────────
  const impressionPerBrand = brands
    .map((b, i) => ({
      label: b.name,
      value: parseNum(b.stats?.totalImpressions),
      color: b.color || PALETTE[i % PALETTE.length],
    }))
    .filter(x => x.value > 0)
    .sort((a, b) => b.value - a.value);

  const totalImpressions = impressionPerBrand.reduce((s, x) => s + x.value, 0);

  // ── Active vs Inactive chart ───────────────────────────────────────────────
  const totalActive   = brands.reduce((s, b) => s + (b.stats?.active   || 0), 0);
  const totalInactive = brands.reduce((s, b) => s + (b.stats?.inactive || 0), 0);
  const totalCampaigns = totalActive + totalInactive;

  const statusSegments = [
    { label: "Active",   value: totalActive,   color: "#22c55e" },
    { label: "Inactive", value: totalInactive, color: "#f43f5e" },
    { label: "Draft",    value: brands.reduce((s, b) => s + (b.stats?.draft || 0), 0), color: "#f59e0b" },
  ].filter(x => x.value > 0);

  const formatK = (n) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000)     return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  return (
    <div className="flex flex-wrap gap-4 mb-4">

      {/* ── Chart 1: Budget distribution ───────────────────────────────────── */}
      <ChartCard
        title={`Budget at risk (${dateLabel})`}
        total={totalBudget > 0 ? `$${formatK(totalBudget)}` : "—"}
        totalLabel={`of $${totalBudget.toLocaleString()} total budget across ${brands.length} brand${brands.length !== 1 ? "s" : ""}`}
        note="Data for active budget segments"
      >
        {budgetPerBrand.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No budget data yet</p>
        ) : (
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0">
              <DonutChart segments={budgetPerBrand} size={120} thickness={20} />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              {budgetPerBrand.slice(0, 6).map((seg, i) => (
                <LegendRow key={i}
                  color={seg.color} label={seg.label}
                  value={seg.value} prefix="$"
                  pct={(totalBudget > 0 ? (seg.value / totalBudget) * 100 : 0)}
                />
              ))}
              {budgetPerBrand.length > 6 && (
                <p className="text-xs text-gray-400 pt-1">+{budgetPerBrand.length - 6} more brands</p>
              )}
            </div>
          </div>
        )}
      </ChartCard>

      {/* ── Chart 2: Impression distribution ───────────────────────────────── */}
      <ChartCard
        title={`Impressions (${dateLabel})`}
        total={totalImpressions > 0 ? formatK(totalImpressions) : "—"}
        totalLabel={`total impressions across ${brands.length} brand${brands.length !== 1 ? "s" : ""}`}
        note="Combined reach across all active campaigns"
      >
        {impressionPerBrand.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No impression data yet</p>
        ) : (
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0">
              <DonutChart segments={impressionPerBrand} size={120} thickness={20} />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              {impressionPerBrand.slice(0, 6).map((seg, i) => (
                <LegendRow key={i}
                  color={seg.color} label={seg.label}
                  value={seg.value}
                  pct={(totalImpressions > 0 ? (seg.value / totalImpressions) * 100 : 0)}
                />
              ))}
              {impressionPerBrand.length > 6 && (
                <p className="text-xs text-gray-400 pt-1">+{impressionPerBrand.length - 6} more brands</p>
              )}
            </div>
          </div>
        )}
      </ChartCard>

      {/* ── Chart 3: Campaign status ────────────────────────────────────────── */}
      <ChartCard
        title={`Pacing (${dateLabel})`}
        total={String(totalCampaigns)}
        totalLabel={`active insertion orders across all brands`}
        note="Active vs paused/draft campaigns"
      >
        {statusSegments.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">No campaigns yet</p>
        ) : (
          <div className="flex items-center gap-5">
            <div className="flex-shrink-0">
              <DonutChart segments={statusSegments} size={120} thickness={20} />
            </div>
            <div className="flex-1 min-w-0 space-y-0.5">
              {statusSegments.map((seg, i) => (
                <LegendRow key={i}
                  color={seg.color} label={seg.label}
                  value={seg.value}
                  pct={(totalCampaigns > 0 ? (seg.value / totalCampaigns) * 100 : 0)}
                />
              ))}
              <div className="pt-2 mt-1 border-t border-gray-100">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Active rate</span>
                  <span className="font-bold text-emerald-600">
                    {totalCampaigns > 0 ? ((totalActive / totalCampaigns) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </ChartCard>

    </div>
  );
}