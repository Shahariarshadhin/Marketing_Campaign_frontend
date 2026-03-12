"use client";
import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import Link from "next/link";
import {
  ChevronLeft, Settings, Pencil, Plus, X, Save, Loader2,
  ChevronDown, Check, AlertCircle, Shield, Package, Filter,
  Search, Info
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

// ─── Default exchange list — flat, no groups ──────────────────────────────────
const DEFAULT_EXCHANGES = [
  "Adform", "AdsMWizz", "Aja", "Bidswitch", "Dailymotion", "Digital Turbine",
  "Equativ", "Five", "Fluct", "FreakOut", "Freewheel SSP", "Google Ad Manager",
  "GumGum", "Improve Digital", "Index Exchange", "InMobi", "Kargo",
  "Magnite DV+", "Magnite Streaming", "Media.net", "MicroAd", "Nexstar Digital",
  "Nexxen (fka Unruly)", "ONE by AOL: Display Market Place", "ONE by AOL: Mobile",
  "OpenX", "PubMatic", "Rubicon Project", "ShareThrough", "SmartAdServer",
  "Sovrn", "SpotX", "Taboola", "TripleLift", "Verizon Media", "Xandr", "Yahoo SSP",
];

// ─── Public Inventory slide-in panel — flat list ─────────────────────────────
function PublicInventoryPanel({ exchanges, targetNew, onClose, onApply }) {

  // Build flat working list: { name, selected }
  const buildList = () => {
    const savedMap = {};
    (exchanges || []).forEach(e => { savedMap[e.name] = e; });

    // Defaults with saved selected state
    const base = DEFAULT_EXCHANGES.map(name => ({
      name,
      selected: savedMap[name] ? savedMap[name].selected !== false : true,
    }));

    // Custom exchanges not in defaults
    const defaultSet = new Set(DEFAULT_EXCHANGES);
    const custom = (exchanges || [])
      .filter(e => !defaultSet.has(e.name))
      .map(e => ({ name: e.name, selected: e.selected !== false }));

    return [...base, ...custom];
  };

  const [list, setList]             = useState(buildList);
  const [targetNewEx, setTargetNew] = useState(targetNew !== false);
  const [search, setSearch]         = useState("");
  const [activeTab, setActiveTab]   = useState("all"); // "all" | "selected"
  const [newName, setNewName]       = useState("");
  const [addingNew, setAddingNew]   = useState(false);

  const selectedCount = list.filter(e => e.selected).length;
  const allSelected   = list.length > 0 && list.every(e => e.selected);
  const someSelected  = list.some(e => e.selected) && !allSelected;

  const filtered = useMemo(() => {
    return list.filter(e => {
      const matchSearch = e.name.toLowerCase().includes(search.toLowerCase());
      const matchTab    = activeTab === "all" || e.selected;
      return matchSearch && matchTab;
    });
  }, [list, search, activeTab]);

  const toggle    = (name) => setList(l => l.map(e => e.name === name ? { ...e, selected: !e.selected } : e));
  const toggleAll = (checked) => setList(l => l.map(e => ({ ...e, selected: checked })));

  const addCustom = () => {
    const n = newName.trim();
    if (!n) return;
    if (!list.find(e => e.name === n)) {
      setList(l => [...l, { name: n, selected: true }]);
    }
    setNewName("");
    setAddingNew(false);
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full z-50 bg-white shadow-2xl flex flex-col"
        style={{ width: "min(800px, 100vw)" }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-base font-bold text-gray-900">Inventory Source - Public Inventory</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        {/* Info banner */}
        <div className="flex items-start gap-2.5 bg-blue-50 border-b border-blue-100 px-5 py-3 flex-shrink-0">
          <Info size={14} className="text-blue-500 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            App mediation partners give Display &amp; Video 360 advertisers more control and access to
            mobile app inventory. Impressions will not serve until add-on fee terms are reviewed and accepted.{" "}
            <span className="underline cursor-pointer font-medium">Learn more</span>
          </p>
        </div>

        {/* Toolbar: All | Selected tabs + Target new checkbox + Filter */}
        <div className="flex items-center gap-3 px-5 py-2.5 border-b border-gray-200 bg-white flex-shrink-0">
          <button onClick={() => setActiveTab("all")}
            className={`px-4 py-1.5 rounded text-sm font-semibold transition
              ${activeTab === "all" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            All
          </button>
          <button onClick={() => setActiveTab("selected")}
            className={`px-4 py-1.5 rounded text-sm font-semibold transition flex items-center gap-1.5
              ${activeTab === "selected" ? "bg-blue-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}>
            Selected
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold
              ${activeTab === "selected" ? "bg-white/25 text-white" : "bg-gray-100 text-gray-600"}`}>
              {selectedCount}
            </span>
          </button>

          <label className="flex items-center gap-2 cursor-pointer select-none ml-auto">
            <input type="checkbox" checked={targetNewEx}
              onChange={e => setTargetNew(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 accent-blue-600" />
            <span className="text-sm text-gray-700 font-medium">Target new exchanges</span>
          </label>
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400">
            <Filter size={15} />
          </button>
        </div>

        {/* Search + Add button */}
        <div className="px-5 py-2.5 border-b border-gray-100 flex items-center gap-2 bg-gray-50/50 flex-shrink-0">
          <div className="flex-1 relative">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search exchanges..."
              className="w-full pl-8 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-black" />
          </div>
          <button onClick={() => setAddingNew(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300 transition whitespace-nowrap">
            <Plus size={13} /> Add exchange
          </button>
        </div>

        {/* Add new exchange inline form */}
        {addingNew && (
          <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-center gap-2 flex-shrink-0">
            <input value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addCustom(); }}
              placeholder="Exchange name (e.g. MyAdNetwork)"
              autoFocus
              className="flex-1 border border-blue-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-black" />
            <button onClick={addCustom}
              className="px-4 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition">
              Add
            </button>
            <button onClick={() => { setAddingNew(false); setNewName(""); }}
              className="p-1.5 hover:bg-blue-100 rounded-lg transition">
              <X size={13} className="text-blue-500" />
            </button>
          </div>
        )}

        {/* Flat exchange list */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-white border-b border-gray-200 z-10">
              <tr>
                <td className="px-4 py-2.5 w-10">
                  <input type="checkbox"
                    checked={allSelected}
                    ref={el => { if (el) el.indeterminate = someSelected; }}
                    onChange={e => toggleAll(e.target.checked)}
                    className="w-4 h-4 rounded border-gray-300 accent-blue-600" />
                </td>
                <td className="px-3 py-2.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">
                  Public Inventory
                  <span className="ml-2 font-normal text-gray-400 normal-case tracking-normal">
                    ({selectedCount} of {list.length})
                  </span>
                </td>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={2} className="px-5 py-8 text-center text-sm text-gray-400">No exchanges found</td></tr>
              ) : (
                filtered.map(ex => (
                  <tr key={ex.name}
                    className={`border-b border-gray-50 hover:bg-blue-50/40 cursor-pointer transition
                      ${ex.selected ? "bg-blue-50/20" : ""}`}
                    onClick={() => toggle(ex.name)}>
                    <td className="px-4 py-2.5" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={ex.selected}
                        onChange={() => toggle(ex.name)}
                        className="w-4 h-4 rounded border-gray-300 accent-blue-600" />
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`text-sm ${ex.selected ? "text-gray-800" : "text-gray-500"}`}>
                        {ex.name}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-200 bg-white flex-shrink-0">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Settings size={13} className="text-gray-400 flex-shrink-0" />
            New line items in this insertion order will inherit these settings.
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose}
              className="px-5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition">
              Cancel
            </button>
            <button onClick={() => onApply(
              list.map(e => ({ name: e.name, selected: e.selected })),
              targetNewEx
            )}
              className="px-5 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
              Apply
            </button>
          </div>
        </div>

      </div>
    </>
  );
}

// ─── Editable section row ─────────────────────────────────────────────────────
function SectionRow({ label, children, onEdit, editContent, isEditing, onSave, onCancel, saving }) {
  return (
    <div className="flex items-start border-b border-gray-100 last:border-0 py-5 gap-4">
      {/* Label col */}
      <div className="w-56 flex-shrink-0">
        <p className="text-sm font-medium text-gray-700">{label}</p>
      </div>
      {/* Content col */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <div className="space-y-3">
            {editContent}
            <div className="flex gap-2 pt-1">
              <button onClick={onSave} disabled={saving}
                className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                Save
              </button>
              <button onClick={onCancel}
                className="px-4 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200 transition">
                Cancel
              </button>
            </div>
          </div>
        ) : (
          children
        )}
      </div>
      {/* Edit pencil */}
      {!isEditing && onEdit && (
        <button onClick={onEdit}
          className="flex-shrink-0 p-1.5 hover:bg-gray-100 rounded-lg transition text-gray-400 hover:text-gray-600">
          <Pencil size={15} />
        </button>
      )}
    </div>
  );
}

// ─── Tag list display ─────────────────────────────────────────────────────────
function TagList({ items, emptyText = "None selected", color = "gray" }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, 5);
  const more    = items.length - 5;
  const colors  = {
    gray:   "bg-gray-100 text-gray-600",
    blue:   "bg-blue-50 text-blue-700",
    red:    "bg-red-50 text-red-600",
    green:  "bg-green-50 text-green-700",
    purple: "bg-purple-50 text-purple-700",
  };
  if (!items || items.length === 0)
    return <p className="text-sm text-gray-400 italic">{emptyText}</p>;
  return (
    <div>
      <div className="flex flex-wrap gap-1.5">
        {visible.map((t, i) => (
          <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${colors[color] || colors.gray}`}>
            {t}
          </span>
        ))}
      </div>
      {more > 0 && (
        <button onClick={() => setExpanded(e => !e)}
          className="mt-1.5 text-xs text-blue-500 hover:underline font-medium">
          {expanded ? "show less" : `show ${more} more`}
        </button>
      )}
    </div>
  );
}

