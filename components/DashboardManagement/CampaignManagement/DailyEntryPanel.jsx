"use client";
/**
 * DailyEntryPanel
 * ───────────────
 * Slide-in drawer attached to a single campaign.
 * - Shows all historical daily entries in a mini table
 * - Lets admin enter / edit data for any date
 * - On save, calls upsert endpoint and notifies parent to refresh
 */
import { useEffect, useState, useRef } from "react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import {
  X, Plus, Save, Loader2, ChevronLeft, ChevronRight,
  CalendarDays, Pencil, Trash2, CheckCircle2, Clock
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const FIELDS = [
  { key: "results",       label: "Results",        placeholder: "e.g. 120" },
  { key: "impressions",   label: "Impressions",    placeholder: "e.g. 15000" },
  { key: "reach",         label: "Reach",          placeholder: "e.g. 8000" },
  { key: "amountSpent",   label: "Amount Spent",   placeholder: "e.g. 320.00" },
  { key: "budget",        label: "Budget",         placeholder: "e.g. 500.00" },
  { key: "costPerResult", label: "Cost/Result",    placeholder: "e.g. 2.50" },
  { key: "actions",       label: "Actions",        placeholder: "e.g. 45" },
  { key: "delivery",      label: "Delivery",       placeholder: "e.g. Active" },
];

const EMPTY = () => Object.fromEntries(FIELDS.map(f => [f.key, ""]));

function todayISO() { return new Date().toISOString().split("T")[0]; }

function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + (iso.includes("T") ? "" : "T00:00:00"));
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

