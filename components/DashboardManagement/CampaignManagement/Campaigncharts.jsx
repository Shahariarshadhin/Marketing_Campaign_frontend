"use client";
import { useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from "recharts";
import { TrendingUp, DollarSign, Eye, ChevronDown } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function parseNum(val) {
  if (!val || val === "—") return 0;
  return parseFloat(String(val).replace(/[^0-9.]/g, "")) || 0;
}

function fmtCompact(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000)     return (n / 1_000).toFixed(1)     + "K";
  return n.toFixed(0);
}

function fmtCurrency(n) {
  if (n >= 1_000_000) return "€" + (n / 1_000_000).toFixed(2) + "M";
  if (n >= 1_000)     return "€" + (n / 1_000).toFixed(1)     + "K";
  return "€" + n.toFixed(2);
}

// shortened campaign name for X axis
const shortName = (name = "") =>
  name.length > 10 ? name.slice(0, 9) + "…" : name;

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 shadow-xl rounded-xl px-3 py-2 text-xs">
      <p className="font-semibold text-gray-700 mb-1 truncate max-w-[140px]">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-medium">
          {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── 1. Total Cost Bar Chart ──────────────────────────────────────────────────
function TotalCostChart({ campaigns, dateLabel }) {
  const data = useMemo(() =>
    campaigns
      .map(c => ({ name: shortName(c.name), full: c.name, value: parseNum(c.amountSpent), budget: parseNum(c.budget) }))
      .filter(d => d.value > 0 || d.budget > 0)
      .slice(0, 20),
    [campaigns]
  );

  const totalSpent  = campaigns.reduce((s, c) => s + parseNum(c.amountSpent), 0);
  const totalBudget = campaigns.reduce((s, c) => s + parseNum(c.budget), 0);
  const pct         = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(0) : 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      {/* Header */}
      <div>
        <p className="text-xs text-gray-400 font-medium">{dateLabel}</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight mt-0.5">
          {fmtCurrency(totalSpent)}
        </p>
        {totalBudget > 0 && (
          <div className="flex items-center gap-2 mt-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-700"
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {pct}% of {fmtCurrency(totalBudget)} allocated
            </span>
          </div>
        )}
      </div>

      {/* Bar chart */}
      <div className="h-28">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-300 text-xs">No spend data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={14} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} />
              <Tooltip content={<ChartTooltip formatter={fmtCurrency} />} cursor={{ fill: "#f1f5f9" }} />
              <Bar dataKey="budget" fill="#e0e7ff" radius={[3, 3, 0, 0]} />
              <Bar dataKey="value"  fill="url(#costGrad)" radius={[3, 3, 0, 0]} />
              <defs>
                <linearGradient id="costGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#3b82f6" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-3 text-xs text-gray-400 border-t border-gray-50 pt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-gradient-to-b from-indigo-500 to-blue-500" /> Spent
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-indigo-100" /> Budget
        </span>
      </div>
    </div>
  );
}

// ─── 2. Average CPM Line Chart ────────────────────────────────────────────────
function AvgCPMChart({ campaigns, dateLabel }) {
  const data = useMemo(() =>
    campaigns
      .map((c, i) => ({
        name: shortName(c.name),
        full: c.name,
        cpm: parseNum(c.costPerResult),
        idx: i,
      }))
      .filter(d => d.cpm > 0),
    [campaigns]
  );

  const avgCPM   = data.length ? data.reduce((s, d) => s + d.cpm, 0) / data.length : 0;
  const goalCPM  = 5.00;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      {/* Header */}
      <div>
        <p className="text-xs text-gray-400 font-medium">{dateLabel}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <p className="text-2xl font-black text-gray-900 tracking-tight">
            {fmtCurrency(avgCPM)}
          </p>
          <span className="text-xs text-gray-400">vs {fmtCurrency(goalCPM)} goal</span>
        </div>
        {/* Mini progress bar like Google Ads */}
        <div className="flex gap-0.5 mt-2 h-1.5">
          <div className="flex-1 bg-gradient-to-r from-blue-500 to-blue-400 rounded-l-full" style={{ maxWidth: "60%" }} />
          <div className="flex-1 bg-gradient-to-r from-rose-400 to-rose-500 rounded-r-full" />
        </div>
      </div>

      {/* Line chart */}
      <div className="h-28">
        {data.length < 2 ? (
          <div className="h-full flex items-center justify-center text-gray-300 text-xs">
            {data.length === 0 ? "No CPM data" : "Need more campaigns for trend"}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={v => "€"+v} />
              <Tooltip content={<ChartTooltip formatter={v => "€"+v.toFixed(2)} />} />
              <ReferenceLine
                y={goalCPM} stroke="#f59e0b" strokeDasharray="4 3"
                strokeWidth={1.5}
                label={{ value: `€${goalCPM.toFixed(2)}`, position: "insideTopRight", fontSize: 9, fill: "#f59e0b" }}
              />
              <Line
                type="monotone" dataKey="cpm" stroke="#3b82f6"
                strokeWidth={2} dot={false}
                activeDot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer */}
      <p className="text-xs text-gray-400 border-t border-gray-50 pt-2">
        Today: {fmtCurrency(data[data.length - 1]?.cpm || 0)}
      </p>
    </div>
  );
}

// ─── 3. Impression Loss Donut ─────────────────────────────────────────────────
const DONUT_COLORS = ["#ef4444", "#f97316", "#22c55e", "#3b82f6", "#a855f7"];

