"use client";
import { useEffect, useState } from "react";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import {
  X, Plus, Save, Loader2, CalendarDays, CheckCircle2, Clock, Trash2
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const FIELDS = [
  { key: "totalCost",   label: "Total Cost",   placeholder: "e.g. 120.00 USD" },
  { key: "cpc",         label: "CPC (Destination)", placeholder: "e.g. 0.35 USD" },
  { key: "cpm",         label: "CPM",           placeholder: "e.g. 4.20 USD" },
  { key: "impressions", label: "Impressions",   placeholder: "e.g. 15000" },
  { key: "clicks",      label: "Clicks (Destination)", placeholder: "e.g. 320" },
  { key: "ctr",         label: "CTR (Destination)", placeholder: "e.g. 2.13%" },
  { key: "conversions", label: "Conversions",   placeholder: "e.g. 45" },
  { key: "cpa",         label: "CPA",           placeholder: "e.g. 2.50 USD" },
  { key: "budget",      label: "Budget",        placeholder: "e.g. All, $50.00/day" },
  { key: "status",      label: "Status",        placeholder: "e.g. Active, Inactive" },
];

const EMPTY = () => Object.fromEntries(FIELDS.map(f => [f.key, ""]));

function todayISO() { return new Date().toISOString().split("T")[0]; }
function fmtDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso + (iso.includes("T") ? "" : "T00:00:00"));
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
}

