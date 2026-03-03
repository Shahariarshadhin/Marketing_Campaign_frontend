"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import Link from "next/link";
import {
  ArrowLeft, Plus, Save, Trash2, Loader2, Check,
  Calendar, ChevronDown, ChevronUp, BarChart2, RefreshCw
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const FIELDS = [
  { key: "results",       label: "Results",        placeholder: "e.g. 120" },
  { key: "costPerResult", label: "Cost/Result",     placeholder: "e.g. $2.50" },
  { key: "budget",        label: "Budget",          placeholder: "e.g. $500" },
  { key: "amountSpent",   label: "Amount Spent",    placeholder: "e.g. $320" },
  { key: "impressions",   label: "Impressions",     placeholder: "e.g. 15000" },
  { key: "reach",         label: "Reach",           placeholder: "e.g. 8000" },
  { key: "actions",       label: "Actions",         placeholder: "e.g. 45" },
  { key: "delivery",      label: "Delivery",        placeholder: "e.g. Active" },
];

const today = () => new Date().toISOString().split("T")[0];
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const emptyRow = (date = today()) => ({
  _id: null,
  date,
  results: "", costPerResult: "", budget: "", amountSpent: "",
  impressions: "", reach: "", actions: "", delivery: "",
  customFields: {}, _dirty: true, _new: true,
});

export default function CampaignMetricsAdmin() {
  const { id: campaignId } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const authFetch = useAuthFetch();
  const redirected = useRef(false);

  const [campaign, setCampaign]     = useState(null);
  const [customFields, setCustomFields] = useState([]);
  const [records, setRecords]       = useState([]);
  const [fetching, setFetching]     = useState(true);
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);

  // Filter range
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate]     = useState("");
  const [filtered, setFiltered]   = useState(false);

  useEffect(() => {
    if (loading || redirected.current) return;
    if (!user) { redirected.current = true; router.replace("/login"); }
    else if (user.role !== "admin") { redirected.current = true; router.replace("/viewer"); }
  }, [user, loading]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    fetchAll();
  }, [user, campaignId]);

  const fetchAll = async (start = "", end = "") => {
    setFetching(true);
    try {
      const [campRes, cfRes, metricsRes] = await Promise.all([
        authFetch(`${API}/campaigns/${campaignId}`).then(r => r.json()),
        authFetch(`${API}/custom-fields`).then(r => r.json()),
        authFetch(`${API}/metrics/${campaignId}${buildQuery(start, end)}`).then(r => r.json()),
      ]);
      if (campRes.success) setCampaign(campRes.data);
      if (cfRes.success) setCustomFields(cfRes.data || []);
      if (metricsRes.success) {
        setRecords(metricsRes.data.map(r => ({ ...r, _dirty: false, _new: false })));
      }
    } finally {
      setFetching(false);
    }
  };

  const buildQuery = (start, end) => {
    const p = [];
    if (start) p.push(`startDate=${start}`);
    if (end)   p.push(`endDate=${end}`);
    return p.length ? `?${p.join("&")}` : "";
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const applyFilter = () => {
    setFiltered(!!(startDate || endDate));
    fetchAll(startDate, endDate);
  };

  const clearFilter = () => {
    setStartDate("");
    setEndDate("");
    setFiltered(false);
    fetchAll("", "");
  };

  const addRow = () => {
    setRecords(prev => [emptyRow(), ...prev]);
  };

  const updateCell = (idx, field, value) => {
    setRecords(prev => prev.map((r, i) =>
      i === idx ? { ...r, [field]: value, _dirty: true } : r
    ));
  };

  const updateCustomCell = (idx, fieldName, value) => {
    setRecords(prev => prev.map((r, i) =>
      i === idx ? { ...r, customFields: { ...r.customFields, [fieldName]: value }, _dirty: true } : r
    ));
  };

  const deleteRow = async (idx) => {
    const row = records[idx];
    if (!row._new && row._id) {
      if (!confirm("Delete this record?")) return;
      const res = await authFetch(`${API}/metrics/${campaignId}/${row._id}`, { method: "DELETE" });
      const d = await res.json();
      if (!d.success) { showToast(d.message, "error"); return; }
    }
    setRecords(prev => prev.filter((_, i) => i !== idx));
    showToast("Row deleted");
  };

  const saveAll = async () => {
    const dirty = records.filter(r => r._dirty);
    if (dirty.length === 0) { showToast("Nothing to save"); return; }

    setSaving(true);
    try {
      const payload = dirty.map(r => ({
        date:          r.date,
        results:       r.results,
        costPerResult: r.costPerResult,
        budget:        r.budget,
        amountSpent:   r.amountSpent,
        impressions:   r.impressions,
        reach:         r.reach,
        actions:       r.actions,
        delivery:      r.delivery,
        customFields:  r.customFields || {},
      }));

      const res = await authFetch(`${API}/metrics/${campaignId}/bulk`, {
        method: "POST",
        body: JSON.stringify({ records: payload }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(`${dirty.length} record(s) saved!`);
        fetchAll(startDate, endDate);
      } else {
        showToast(data.message, "error");
      }
    } finally {
      setSaving(false);
    }
  };

  const dirtyCount = records.filter(r => r._dirty).length;

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all
          ${toast.type === "error" ? "bg-red-600 text-white" : "bg-green-600 text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/campaign" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="font-semibold text-gray-800 text-lg">{campaign?.name}</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <BarChart2 size={11} /> Daily Metrics Editor
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/campaign/${campaignId}/content`}
            className="px-3 py-2 text-sm text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
            Content Editor
          </Link>
          <button onClick={addRow}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium transition">
            <Plus size={15} /> Add Row
          </button>
          <button onClick={saveAll} disabled={saving || dirtyCount === 0}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
              ${dirtyCount > 0 ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-gray-100 text-gray-400"}
              disabled:opacity-50`}>
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
            {saving ? "Saving..." : `Save${dirtyCount > 0 ? ` (${dirtyCount})` : ""}`}
          </button>
        </div>
      </div>

      <div className="max-w-full mx-auto p-6 space-y-4">

        {/* Date Range Filter */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
            <Calendar size={16} className="text-blue-500" /> Filter by Date Range
          </h2>
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">From</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5 font-medium">To</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="flex gap-2">
              <button onClick={applyFilter}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                <BarChart2 size={15} /> Apply Filter
              </button>
              {filtered && (
                <button onClick={clearFilter}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm hover:bg-gray-200 transition">
                  <RefreshCw size={14} /> Clear
                </button>
              )}
            </div>
            {filtered && (
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full font-medium">
                Showing {records.length} record(s) in range
              </span>
            )}
          </div>
        </div>

        {/* Metrics Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">
              Daily Records
              <span className="ml-2 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{records.length}</span>
            </h2>
            <p className="text-xs text-gray-400">Edit cells directly · click Save when done</p>
          </div>

          {records.length === 0 ? (
            <div className="text-center py-16">
              <BarChart2 size={36} className="text-gray-200 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No records yet</p>
              <p className="text-gray-400 text-sm mt-1">Click &quot;Add Row&quot; to start entering daily data</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide sticky left-0 bg-gray-50 z-10 min-w-[140px]">
                      Date
                    </th>
                    {FIELDS.map(f => (
                      <th key={f.key} className="px-3 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap min-w-[120px]">
                        {f.label}
                      </th>
                    ))}
                    {customFields.map(cf => (
                      <th key={cf._id} className="px-3 py-3 text-left text-xs font-semibold text-purple-600 uppercase tracking-wide whitespace-nowrap min-w-[120px]">
                        {cf.label}
                        <span className="ml-1 text-purple-400 normal-case font-normal text-xs">custom</span>
                      </th>
                    ))}
                    <th className="px-3 py-3 w-12" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {records.map((row, idx) => (
                    <tr key={idx} className={`group transition ${row._dirty ? "bg-amber-50/60" : "hover:bg-gray-50"}`}>
                      {/* Date cell */}
                      <td className="px-4 py-2 sticky left-0 bg-inherit z-10">
                        <div className="flex items-center gap-2">
                          {row._dirty && <span className="w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" title="Unsaved" />}
                          <input
                            type="date"
                            value={row.date ? row.date.split("T")[0] : ""}
                            onChange={e => updateCell(idx, "date", e.target.value)}
                            className="border border-gray-200 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                          />
                        </div>
                      </td>
                      {/* Standard fields */}
                      {FIELDS.map(f => (
                        <td key={f.key} className="px-3 py-2">
                          <input
                            value={row[f.key] || ""}
                            onChange={e => updateCell(idx, f.key, e.target.value)}
                            placeholder={f.placeholder}
                            className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-300"
                          />
                        </td>
                      ))}
                      {/* Custom fields */}
                      {customFields.map(cf => (
                        <td key={cf._id} className="px-3 py-2">
                          <input
                            value={row.customFields?.[cf.name] || ""}
                            onChange={e => updateCustomCell(idx, cf.name, e.target.value)}
                            placeholder={`Enter ${cf.label}`}
                            className="w-full border border-purple-100 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-400 placeholder-gray-300"
                          />
                        </td>
                      ))}
                      {/* Delete */}
                      <td className="px-3 py-2">
                        <button onClick={() => deleteRow(idx)}
                          className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition opacity-0 group-hover:opacity-100">
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {dirtyCount > 0 && (
          <div className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-xl px-5 py-3">
            <p className="text-sm text-amber-700 font-medium">
              {dirtyCount} unsaved change(s) — rows highlighted in yellow
            </p>
            <button onClick={saveAll} disabled={saving}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 disabled:opacity-50 transition">
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              Save All Changes
            </button>
          </div>
        )}
      </div>
    </div>
  );
}