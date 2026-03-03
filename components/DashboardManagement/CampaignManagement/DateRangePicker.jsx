"use client";
import { useState } from "react";
import { Calendar, RefreshCw, BarChart2 } from "lucide-react";

// Presets
const PRESETS = [
  { label: "Today",       days: 0 },
  { label: "Last 7 days", days: 7 },
  { label: "Last 14 days",days: 14 },
  { label: "Last 30 days",days: 30 },
  { label: "Last 90 days",days: 90 },
];

function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0];
}

export default function DateRangePicker({ onApply, loading = false, resultCount = null }) {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");
  const [active, setActive]       = useState(null); // active preset label

  const applyPreset = (preset) => {
    setActive(preset.label);
    const end   = new Date().toISOString().split("T")[0];
    const start = preset.days === 0 ? end : offsetDate(preset.days);
    setStartDate(start);
    setEndDate(end);
    onApply(start, end);
  };

  const applyCustom = () => {
    setActive(null);
    onApply(startDate, endDate);
  };

  const clear = () => {
    setStartDate("");
    setEndDate("");
    setActive(null);
    onApply("", "");
  };

  const hasFilter = startDate || endDate;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
      <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
        <Calendar size={16} className="text-blue-500" /> Date Range
      </h2>

      {/* Preset buttons */}
      <div className="flex flex-wrap gap-2 mb-4">
        {PRESETS.map(p => (
          <button key={p.label} onClick={() => applyPreset(p)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition
              ${active === p.label
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Custom range */}
      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">From</label>
          <input type="date" value={startDate}
            onChange={e => { setStartDate(e.target.value); setActive(null); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1 font-medium">To</label>
          <input type="date" value={endDate}
            onChange={e => { setEndDate(e.target.value); setActive(null); }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div className="flex gap-2">
          <button onClick={applyCustom} disabled={!startDate && !endDate}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-40 transition">
            {loading
              ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              : <BarChart2 size={14} />}
            Apply
          </button>
          {hasFilter && (
            <button onClick={clear}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm hover:bg-gray-200 transition">
              <RefreshCw size={14} /> Clear
            </button>
          )}
        </div>

        {resultCount !== null && hasFilter && (
          <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">
            {resultCount} record(s) found
          </span>
        )}
      </div>
    </div>
  );
}