// ─── Tag editor ───────────────────────────────────────────────────────────────
function TagEditor({ value, onChange, placeholder }) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (v && !value.includes(v)) { onChange([...value, v]); }
    setInput("");
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((t, i) => (
          <span key={i} className="flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
            {t}
            <button onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="hover:text-red-500 transition"><X size={10} /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          placeholder={placeholder}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
        <button onClick={add}
          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-semibold hover:bg-blue-100 transition border border-blue-200">
          <Plus size={13} />
        </button>
      </div>
    </div>
  );
}

// ─── Section card wrapper ─────────────────────────────────────────────────────
function SectionCard({ title, icon, subtitle, children }) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden mb-5">
      <div className="flex items-start gap-3 px-6 py-4 border-b border-gray-100 bg-gray-50/60">
        <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
          {icon}
        </div>
        <div>
          <h3 className="text-sm font-bold text-gray-800">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      <div className="px-6">{children}</div>
    </div>
  );
}

// ─── Main page ─────────────────────────────────────────────────────────────────
export default function IODetailPage() {
  const { id: campaignId, ioId } = useParams();
  const router    = useRouter();
  const { user }  = useAuth();
  const authFetch = useAuthFetch();

  const [io, setIO]             = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState(null);
  const [showInventoryPanel, setShowInventoryPanel] = useState(false);

  // Which row is being edited
  const [editing, setEditing]   = useState(null); // string key

  // Local draft state for each editable section
  const [draft, setDraft]       = useState({});

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    if (!user) return;
    Promise.all([
      authFetch(`${API}/campaigns/${campaignId}`).then(r => r.json()),
      authFetch(`${API}/campaigns/${campaignId}/insertion-orders/${ioId}`).then(r => r.json()),
    ]).then(([campData, ioData]) => {
      if (campData.success) setCampaign(campData.data);
      if (ioData.success)   setIO(ioData.data);
    }).finally(() => setLoading(false));
  }, [user, campaignId, ioId]);

  const startEdit = (key, initial) => {
    setEditing(key);
    setDraft(initial);
  };

  const cancelEdit = () => { setEditing(null); setDraft({}); };

  const saveSettings = async (patch) => {
    setSaving(true);
    try {
      const res  = await authFetch(`${API}/campaigns/${campaignId}/insertion-orders/${ioId}/settings`, {
        method: "PATCH", body: JSON.stringify(patch),
      });
      const data = await res.json();
      if (data.success) {
        setIO(data.data);
        setEditing(null);
        setDraft({});
        showToast("Saved!");
      } else {
        showToast(data.message || "Save failed", "error");
      }
    } catch { showToast("Save failed", "error"); }
    finally { setSaving(false); }
  };

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-500" size={32} />
    </div>
  );
  if (!io) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-gray-500">Insertion order not found.</p>
    </div>
  );

  const inv = io.inventorySource || {};
  const tgt = io.targeting       || {};
  const bs  = tgt.brandSafety    || {};
  const vb  = tgt.viewability    || {};
  const isAdmin = user?.role === 'admin';

  // ─── Quality edit ────────────────────────────────────────────────────────────
  const QUALITY_OPTIONS = [
    "Authorized Direct Sellers And Resellers",
    "Authorized Direct Sellers",
    "Authorized Direct Sellers, Resellers And Unknown",
    "All",
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg
          ${toast.type === "error" ? "bg-red-500" : "bg-emerald-500"}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-gray-400 mb-3 flex-wrap">
          <Link href="/dashboard/brands" className="hover:text-blue-600 transition">Brands</Link>
          <ChevronLeft size={12} className="rotate-180" />
          {campaign?.motherBrand && (
            <>
              <Link href={`/dashboard/brands/${campaign.motherBrand._id || campaign.motherBrand}`}
                className="hover:text-blue-600 transition">
                {campaign.motherBrand.name || "Brand"}
              </Link>
              <ChevronLeft size={12} className="rotate-180" />
            </>
          )}
          <Link href={`/dashboard/campaign/${campaignId}/insertion-orders`}
            className="hover:text-blue-600 transition">
            {campaign?.name || "Campaign"}
          </Link>
          <ChevronLeft size={12} className="rotate-180" />
          <span className="text-gray-600 font-medium">{io.name}</span>
        </nav>

        {/* Title row */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 rounded-xl transition">
              <ChevronLeft size={18} className="text-gray-500" />
            </button>
            <div>
              <h1 className="text-xl font-black text-gray-900">{io.name}</h1>
              <p className="text-xs text-gray-400 font-mono mt-0.5">ID: {io.ioId}</p>
            </div>
          </div>
          {/* Status badge */}
          <span className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide
            ${io.status === 'active'    ? 'bg-green-100 text-green-700' :
              io.status === 'paused'    ? 'bg-amber-100 text-amber-700' :
              io.status === 'completed' ? 'bg-blue-100 text-blue-700'   :
                                         'bg-gray-100 text-gray-500'}`}>
            {io.status}
          </span>
        </div>

        {/* Summary chips */}
        <div className="flex items-center gap-3 mt-3 flex-wrap">
          {[
            { label: "Type",    val: io.type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase()) },
            { label: "Budget",  val: `${io.currency} ${Number(io.budget||0).toFixed(2)}` },
            { label: "Goal",    val: io.goalValue ? `${io.goalType?.toUpperCase()} $${Number(io.goalValue).toFixed(2)}` : "—" },
            { label: "Pacing",  val: io.pacing },
            { label: "Period",  val: io.startDate && io.endDate ? `${io.startDate} → ${io.endDate}` : "—" },
          ].map(({ label, val }) => (
            <div key={label} className="flex items-center gap-1.5 bg-gray-100 rounded-lg px-3 py-1.5 text-xs">
              <span className="text-gray-400 font-medium">{label}:</span>
              <span className="font-semibold text-gray-700">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ──────────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-6 py-6">

        {/* ══ INVENTORY SOURCE ════════════════════════════════════════════════ */}
        <SectionCard
          title="Inventory source"
          icon={<Package size={14} className="text-blue-500" />}
          subtitle="New line items in this insertion order will inherit these settings.">

          {/* Quality */}
          <SectionRow
            label="Quality"
            onEdit={isAdmin ? () => startEdit('quality', { quality: inv.quality || QUALITY_OPTIONS[0] }) : null}
            isEditing={editing === 'quality'}
            onSave={() => saveSettings({ inventorySource: { ...inv, quality: draft.quality } })}
            onCancel={cancelEdit}
            saving={saving}
            editContent={
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Quality level</label>
                <select value={draft.quality || ''}
                  onChange={e => setDraft(d => ({ ...d, quality: e.target.value }))}
                  className="w-full max-w-md border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400">
                  {QUALITY_OPTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                </select>
                <p className="text-xs text-gray-400">Select who you want to buy web and app inventory from.</p>
              </div>
            }>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm text-gray-700 shadow-sm">
                {inv.quality || "Authorized Direct Sellers And Resellers"}
                <ChevronDown size={13} className="text-gray-400" />
              </div>
              <p className="text-xs text-gray-400 max-w-xs">Select who you want to buy web and app inventory from.</p>
            </div>
          </SectionRow>

          {/* Public Inventory — opens slide-in panel */}
          <SectionRow
            label="Public Inventory"
            onEdit={isAdmin ? () => setShowInventoryPanel(true) : null}
            isEditing={false}
            onSave={null}
            onCancel={null}>
            {(() => {
              const exList    = inv.exchanges || [];
              const selCount  = exList.filter(e => e.selected).length;
              const totalCount = exList.length || DEFAULT_EXCHANGES.length;
              const subCount  = exList.filter(e => e.group === "App mediation partners" && e.selected).length;
              return (
                <div>
                  <div className="flex items-start gap-2">
                    <Check size={14} className="text-green-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <button
                        onClick={isAdmin ? () => setShowInventoryPanel(true) : undefined}
                        className={`text-sm font-medium ${isAdmin ? 'text-blue-600 hover:underline cursor-pointer' : 'text-gray-700'}`}>
                        {selCount > 0
                          ? `${selCount} Exchange${selCount !== 1 ? 's' : ''} and ${subCount} Subexchange${subCount !== 1 ? 's' : ''} are selected`
                          : `${totalCount} Exchanges and 0 Subexchanges are selected`}
                      </button>
                      {inv.targetNewExchanges !== false && (
                        <p className="text-xs text-gray-400 mt-0.5">Targeting new exchanges</p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5">
                    <AlertCircle size={13} className="text-blue-500 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-blue-700">
                      App mediation partners give Display &amp; Video 360 advertisers more control and access to mobile
                      app inventory. Impressions will not serve until add-on fee terms are reviewed and accepted.
                    </p>
                  </div>
                </div>
              );
            })()}
          </SectionRow>

          {/* Public Inventory slide-in panel */}
          {showInventoryPanel && (
            <PublicInventoryPanel
              exchanges={inv.exchanges || []}
              targetNew={inv.targetNewExchanges !== false}
              onClose={() => setShowInventoryPanel(false)}
              onApply={async (exchanges, targetNewExchanges) => {
                await saveSettings({
                  inventorySource: { ...inv, exchanges, targetNewExchanges }
                });
                setShowInventoryPanel(false);
              }}
            />
          )}

          {/* Deals and Inventory Packages */}
          <SectionRow
            label="Deals and Inventory Packages"
            onEdit={isAdmin ? () => startEdit('deals', { deals: inv.deals || '' }) : null}
            isEditing={editing === 'deals'}
            onSave={() => saveSettings({ inventorySource: { ...inv, deals: draft.deals } })}
            onCancel={cancelEdit}
            saving={saving}
            editContent={
              <input value={draft.deals || ''}
                onChange={e => setDraft(d => ({ ...d, deals: e.target.value }))}
                placeholder="e.g. 0 deals and inventory packages selected"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            }>
            <p className="text-sm text-gray-600">{inv.deals || "0 deals and inventory packages selected"}</p>
          </SectionRow>

          {/* Deal groups */}
          <SectionRow
            label="Deal groups and preferred deal groups"
            onEdit={isAdmin ? () => startEdit('dealGroups', { dealGroups: inv.dealGroups || '' }) : null}
            isEditing={editing === 'dealGroups'}
            onSave={() => saveSettings({ inventorySource: { ...inv, dealGroups: draft.dealGroups } })}
            onCancel={cancelEdit}
            saving={saving}
            editContent={
              <input value={draft.dealGroups || ''}
                onChange={e => setDraft(d => ({ ...d, dealGroups: e.target.value }))}
                placeholder="e.g. No inventory groups selected"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
            }>
            <p className="text-sm text-gray-600">{inv.dealGroups || "No inventory groups selected"}</p>
          </SectionRow>
        </SectionCard>

        {/* ══ TARGETING ═══════════════════════════════════════════════════════ */}
        <SectionCard
          title="Targeting"
          icon={<Shield size={14} className="text-blue-500" />}
          subtitle="New line items in this insertion order will inherit these settings. Targeting set on insertion orders doesn't apply to YouTube & partners line items.">

          {/* Brand Safety */}
          <SectionRow
            label="Brand safety"
            onEdit={isAdmin ? () => startEdit('brandSafety', {
              digitalContentLabels: [...(bs.digitalContentLabels || [])],
              sensitiveCategories:  [...(bs.sensitiveCategories  || [])],
            }) : null}
            isEditing={editing === 'brandSafety'}
            onSave={() => saveSettings({
              targeting: { ...tgt, brandSafety: {
                digitalContentLabels: draft.digitalContentLabels,
                sensitiveCategories:  draft.sensitiveCategories,
              }}
            })}
            onCancel={cancelEdit}
            saving={saving}
            editContent={
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Digital Content Label Exclusions
                  </label>
                  <TagEditor
                    value={draft.digitalContentLabels || []}
                    onChange={v => setDraft(d => ({ ...d, digitalContentLabels: v }))}
                    placeholder="Add label (e.g. DL-MA)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                    Sensitive Category Exclusions
                  </label>
                  <TagEditor
                    value={draft.sensitiveCategories || []}
                    onChange={v => setDraft(d => ({ ...d, sensitiveCategories: v }))}
                    placeholder="Add category (e.g. Gambling)"
                  />
                </div>
              </div>
            }>
            <div className="space-y-3">
              {/* Digital Content Labels */}
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-4 h-4 rounded-full border-2 border-red-400 flex items-center justify-center flex-shrink-0">
                    <X size={9} className="text-red-400" />
                  </div>
                  <p className="text-xs font-semibold text-gray-700">Digital Content Label exclusions</p>
                </div>
                <div className="ml-6">
                  <TagList items={bs.digitalContentLabels || []} emptyText="None selected" color="red" />
                </div>
              </div>
              {/* Sensitive Categories */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-1.5">Sensitive Category exclusions</p>
                <div className="ml-0">
                  <TagList items={bs.sensitiveCategories || []} emptyText="None selected" color="red" />
                </div>
              </div>
            </div>
          </SectionRow>

          {/* Environment */}
          <SectionRow
            label="Environment"
            onEdit={isAdmin ? () => startEdit('environment', { environment: [...(tgt.environment || ['Web', 'App'])] }) : null}
            isEditing={editing === 'environment'}
            onSave={() => saveSettings({ targeting: { ...tgt, environment: draft.environment } })}
            onCancel={cancelEdit}
            saving={saving}
            editContent={
              <div className="space-y-2">
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide">Include environments</label>
                {['Web', 'App', 'Connected TV', 'In-app'].map(env => (
                  <label key={env} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox"
                      checked={(draft.environment || []).includes(env)}
                      onChange={e => {
                        const cur = draft.environment || [];
                        setDraft(d => ({
                          ...d,
                          environment: e.target.checked ? [...cur, env] : cur.filter(x => x !== env)
                        }));
                      }}
                      className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">{env}</span>
                  </label>
                ))}
              </div>
            }>
            {(tgt.environment || []).length > 0 ? (
              <div>
                <div className="flex items-center gap-1.5 mb-1">
                  <Check size={13} className="text-green-500" />
                  <p className="text-xs font-semibold text-gray-700">Include the following environments</p>
                </div>
                <div className="ml-5 space-y-0.5">
                  {(tgt.environment || []).map(e => (
                    <p key={e} className="text-sm text-gray-600">{e}</p>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400 italic">No environments selected</p>
            )}
          </SectionRow>

          {/* Viewability */}
          <SectionRow
            label="Viewability"
            onEdit={isAdmin ? () => startEdit('viewability', {
              openMeasurement: vb.openMeasurement !== false,
              notes: vb.notes || '',
            }) : null}
            isEditing={editing === 'viewability'}
            onSave={() => saveSettings({ targeting: { ...tgt, viewability: {
              openMeasurement: draft.openMeasurement,
              notes:           draft.notes,
            }}})}
            onCancel={cancelEdit}
            saving={saving}
            editContent={
              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox"
                    checked={draft.openMeasurement !== false}
                    onChange={e => setDraft(d => ({ ...d, openMeasurement: e.target.checked }))}
                    className="rounded border-gray-300" />
                  <span className="text-sm font-semibold text-gray-700">Open Measurement</span>
                </label>
                <p className="text-xs text-gray-400 ml-6">Target only Open Measurement enabled mobile display inventory.</p>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5">Notes</label>
                  <input value={draft.notes || ''}
                    onChange={e => setDraft(d => ({ ...d, notes: e.target.value }))}
                    placeholder="Additional viewability notes"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
              </div>
            }>
            <div className="space-y-2">
              {vb.notes && (
                <div className="flex items-center gap-2">
                  <Settings size={13} className="text-gray-400" />
                  <p className="text-sm text-gray-500">{vb.notes}</p>
                </div>
              )}
              {vb.openMeasurement !== false && (
                <div>
                  <div className="flex items-center gap-1.5">
                    <Check size={13} className="text-green-500" />
                    <p className="text-xs font-semibold text-gray-700">Open Measurement</p>
                  </div>
                  <p className="text-xs text-gray-400 ml-5 mt-0.5">Target only Open Measurement enabled mobile display inventory.</p>
                </div>
              )}
              {vb.openMeasurement === false && !vb.notes && (
                <p className="text-sm text-gray-400 italic">Not configured</p>
              )}
            </div>
          </SectionRow>

          {/* Geography */}
          <SectionRow
            label="Geography"
            onEdit={isAdmin ? () => startEdit('geography', { geography: [...(tgt.geography || [])] }) : null}
            isEditing={editing === 'geography'}
            onSave={() => saveSettings({ targeting: { ...tgt, geography: draft.geography } })}
            onCancel={cancelEdit}
            saving={saving}
            editContent={
              <TagEditor value={draft.geography || []} onChange={v => setDraft(d => ({ ...d, geography: v }))} placeholder="Add country or region" />
            }>
            <TagList items={tgt.geography || []} emptyText="All geographies" color="blue" />
          </SectionRow>

          {/* Language */}
          <SectionRow
            label="Language"
            onEdit={isAdmin ? () => startEdit('language', { language: [...(tgt.language || [])] }) : null}
            isEditing={editing === 'language'}
            onSave={() => saveSettings({ targeting: { ...tgt, language: draft.language } })}
            onCancel={cancelEdit}
            saving={saving}
            editContent={
              <TagEditor value={draft.language || []} onChange={v => setDraft(d => ({ ...d, language: v }))} placeholder="Add language (e.g. English)" />
            }>
            <TagList items={tgt.language || []} emptyText="All languages" color="green" />
          </SectionRow>

          {/* Device */}
          <SectionRow
            label="Device"
            onEdit={isAdmin ? () => startEdit('device', { device: [...(tgt.device || [])] }) : null}
            isEditing={editing === 'device'}
            onSave={() => saveSettings({ targeting: { ...tgt, device: draft.device } })}
            onCancel={cancelEdit}
            saving={saving}
            editContent={
              <div className="space-y-2">
                {['Mobile', 'Desktop', 'Tablet', 'Connected TV', 'Smart TV'].map(d => (
                  <label key={d} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox"
                      checked={(draft.device || []).includes(d)}
                      onChange={e => {
                        const cur = draft.device || [];
                        setDraft(prev => ({
                          ...prev,
                          device: e.target.checked ? [...cur, d] : cur.filter(x => x !== d)
                        }));
                      }}
                      className="rounded border-gray-300" />
                    <span className="text-sm text-gray-700">{d}</span>
                  </label>
                ))}
              </div>
            }>
            <TagList items={tgt.device || []} emptyText="All devices" color="purple" />
          </SectionRow>

          {/* Audience */}
          <SectionRow
            label="Audience"
            onEdit={isAdmin ? () => startEdit('audience', { audience: [...(tgt.audience || [])] }) : null}
            isEditing={editing === 'audience'}
            onSave={() => saveSettings({ targeting: { ...tgt, audience: draft.audience } })}
            onCancel={cancelEdit}
            saving={saving}
            editContent={
              <TagEditor value={draft.audience || []} onChange={v => setDraft(d => ({ ...d, audience: v }))} placeholder="Add audience segment" />
            }>
            <TagList items={tgt.audience || []} emptyText="No audience targeting" color="purple" />
          </SectionRow>

          {/* Keywords */}
          <SectionRow
            label="Keywords"
            onEdit={isAdmin ? () => startEdit('keywords', { keywords: [...(tgt.keywords || [])] }) : null}
            isEditing={editing === 'keywords'}
            onSave={() => saveSettings({ targeting: { ...tgt, keywords: draft.keywords } })}
            onCancel={cancelEdit}
            saving={saving}
            editContent={
              <TagEditor value={draft.keywords || []} onChange={v => setDraft(d => ({ ...d, keywords: v }))} placeholder="Add keyword" />
            }>
            <TagList items={tgt.keywords || []} emptyText="No keyword targeting" color="blue" />
          </SectionRow>

        </SectionCard>

        {/* ══ ADD TARGETING LINK ══════════════════════════════════════════════ */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => setEditing('newTargeting')}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-semibold transition">
            <Plus size={15} /> Add targeting
          </button>
        </div>

        {/* ══ ADDITIONAL SETTINGS ═════════════════════════════════════════════ */}
        <SectionCard
          title="Additional settings"
          icon={<Settings size={14} className="text-blue-500" />}>
          <SectionRow
            label="Notes"
            onEdit={isAdmin ? () => startEdit('additionalNotes', { additionalNotes: tgt.additionalNotes || '' }) : null}
            isEditing={editing === 'additionalNotes'}
            onSave={() => saveSettings({ targeting: { ...tgt, additionalNotes: draft.additionalNotes } })}
            onCancel={cancelEdit}
            saving={saving}
            editContent={
              <textarea value={draft.additionalNotes || ''}
                onChange={e => setDraft(d => ({ ...d, additionalNotes: e.target.value }))}
                rows={3}
                placeholder="Additional targeting notes..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" />
            }>
            <p className="text-sm text-gray-600">{tgt.additionalNotes || <span className="text-gray-400 italic">None</span>}</p>
          </SectionRow>
        </SectionCard>

      </div>
    </div>
  );
}