// ─── Calendar picker ──────────────────────────────────────────────────────────
function MiniCalendar({ value, onChange, markedDates = [] }) {
  const [view, setView] = useState(() => {
    const d = value ? new Date(value + "T00:00:00") : new Date();
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  const today       = todayISO();
  const daysInMonth = new Date(view.year, view.month + 1, 0).getDate();
  const firstDay    = new Date(view.year, view.month, 1).getDay();
  const monthLabel  = new Date(view.year, view.month).toLocaleDateString("en-US", { month: "long" });

  const prev = () => {
    const d = new Date(view.year, view.month - 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };
  const next = () => {
    const d = new Date(view.year, view.month + 1);
    setView({ year: d.getFullYear(), month: d.getMonth() });
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-4 w-72 select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button onClick={prev} className="p-1 hover:bg-gray-100 rounded-lg transition">
          <ChevronLeft size={15} className="text-gray-500" />
        </button>
        <div className="flex items-center gap-2">
          <select value={view.month} onChange={e => setView(v => ({ ...v, month: Number(e.target.value) }))}
            className="text-sm font-bold text-gray-800 border-0 bg-transparent focus:outline-none cursor-pointer">
            {["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].map((m,i) => (
              <option key={i} value={i}>{m}</option>
            ))}
          </select>
          <select value={view.year} onChange={e => setView(v => ({ ...v, year: Number(e.target.value) }))}
            className="text-sm font-bold text-gray-800 border-0 bg-transparent focus:outline-none cursor-pointer">
            {Array.from({ length: 8 }, (_, i) => new Date().getFullYear() - 4 + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <button onClick={next} className="p-1 hover:bg-gray-100 rounded-lg transition">
          <ChevronRight size={15} className="text-gray-500" />
        </button>
      </div>
      {/* Day labels */}
      <div className="grid grid-cols-7 mb-1">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-center text-xs font-semibold text-gray-400 py-0.5">{d}</div>
        ))}
      </div>
      {/* Day cells */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1;
          const iso = `${view.year}-${String(view.month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const isSelected = iso === value;
          const isToday    = iso === today;
          const hasData    = markedDates.includes(iso);
          return (
            <button key={day} onClick={() => onChange(iso)}
              className={`w-full aspect-square flex items-center justify-center text-xs rounded-lg font-medium transition relative
                ${isSelected ? "bg-blue-600 text-white shadow" :
                  isToday    ? "bg-blue-50 text-blue-600 font-bold" :
                               "text-gray-700 hover:bg-gray-100"}`}>
              {day}
              {hasData && !isSelected && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-emerald-500" />
              )}
            </button>
          );
        })}
      </div>
      {/* Quick links */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
        <button onClick={() => { onChange(today); setView({ year: new Date().getFullYear(), month: new Date().getMonth() }); }}
          className="flex-1 text-xs py-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition border border-gray-200">
          Today
        </button>
        {["−7d","−30d"].map(label => {
          const n = label === "−7d" ? 7 : 30;
          return (
            <button key={label} onClick={() => {
              const d = new Date(); d.setDate(d.getDate() - n);
              const iso = d.toISOString().split("T")[0];
              onChange(iso);
              setView({ year: d.getFullYear(), month: d.getMonth() });
            }} className="flex-1 text-xs py-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition border border-gray-200">
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main panel ───────────────────────────────────────────────────────────────
export default function DailyEntryPanel({ campaign, customFields = [], onClose, onSaved }) {
  const authFetch = useAuthFetch();

  const [selectedDate, setSelectedDate]   = useState(todayISO());
  const [showCal, setShowCal]             = useState(false);
  const [allRecords, setAllRecords]       = useState([]);   // all historical records
  const [form, setForm]                   = useState(EMPTY());
  const [customForm, setCustomForm]       = useState({});
  const [loadingRec, setLoadingRec]       = useState(false);
  const [saving, setSaving]               = useState(false);
  const [toast, setToast]                 = useState(null);
  const [editingId, setEditingId]         = useState(null); // id of record being edited (null = new)

  const panelRef = useRef(null);

  // Load all records for history + mark calendar dots
  useEffect(() => {
    if (!campaign?._id) return;
    authFetch(`${API}/metrics/${campaign._id}/all`)
      .then(r => r.json())
      .then(d => { if (d.success) setAllRecords(d.data); });
  }, [campaign?._id]);

  // When selectedDate changes, load that day's record into form
  useEffect(() => {
    if (!campaign?._id || !selectedDate) return;
    setLoadingRec(true);
    authFetch(`${API}/metrics/${campaign._id}?startDate=${selectedDate}&endDate=${selectedDate}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data.length > 0) {
          const rec = d.data[0];
          setEditingId(rec._id);
          setForm({
            results:       rec.results       || "",
            impressions:   rec.impressions   || "",
            reach:         rec.reach         || "",
            amountSpent:   rec.amountSpent   || "",
            budget:        rec.budget        || "",
            costPerResult: rec.costPerResult || "",
            actions:       rec.actions       || "",
            delivery:      rec.delivery      || "",
          });
          // Custom fields
          const cfMap = {};
          customFields.forEach(cf => {
            cfMap[cf.name] = rec.customFields?.get
              ? rec.customFields.get(cf.name) || ""
              : (rec.customFields?.[cf.name] || "");
          });
          setCustomForm(cfMap);
        } else {
          setEditingId(null);
          setForm(EMPTY());
          const cfMap = {};
          customFields.forEach(cf => { cfMap[cf.name] = ""; });
          setCustomForm(cfMap);
        }
      })
      .finally(() => setLoadingRec(false));
  }, [selectedDate, campaign?._id]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 2500);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        date:          selectedDate,
        results:       form.results       || "—",
        impressions:   form.impressions   || "—",
        reach:         form.reach         || "—",
        amountSpent:   form.amountSpent   || "—",
        budget:        form.budget        || "—",
        costPerResult: form.costPerResult || "—",
        actions:       form.actions       || "—",
        delivery:      form.delivery      || "—",
        customFields:  customForm,
      };
      const res  = await authFetch(`${API}/metrics/${campaign._id}`, {
        method: "POST", body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Saved!");
        // Refresh allRecords
        const allRes = await authFetch(`${API}/metrics/${campaign._id}/all`).then(r => r.json());
        if (allRes.success) setAllRecords(allRes.data);
        setEditingId(data.data._id);
        if (onSaved) onSaved(campaign._id, selectedDate, data.data);
      } else {
        showToast(data.message || "Failed", "error");
      }
    } catch {
      showToast("Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (recordId) => {
    if (!confirm("Delete this day's entry?")) return;
    const res  = await authFetch(`${API}/metrics/${campaign._id}/${recordId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      showToast("Deleted");
      setAllRecords(r => r.filter(x => x._id !== recordId));
      if (editingId === recordId) {
        setEditingId(null); setForm(EMPTY());
      }
      if (onSaved) onSaved(campaign._id, selectedDate, null);
    }
  };

  const markedDates = allRecords.map(r =>
    new Date(r.date).toISOString().split("T")[0]
  );

  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 bg-white";

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Drawer */}
      <div ref={panelRef}
        className="fixed right-0 top-0 h-full z-50 bg-white shadow-2xl flex flex-col"
        style={{ width: "min(520px, 100vw)" }}>

        {/* Toast */}
        {toast && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg
            ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
            {toast.msg}
          </div>
        )}

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">Daily Entry</p>
            <h2 className="text-base font-black text-gray-900 leading-tight">{campaign.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X size={17} className="text-gray-500" />
          </button>
        </div>

        {/* ── Date selector ────────────────────────────────────────────────── */}
        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <button onClick={() => setShowCal(o => !o)}
                className="flex items-center gap-2 w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 hover:border-blue-400 transition shadow-sm">
                <CalendarDays size={15} className="text-blue-500" />
                {fmtDate(selectedDate)}
                {markedDates.includes(selectedDate) && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 size={12} /> Has data
                  </span>
                )}
                {!markedDates.includes(selectedDate) && (
                  <span className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                    <Clock size={12} /> No entry
                  </span>
                )}
              </button>
              {showCal && (
                <div className="absolute top-full left-0 mt-2 z-10">
                  <MiniCalendar
                    value={selectedDate}
                    onChange={d => { setSelectedDate(d); setShowCal(false); }}
                    markedDates={markedDates}
                  />
                </div>
              )}
            </div>
            {/* Nav arrows */}
            <button onClick={() => {
              const d = new Date(selectedDate + "T00:00:00");
              d.setDate(d.getDate() - 1);
              setSelectedDate(d.toISOString().split("T")[0]);
            }} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm">
              <ChevronLeft size={15} className="text-gray-500" />
            </button>
            <button onClick={() => {
              const d = new Date(selectedDate + "T00:00:00");
              d.setDate(d.getDate() + 1);
              setSelectedDate(d.toISOString().split("T")[0]);
            }} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition shadow-sm">
              <ChevronRight size={15} className="text-gray-500" />
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            Green dot = date has existing entry
          </p>
        </div>

        {/* ── Form ─────────────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loadingRec ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-blue-500" size={24} />
            </div>
          ) : (
            <>
              {/* Status banner */}
              {editingId ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-700 font-semibold">
                  <CheckCircle2 size={13} />
                  Editing existing entry for {fmtDate(selectedDate)}
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 text-xs text-blue-600 font-semibold">
                  <Plus size={13} />
                  New entry for {fmtDate(selectedDate)}
                </div>
              )}

              {/* Standard fields — 2 col grid */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Standard Metrics</p>
                <div className="grid grid-cols-2 gap-3">
                  {FIELDS.map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{f.label}</label>
                      <input
                        value={form[f.key]}
                        onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                        className={inp}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Custom fields */}
              {customFields.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-3">Custom Fields</p>
                  <div className="grid grid-cols-2 gap-3">
                    {customFields.map(cf => (
                      <div key={cf._id}>
                        <label className="block text-xs font-semibold text-purple-400 mb-1.5">{cf.label}</label>
                        <input
                          value={customForm[cf.name] || ""}
                          onChange={e => setCustomForm(prev => ({ ...prev, [cf.name]: e.target.value }))}
                          placeholder={`Enter ${cf.label}`}
                          className={`${inp} focus:ring-purple-300`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ── Save button ───────────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3 bg-white flex-shrink-0">
          <button onClick={handleSave} disabled={saving || loadingRec}
            className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50 shadow-sm">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Saving…" : editingId ? "Update Entry" : "Save Entry"}
          </button>
          {editingId && (
            <button onClick={() => handleDelete(editingId)}
              className="px-4 py-2.5 bg-red-50 text-red-500 rounded-xl font-semibold text-sm hover:bg-red-100 transition border border-red-200">
              <Trash2 size={15} />
            </button>
          )}
        </div>

        {/* ── History table ────────────────────────────────────────────────── */}
        <div className="border-t border-gray-100 flex-shrink-0" style={{ maxHeight: "260px", overflowY: "auto" }}>
          <div className="px-5 py-3 flex items-center justify-between sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">All Entries ({allRecords.length})</p>
          </div>
          {allRecords.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No daily entries yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50/80">
                <tr>
                  {["Date","Results","Impressions","Spent",""].map(h => (
                    <th key={h} className="px-3 py-2 text-left font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allRecords.map(rec => {
                  const iso = new Date(rec.date).toISOString().split("T")[0];
                  const isActive = iso === selectedDate;
                  return (
                    <tr key={rec._id}
                      className={`border-b border-gray-50 cursor-pointer transition
                        ${isActive ? "bg-blue-50" : "hover:bg-gray-50"}`}
                      onClick={() => setSelectedDate(iso)}>
                      <td className="px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">
                        {new Date(rec.date).toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"numeric" })}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{rec.results}</td>
                      <td className="px-3 py-2 text-gray-600">{rec.impressions}</td>
                      <td className="px-3 py-2 text-gray-600">{rec.amountSpent}</td>
                      <td className="px-3 py-2">
                        <button onClick={e => { e.stopPropagation(); handleDelete(rec._id); }}
                          className="p-1 hover:bg-red-50 rounded text-gray-300 hover:text-red-400 transition">
                          <Trash2 size={11} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}