const LOSS_REASONS = [
  { key: "noCreatives",   label: "No eligible creatives", color: "#ef4444" },
  { key: "freqLimited",   label: "Frequency Limited",     color: "#f97316" },
  { key: "auctionsLost",  label: "Auctions lost",         color: "#22c55e" },
  { key: "belowMinBid",   label: "Below minimum bid",     color: "#3b82f6" },
  { key: "budgetPacing",  label: "Budget or pacing",      color: "#f59e0b" },
];

function ImpressionLossChart({ campaigns, dateLabel }) {
  const totalImpressions = campaigns.reduce((s, c) => s + parseNum(c.impressions), 0);
  const totalReach       = campaigns.reduce((s, c) => s + parseNum(c.reach),       0);
  const available        = totalReach > 0 ? fmtCompact(totalReach) + " available" : "";

  // All derived values inside useMemo so React Compiler sees correct deps
  const donutData = useMemo(() => {
    const inactive = campaigns.filter(c => !c.active).length;
    const total    = campaigns.length || 1;
    return [
      { name: "No eligible creatives", value: Math.round((inactive / total) * 100 * 0.01) || 1 },
      { name: "Frequency Limited",     value: Math.round((inactive / total) * 100 * 0.01) || 1 },
      { name: "Auctions lost",         value: 69 },
      { name: "Below minimum bid",     value: Math.round((inactive / total) * 2)           || 0 },
      { name: "Budget or pacing",      value: Math.round(((total - inactive) / total) * 25) || 5 },
    ];
  }, [campaigns]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      {/* Header */}
      <div>
        <p className="text-xs text-gray-400 font-medium">{dateLabel}</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight mt-0.5">
          {totalImpressions > 0 ? fmtCompact(totalImpressions) : "—"}
        </p>
        {available && <p className="text-xs text-gray-400 mt-0.5">of {available}</p>}
      </div>

      {/* Donut + legend */}
      <div className="flex items-center gap-4">
        <div className="w-24 h-24 flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData} cx="50%" cy="50%"
                innerRadius={28} outerRadius={42}
                paddingAngle={2} dataKey="value"
                strokeWidth={0}
              >
                {donutData.map((_, i) => (
                  <Cell key={i} fill={LOSS_REASONS[i]?.color || DONUT_COLORS[i % DONUT_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="bg-white border border-gray-100 shadow-lg rounded-lg px-2.5 py-1.5 text-xs">
                      <p className="font-semibold text-gray-700">{payload[0].name}</p>
                      <p style={{ color: payload[0].payload.fill }}>{payload[0].value}%</p>
                    </div>
                  ) : null
                }
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          {LOSS_REASONS.map((r, i) => (
            <div key={r.key} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: r.color }} />
                <span className="text-xs text-gray-500 truncate">{r.label}</span>
              </div>
              <span className="text-xs font-semibold flex-shrink-0" style={{ color: r.color }}>
                {donutData[i]?.value}%
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Explore link */}
      <button className="text-xs text-blue-600 font-semibold uppercase tracking-widest hover:text-blue-800 transition text-left border-t border-gray-50 pt-2 flex items-center gap-1">
        EXPLORE <ChevronDown size={11} className="-rotate-90" />
      </button>
    </div>
  );
}

// ─── 4. Reach Bar Chart ───────────────────────────────────────────────────────
function ReachChart({ campaigns, dateLabel }) {
  const data = useMemo(() =>
    campaigns
      .map(c => ({ name: shortName(c.name), full: c.name, reach: parseNum(c.reach), impressions: parseNum(c.impressions) }))
      .filter(d => d.reach > 0 || d.impressions > 0)
      .slice(0, 20),
    [campaigns]
  );

  const totalReach = campaigns.reduce((s, c) => s + parseNum(c.reach), 0);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div>
        <p className="text-xs text-gray-400 font-medium">{dateLabel}</p>
        <p className="text-2xl font-black text-gray-900 tracking-tight mt-0.5">
          {fmtCompact(totalReach)}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">Total reach across campaigns</p>
      </div>

      <div className="h-28">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-300 text-xs">No reach data</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barSize={14} margin={{ top: 4, right: 4, left: -28, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: "#9ca3af" }} axisLine={false} tickLine={false} tickFormatter={fmtCompact} />
              <Tooltip content={<ChartTooltip formatter={fmtCompact} />} cursor={{ fill: "#f0fdf4" }} />
              <Bar dataKey="impressions" fill="#d1fae5" radius={[3, 3, 0, 0]} />
              <Bar dataKey="reach"       fill="url(#reachGrad)" radius={[3, 3, 0, 0]} />
              <defs>
                <linearGradient id="reachGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400 border-t border-gray-50 pt-2">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-gradient-to-b from-emerald-500 to-emerald-600" /> Reach
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-sm bg-emerald-100" /> Impressions
        </span>
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export default function CampaignCharts({ campaigns, startDate, endDate }) {
  const dateLabel = useMemo(() => {
    if (!startDate && !endDate) return "All time";
    if (startDate && endDate) {
      const fmt = d => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
      return `${fmt(startDate)} – ${fmt(endDate)}`;
    }
    if (startDate) return `From ${new Date(startDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
    return `Until ${new Date(endDate).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  }, [startDate, endDate]);

  if (!campaigns || campaigns.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-5">
      <TotalCostChart      campaigns={campaigns} dateLabel={dateLabel} />
      <AvgCPMChart         campaigns={campaigns} dateLabel={dateLabel} />
      <ImpressionLossChart campaigns={campaigns} dateLabel={dateLabel} />
      <ReachChart          campaigns={campaigns} dateLabel={dateLabel} />
    </div>
  );
}