export default function TiktokDailyEntryPanel({ campaign, customFields = [], onClose, onSaved }) {
  const authFetch = useAuthFetch();

  const [selectedDate, setSelectedDate] = useState(todayISO());
  const [allRecords, setAllRecords]     = useState([]);
  const [form, setForm]                 = useState(EMPTY());
  const [customForm, setCustomForm]     = useState({});
  const [loadingRec, setLoadingRec]     = useState(false);
  const [saving, setSaving]             = useState(false);
  const [toast, setToast]               = useState(null);
  const [editingId, setEditingId]       = useState(null);

  useEffect(() => {
    if (!campaign?._id) return;
    authFetch(`${API}/tiktok-metrics/${campaign._id}/all`)
      .then(r => r.json())
      .then(d => { if (d.success) setAllRecords(d.data); });
  }, [campaign?._id]);

  useEffect(() => {
    if (!campaign?._id || !selectedDate) return;
    setLoadingRec(true);
    authFetch(`${API}/tiktok-metrics/${campaign._id}?startDate=${selectedDate}&endDate=${selectedDate}`)
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data.length > 0) {
          const rec = d.data[0];
          setEditingId(rec._id);
          setForm({
            totalCost: rec.totalCost || "", cpc: rec.cpc || "", cpm: rec.cpm || "",
            impressions: rec.impressions || "", clicks: rec.clicks || "", ctr: rec.ctr || "",
            conversions: rec.conversions || "", cpa: rec.cpa || "",
            budget: rec.budget || "", status: rec.status || "",
          });
          const cfMap = {};
          customFields.forEach(cf => {
            cfMap[cf.name] = rec.customFields?.get ? rec.customFields.get(cf.name) || "" : (rec.customFields?.[cf.name] || "");
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
      const payload = { date: selectedDate, ...form, customFields: customForm };
      const res  = await authFetch(`${API}/tiktok-metrics/${campaign._id}`, { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) {
        showToast("Saved!");
        const allRes = await authFetch(`${API}/tiktok-metrics/${campaign._id}/all`).then(r => r.json());
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
    const res  = await authFetch(`${API}/tiktok-metrics/${campaign._id}/${recordId}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) {
      showToast("Deleted");
      setAllRecords(r => r.filter(x => x._id !== recordId));
      if (editingId === recordId) { setEditingId(null); setForm(EMPTY()); }
      if (onSaved) onSaved(campaign._id, selectedDate, null);
    }
  };

  const markedDates = allRecords.map(r => new Date(r.date).toISOString().split("T")[0]);
  const hasData = markedDates.includes(selectedDate);

  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black text-gray-800 bg-white";

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />
      <div className="fixed right-0 top-0 h-full z-50 bg-white shadow-2xl flex flex-col" style={{ width: "min(520px, 100vw)" }}>

        {toast && (
          <div className={`absolute top-4 left-1/2 -translate-x-1/2 z-10 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-lg
            ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
            {toast.msg}
          </div>
        )}

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-white flex-shrink-0">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-0.5">TikTok Daily Entry</p>
            <h2 className="text-base font-black text-gray-900 leading-tight">{campaign.name}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
            <X size={17} className="text-gray-500" />
          </button>
        </div>

        <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/50 flex-shrink-0">
          <div className="flex items-center gap-3">
            <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold text-gray-700" />
            {hasData ? (
              <span className="flex items-center gap-1 text-xs text-emerald-600 font-medium"><CheckCircle2 size={12} /> Has data</span>
            ) : (
              <span className="flex items-center gap-1 text-xs text-gray-400"><Clock size={12} /> No entry</span>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {loadingRec ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-black" size={24} />
            </div>
          ) : (
            <>
              {editingId ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-xs text-emerald-700 font-semibold">
                  <CheckCircle2 size={13} /> Editing existing entry for {fmtDate(selectedDate)}
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs text-gray-600 font-semibold">
                  <Plus size={13} /> New entry for {fmtDate(selectedDate)}
                </div>
              )}

              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">TikTok Metrics</p>
                <div className="grid grid-cols-2 gap-3">
                  {FIELDS.map(f => (
                    <div key={f.key}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{f.label}</label>
                      <input value={form[f.key]} onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder} className={inp} />
                    </div>
                  ))}
                </div>
              </div>

              {customFields.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-purple-500 uppercase tracking-widest mb-3">Custom Fields</p>
                  <div className="grid grid-cols-2 gap-3">
                    {customFields.map(cf => (
                      <div key={cf._id}>
                        <label className="block text-xs font-semibold text-purple-400 mb-1.5">{cf.label}</label>
                        <input value={customForm[cf.name] || ""} onChange={e => setCustomForm(prev => ({ ...prev, [cf.name]: e.target.value }))}
                          placeholder={`Enter ${cf.label}`} className={`${inp} focus:ring-purple-300`} />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex items-center gap-3 bg-white flex-shrink-0">
          <button onClick={handleSave} disabled={saving || loadingRec}
            className="flex-1 flex items-center justify-center gap-2 bg-black text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-800 transition disabled:opacity-50 shadow-sm">
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

        <div className="border-t border-gray-100 flex-shrink-0" style={{ maxHeight: "240px", overflowY: "auto" }}>
          <div className="px-5 py-3 flex items-center justify-between sticky top-0 bg-gray-50 border-b border-gray-100 z-10">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">All Entries ({allRecords.length})</p>
          </div>
          {allRecords.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-6">No daily entries yet.</p>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-gray-50/80">
                <tr>{["Date","Cost","Impr.","Clicks",""].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-bold text-gray-400 uppercase tracking-wide">{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {allRecords.map(rec => {
                  const iso = new Date(rec.date).toISOString().split("T")[0];
                  const isActive = iso === selectedDate;
                  return (
                    <tr key={rec._id} className={`border-b border-gray-50 cursor-pointer transition ${isActive ? "bg-gray-100" : "hover:bg-gray-50"}`}
                      onClick={() => setSelectedDate(iso)}>
                      <td className="px-3 py-2 font-semibold text-gray-700 whitespace-nowrap">
                        {new Date(rec.date).toLocaleDateString("en-US",{ month:"short", day:"numeric", year:"numeric" })}
                      </td>
                      <td className="px-3 py-2 text-gray-600">{rec.totalCost}</td>
                      <td className="px-3 py-2 text-gray-600">{rec.impressions}</td>
                      <td className="px-3 py-2 text-gray-600">{rec.clicks}</td>
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
