"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import Link from "next/link";
import {
  ArrowLeft, Plus, Save, X, Loader2, MoreVertical,
  Edit2, Trash2, ToggleLeft, ToggleRight, ChevronLeft,
  ChevronRight, BarChart3, DollarSign, Eye, Zap,
  PauseCircle, Filter, Download, Maximize2, Settings2
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const IO_TYPES    = ['standard','over_the_top','programmatic_guaranteed'];
const GOAL_TYPES  = ['cpm','cpc','cpa','cpcv','viewability','none'];
const PACING_OPTS = ['pacing','underpacing','at_risk'];
const CURRENCIES  = ['USD','AUD','EUR','GBP','BDT','INR'];

const EMPTY_FORM = {
  name:'', type:'standard', status:'draft', pacing:'pacing',
  budget:'', currency:'USD', amountSpent:'',
  goalType:'cpm', goalValue:'', goal:'',
  impressions:'', revenue:'', interactions:'', conversions:'', cpa:'',
  customImprValue:'', startDate:'', endDate:'',
  frequencyCap:'', notes:'', active:false,
};

// ─── Sparkline bar chart (DV360 style) ───────────────────────────────────────
function Sparkline({ data, color = '#1a73e8', goalValue = null }) {
  const W = 260, H = 52, PAD = 2;
  const max = Math.max(...data.map(d => d.v), goalValue || 0, 0.001);
  const barW = Math.max(2, (W - PAD * (data.length - 1)) / data.length);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 18}`} preserveAspectRatio="none"
      style={{ display: 'block', overflow: 'visible' }}>
      {/* Goal line */}
      {goalValue > 0 && (
        <line
          x1={0} y1={H - (goalValue / max) * H}
          x2={W} y2={H - (goalValue / max) * H}
          stroke={color} strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5"
        />
      )}
      {/* Bars */}
      {data.map((d, i) => {
        const bh  = Math.max(2, (d.v / max) * H);
        const x   = i * (barW + PAD);
        const isToday = i === data.length - 1;
        return (
          <rect key={i} x={x} y={H - bh} width={barW} height={bh}
            fill={isToday ? color : `${color}55`}
            rx="1"
          />
        );
      })}
      {/* Day labels — T F S S M W T pattern */}
      {data.map((d, i) => {
        // only show every ~3rd label to avoid crowding
        if (i % 3 !== 0 && i !== data.length - 1) return null;
        const x = i * (barW + PAD) + barW / 2;
        return (
          <text key={`l${i}`} x={x} y={H + 13}
            textAnchor="middle" fontSize="7" fill="#9ca3af" fontFamily="monospace">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// Build 30-day sparkline data from a list of IOs (using createdAt as proxy)
function buildSparkData(orders, valueKey, days = 30) {
  const result = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const iso   = d.toISOString().split('T')[0];
    const label = ['S','M','T','W','T','F','S'][d.getDay()];
    // Sum value for IOs whose startDate matches this day (or spread evenly as proxy)
    const v = orders
      .filter(o => {
        const sd = (o.startDate || '').slice(0, 10);
        return sd === iso;
      })
      .reduce((s, o) => s + Number(o[valueKey] || 0), 0);
    result.push({ iso, label, v, day: d.getDate() });
  }
  return result;
}

// ─── DV360-style stat card with sparkline ────────────────────────────────────
function SparkCard({ title, dateRange, value, sub, subColor, goalValue, goalLabel,
                     sparkData, sparkColor, todayValue, todayCurrency, compact }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm flex flex-col min-w-0">
      {/* Header */}
      <div className="mb-1">
        <p className="text-xs text-gray-500 font-medium leading-tight">
          {title}
          {dateRange && <span className="text-gray-400 ml-1">({dateRange})</span>}
        </p>
      </div>
      {/* Main value */}
      <p className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-0.5">
        {value}
      </p>
      {/* Sub line */}
      {sub && (
        <div className="flex items-center gap-1.5 mb-1">
          {goalLabel && (
            <span className="inline-block w-8 h-2 rounded-sm" style={{ background: sparkColor || '#34a853' }} />
          )}
          <p className="text-xs text-gray-400">{sub}</p>
          {goalLabel && (
            <span className="text-xs font-semibold" style={{ color: subColor || '#1a73e8' }}>
              {goalLabel}
            </span>
          )}
        </div>
      )}
      {/* Divider */}
      <div className="border-t border-gray-100 my-2" />
      {/* Sparkline */}
      <div className="flex-1 min-h-[70px]">
        {sparkData && sparkData.length > 0 ? (
          <Sparkline data={sparkData} color={sparkColor || '#1a73e8'} goalValue={goalValue} />
        ) : (
          <div className="h-16 flex items-center justify-center">
            <div className="w-full h-0.5 bg-gray-100 rounded" />
          </div>
        )}
      </div>
      {/* Today footer */}
      <div className="border-t border-gray-100 mt-1 pt-2 flex items-center justify-between">
        <span className="text-xs text-gray-400">Today:</span>
        <span className="text-xs font-semibold text-gray-700">
          {todayCurrency ? `$${Number(todayValue || 0).toFixed(2)}` : (todayValue || '$0.00')}
        </span>
      </div>
    </div>
  );
}

// ─── Pacing badge ─────────────────────────────────────────────────────────────
function PacingBadge({ pacing, active, status }) {
  if (!active || status === 'draft')
    return <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full font-medium">{status}</span>;
  if (pacing === 'pacing')
    return <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-semibold"><span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />Pacing</span>;
  if (pacing === 'underpacing')
    return <span className="text-xs bg-red-50 text-red-500 px-2 py-0.5 rounded-full font-semibold">Underpacing</span>;
  return <span className="text-xs bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-semibold">At Risk</span>;
}

// ─── IO Form Modal ────────────────────────────────────────────────────────────
function IOModal({ io, onSave, onClose, saving, campaign }) {
  const [form, setForm] = useState(io ? {
    name: io.name, type: io.type, status: io.status, pacing: io.pacing,
    budget: io.budget, currency: io.currency, amountSpent: io.amountSpent,
    goalType: io.goalType, goalValue: io.goalValue, goal: io.goal,
    impressions: io.impressions, revenue: io.revenue, interactions: io.interactions,
    conversions: io.conversions, cpa: io.cpa, customImprValue: io.customImprValue,
    startDate: io.startDate, endDate: io.endDate, frequencyCap: io.frequencyCap,
    notes: io.notes, active: io.active,
  } : { ...EMPTY_FORM });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inp = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 bg-white";
  const sel = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 bg-white";
  const lbl = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5";

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-3xl z-10">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{campaign?.name}</p>
            <h2 className="text-lg font-black text-gray-900">{io ? 'Edit Insertion Order' : 'New Insertion Order'}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-5">
          {/* Name + Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>IO Name *</label>
              <input className={inp} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. IO 123" />
            </div>
            <div>
              <label className={lbl}>Type</label>
              <select className={sel} value={form.type} onChange={e => set('type', e.target.value)}>
                {IO_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
              </select>
            </div>
          </div>

          {/* Status + Pacing */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Status</label>
              <select className={sel} value={form.status} onChange={e => set('status', e.target.value)}>
                {['active','draft','paused','completed'].map(s =>
                  <option key={s} value={s}>{s.charAt(0).toUpperCase()+s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Pacing</label>
              <select className={sel} value={form.pacing} onChange={e => set('pacing', e.target.value)}>
                {PACING_OPTS.map(p => <option key={p} value={p}>{p.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</option>)}
              </select>
            </div>
          </div>

          {/* Budget */}
          <div>
            <label className={lbl}>Budget & Currency</label>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <input type="number" className={inp} value={form.budget} onChange={e => set('budget', e.target.value)} placeholder="0.00" />
              </div>
              <select className={sel} value={form.currency} onChange={e => set('currency', e.target.value)}>
                {CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>

          {/* Goal */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Goal Type</label>
              <select className={sel} value={form.goalType} onChange={e => set('goalType', e.target.value)}>
                {GOAL_TYPES.map(g => <option key={g} value={g}>{g.toUpperCase()}</option>)}
              </select>
            </div>
            <div>
              <label className={lbl}>Goal Value</label>
              <input type="number" className={inp} value={form.goalValue} onChange={e => set('goalValue', e.target.value)} placeholder="0.00" />
            </div>
          </div>

          {/* Schedule */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Start Date</label>
              <input type="date" className={inp} value={form.startDate} onChange={e => set('startDate', e.target.value)} />
            </div>
            <div>
              <label className={lbl}>End Date</label>
              <input type="date" className={inp} value={form.endDate} onChange={e => set('endDate', e.target.value)} />
            </div>
          </div>

          {/* Delivery metrics */}
          <div>
            <label className={lbl}>Delivery Metrics</label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { k:'impressions', p:'Impressions' },
                { k:'revenue',     p:'Revenue ($)' },
                { k:'interactions',p:'Interactions' },
                { k:'conversions', p:'Conversions' },
                { k:'cpa',         p:'CPA ($)' },
                { k:'customImprValue', p:'Custom Impr. Value' },
              ].map(f => (
                <div key={f.k}>
                  <p className="text-xs text-gray-400 mb-1">{f.p}</p>
                  <input type="number" className={inp} value={form[f.k]} onChange={e => set(f.k, e.target.value)} placeholder="0" />
                </div>
              ))}
            </div>
          </div>

          {/* Frequency cap + Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={lbl}>Frequency Cap</label>
              <input className={inp} value={form.frequencyCap} onChange={e => set('frequencyCap', e.target.value)} placeholder="e.g. 3/day" />
            </div>
            <div>
              <label className={lbl}>Notes</label>
              <input className={inp} value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional notes" />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
            <div>
              <p className="text-sm font-bold text-gray-700">Activate immediately</p>
              <p className="text-xs text-gray-400">Set insertion order as active right away</p>
            </div>
            <button type="button" onClick={() => set('active', !form.active)}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.active ? 'bg-blue-600' : 'bg-gray-300'}`}>
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${form.active ? 'translate-x-6' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex gap-3 rounded-b-3xl">
          <button onClick={() => onSave(form)} disabled={saving}
            className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition disabled:opacity-50">
            {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
            {saving ? 'Saving…' : io ? 'Update IO' : 'Create IO'}
          </button>
          <button onClick={onClose} className="px-5 py-2.5 bg-gray-100 text-gray-700 rounded-xl font-semibold text-sm hover:bg-gray-200 transition">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Row menu ─────────────────────────────────────────────────────────────────
function RowMenu({ io, onEdit, onDelete, onToggle }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button onClick={() => setOpen(o => !o)}
        className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition">
        <MoreVertical size={15} />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-7 bg-white rounded-2xl shadow-xl border border-gray-100 z-20 py-1.5 min-w-[140px]">
            <button onClick={() => { onEdit(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              <Edit2 size={13} /> Edit
            </button>
            <button onClick={() => { onToggle(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
              {io.active ? <PauseCircle size={13} /> : <Zap size={13} />}
              {io.active ? 'Pause' : 'Activate'}
            </button>
            <div className="border-t border-gray-100 my-1" />
            <button onClick={() => { onDelete(); setOpen(false); }}
              className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50">
              <Trash2 size={13} /> Delete
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InsertionOrdersPage() {
  const { id: campaignId } = useParams();
  const router   = useRouter();
  const { user, loading } = useAuth();
  const authFetch = useAuthFetch();
  const redirected = useRef(false);

  const [campaign, setCampaign] = useState(null);
  const [orders, setOrders]     = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editIO, setEditIO]     = useState(null);
  const [saving, setSaving]     = useState(false);
  const [search, setSearch]     = useState('');
  const [toast, setToast]       = useState(null);

  useEffect(() => {
    if (loading || redirected.current) return;
    if (!user) { redirected.current = true; router.replace('/login'); }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user, campaignId]);

  const loadAll = async () => {
    setFetching(true);
    try {
      const [cRes, ioRes] = await Promise.all([
        authFetch(`${API}/campaigns/${campaignId}`).then(r => r.json()),
        authFetch(`${API}/campaigns/${campaignId}/insertion-orders`).then(r => r.json()),
      ]);
      if (cRes.success)  setCampaign(cRes.data);
      if (ioRes.success) setOrders(ioRes.data);
    } finally { setFetching(false); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (form) => {
    if (!form.name.trim()) { showToast('IO name is required', 'error'); return; }
    setSaving(true);
    try {
      const url    = editIO ? `${API}/campaigns/${campaignId}/insertion-orders/${editIO._id}` : `${API}/campaigns/${campaignId}/insertion-orders`;
      const method = editIO ? 'PUT' : 'POST';
      const res    = await authFetch(url, { method, body: JSON.stringify(form) });
      const data   = await res.json();
      if (data.success) {
        showToast(editIO ? 'IO updated!' : 'IO created!');
        setShowModal(false); setEditIO(null);
        loadAll();
      } else showToast(data.message, 'error');
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this insertion order?')) return;
    const res  = await authFetch(`${API}/campaigns/${campaignId}/insertion-orders/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { setOrders(o => o.filter(x => x._id !== id)); showToast('Deleted'); }
  };

  const handleToggle = async (id) => {
    const res  = await authFetch(`${API}/campaigns/${campaignId}/insertion-orders/${id}/toggle`, { method: 'PATCH' });
    const data = await res.json();
    if (data.success) setOrders(o => o.map(x => x._id === id ? data.data : x));
  };

  const filtered = useMemo(() =>
    orders.filter(o => o.name.toLowerCase().includes(search.toLowerCase())),
  [orders, search]);

  const isAdmin = user?.role === 'admin';
  const brand   = campaign?.motherBrand;

  // Aggregate stats
  const totalBudget    = filtered.reduce((s, o) => s + Number(o.budget || 0), 0);
  const totalSpent     = filtered.reduce((s, o) => s + Number(o.amountSpent || 0), 0);
  const totalImpr      = filtered.reduce((s, o) => s + Number(o.impressions || 0), 0);
  const activeCount    = filtered.filter(o => o.active).length;
  const pacingCount    = filtered.filter(o => o.pacing === 'pacing' && o.active).length;
  const underCount     = filtered.filter(o => o.pacing === 'underpacing' && o.active).length;
  const pacingPct      = activeCount > 0 ? Math.round((pacingCount / activeCount) * 100) : 100;
  const underPct       = activeCount > 0 ? Math.round((underCount / activeCount) * 100) : 0;

  // Sparkline datasets (30-day window)
  const sparkCost   = useMemo(() => buildSparkData(filtered, 'amountSpent', 30), [filtered]);
  const sparkBudget = useMemo(() => buildSparkData(filtered, 'budget',      30), [filtered]);
  const sparkImpr   = useMemo(() => buildSparkData(filtered, 'impressions', 30), [filtered]);
  const sparkActive = useMemo(() => buildSparkData(
    filtered.filter(o => o.active), 'impressions', 30
  ), [filtered]);

  // Date range label
  const dateRangeLabel = useMemo(() => {
    const end   = new Date();
    const start = new Date(); start.setDate(start.getDate() - 29);
    const fmt   = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    return `${fmt(start)} – ${fmt(end)}`;
  }, []);

  const fmtNum = (n) => Number(n || 0).toLocaleString();
  const fmtCur = (n, cur = 'USD') => `${cur === 'USD' ? '$' : cur}${Number(n||0).toFixed(2)}`;

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  const accentColor = (typeof brand === 'object' ? brand?.color : null) || '#1a73e8';

  return (
    <div className="min-h-screen bg-gray-50/50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-semibold
          ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'} text-white`}>
          {toast.msg}
        </div>
      )}

      {showModal && (
        <IOModal io={editIO} campaign={campaign} onSave={handleSave} onClose={() => { setShowModal(false); setEditIO(null); }} saving={saving} />
      )}

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-full mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-gray-400 mb-2">
            <Link href="/dashboard/brands" className="hover:text-gray-700 transition">Brands</Link>
            <ChevronRight size={12} />
            {brand && (
              <>
                <Link href={`/dashboard/brands/${typeof brand === 'object' ? brand._id : brand}`}
                  className="hover:text-gray-700 transition">
                  {typeof brand === 'object' ? brand.name : 'Brand'}
                </Link>
                <ChevronRight size={12} />
              </>
            )}
            <span className="font-semibold text-gray-600">{campaign?.name}</span>
            <ChevronRight size={12} />
            <span className="font-semibold text-blue-600">Insertion Orders</span>
          </div>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <Link href={`/dashboard/campaign/${campaignId}/content`}
                className="p-2 hover:bg-gray-100 rounded-xl transition">
                <ArrowLeft size={17} className="text-gray-500" />
              </Link>
              <div>
                <h1 className="text-xl font-black text-gray-900">{campaign?.name}</h1>
                <p className="text-xs text-gray-400">Insertion Orders · {filtered.length} total</p>
              </div>
            </div>

            {/* Action bar — matches DV360 toolbar */}
            <div className="flex items-center gap-2">
              {/* Tab pills */}
              <div className="flex items-center bg-gray-100 rounded-xl p-1 text-xs font-semibold gap-1">
                <Link href={`/dashboard/campaign/${campaignId}/content`}
                  className="px-3 py-1.5 text-gray-500 hover:text-gray-700 rounded-lg transition">
                  Content
                </Link>
                <Link href={`/dashboard/campaign/${campaignId}/metrics`}
                  className="px-3 py-1.5 text-gray-500 hover:text-gray-700 rounded-lg transition">
                  Metrics
                </Link>
                <span className="px-3 py-1.5 bg-white text-blue-600 rounded-lg shadow-sm">
                  Insertion Orders
                </span>
              </div>

              {isAdmin && (
                <button onClick={() => { setEditIO(null); setShowModal(true); }}
                  className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition shadow-sm">
                  <Plus size={15} /> New Insertion Order
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-6 py-5 space-y-5">

        {/* ── DV360-style sparkline stat cards ────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Card 1 — Total cost */}
          <SparkCard
            title="Total cost"
            dateRange={dateRangeLabel}
            value={`$${totalSpent.toFixed(2)}`}
            sub={`${fmtPct(totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0)}% of $${totalBudget.toFixed(2)} allocated`}
            sparkData={sparkCost}
            sparkColor="#1a73e8"
            todayValue={totalSpent}
            todayCurrency
          />

          {/* Card 2 — Avg. CPM */}
          <SparkCard
            title="Avg. CPM"
            dateRange={dateRangeLabel}
            value={`$${totalImpr > 0 ? ((totalSpent / totalImpr) * 1000).toFixed(2) : '0.00'}`}
            sub={`vs $${totalBudget > 0 ? ((totalBudget / Math.max(totalImpr, 1)) * 1000).toFixed(2) : '0.01'} goal`}
            goalLabel={`$${totalBudget > 0 ? ((totalBudget / Math.max(totalImpr, 1)) * 1000).toFixed(2) : '0.01'} goal`}
            goalValue={totalBudget > 0 ? (totalBudget / Math.max(totalImpr, 1)) * 1000 : 0.01}
            sparkData={sparkBudget}
            sparkColor="#34a853"
            subColor="#1a73e8"
            todayValue={totalImpr > 0 ? ((totalSpent / totalImpr) * 1000) : 0}
            todayCurrency
          />

          {/* Card 3 — Impressions */}
          <SparkCard
            title="Impressions"
            dateRange={dateRangeLabel}
            value={fmtNum(totalImpr)}
            sub={`Across ${filtered.length} insertion order${filtered.length !== 1 ? 's' : ''}`}
            sparkData={sparkImpr}
            sparkColor="#1a73e8"
            todayValue={`${fmtNum(totalImpr)}`}
          />

          {/* Card 4 — Active IOs / Pacing */}
          <SparkCard
            title="Active insertion orders"
            dateRange={dateRangeLabel}
            value={String(activeCount)}
            sub={`Pacing ${pacingPct}%  ·  Underpacing ${underPct}%`}
            sparkData={sparkActive}
            sparkColor="#34a853"
            todayValue={`${activeCount} active`}
          />

        </div>

        {/* ── Toolbar row — matches DV360 ─────────────────────────────────── */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            {isAdmin && (
              <button onClick={() => { setEditIO(null); setShowModal(true); }}
                className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
                <Plus size={14} /> New Insertion Order
              </button>
            )}
            <button className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Performance <ChevronRight size={13} className="text-gray-400" />
            </button>
            <button className="flex items-center gap-1.5 border border-gray-200 bg-white text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-50 transition">
              Segment by <ChevronRight size={13} className="text-gray-400" />
            </button>
          </div>
          <div className="flex items-center gap-2 text-gray-400">
            <Download size={16} className="hover:text-gray-600 cursor-pointer" />
            <Maximize2 size={16} className="hover:text-gray-600 cursor-pointer" />
            <Settings2 size={16} className="hover:text-gray-600 cursor-pointer" />
          </div>
        </div>

        {/* ── Search filter bar — matches DV360 ───────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 flex items-center gap-3">
          <Filter size={14} className="text-gray-400 flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Enter a search term or select filters"
            className="flex-1 text-sm text-gray-700 focus:outline-none bg-transparent" />
          {search && (
            <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* ── Table — DV360 style ──────────────────────────────────────────── */}
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-100">
                {/* Grouped headers */}
                <tr className="bg-gray-50/60">
                  <th colSpan={5} className="px-4 py-2 text-left" />
                  <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-500 border-l border-gray-100 tracking-wide">
                    Settings
                  </th>
                  <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-500 border-l border-gray-100 tracking-wide">
                    Goal
                  </th>
                  <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-500 border-l border-gray-100 tracking-wide">
                    Delivery
                  </th>
                  <th colSpan={3} className="px-4 py-2 text-center text-xs font-bold text-gray-500 border-l border-gray-100 tracking-wide">
                    Interactions
                  </th>
                  <th colSpan={2} className="px-4 py-2 text-center text-xs font-bold text-gray-500 border-l border-gray-100 tracking-wide">
                    Custom Bidding
                  </th>
                  {isAdmin && <th className="px-4 py-2" />}
                </tr>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-3 py-2.5 w-8">
                    <input type="checkbox" className="rounded" />
                  </th>
                  <th className="px-2 py-2.5 w-8" />
                  <th className="px-2 py-2.5 w-8" />
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Insertion orders
                    <span className="ml-1 text-gray-300">↑</span>
                  </th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Id</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-l border-gray-100">Type</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Budget</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-l border-gray-100">Goal</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Goal Type</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-l border-gray-100">Impr.</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Revenue</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-l border-gray-100">Interactions</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">Convs.</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">CPA</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide border-l border-gray-100">Custom impr. value</th>
                  <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase tracking-wide">/ cost</th>
                  {isAdmin && <th className="px-4 py-2.5 w-10" />}
                </tr>
              </thead>

              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="17" className="py-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <BarChart3 size={40} className="text-gray-200" />
                        <p className="text-gray-400 font-semibold">
                          {orders.length === 0 ? 'No insertion orders yet' : 'No results for your search'}
                        </p>
                        {isAdmin && orders.length === 0 && (
                          <button onClick={() => setShowModal(true)}
                            className="flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition">
                            <Plus size={14} /> Create first IO
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  <>
                    {filtered.map(io => (
                      <tr key={io._id} className="group border-b border-gray-50 last:border-0 hover:bg-blue-50/20 transition-colors">
                        <td className="px-3 py-3"><input type="checkbox" className="rounded" /></td>
                        {/* Alert icon */}
                        <td className="px-2 py-3 text-gray-300">△</td>
                        {/* Status dot */}
                        <td className="px-2 py-3">
                          <span className={`w-2 h-2 rounded-full inline-block ${io.active ? 'bg-blue-500' : 'bg-gray-300'}`} />
                        </td>
                        {/* Name */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/dashboard/campaign/${campaignId}/insertion-orders/${io._id}`}
                              className="text-blue-600 hover:underline font-semibold cursor-pointer text-sm">
                              {io.name}
                            </Link>
                          </div>
                          <PacingBadge pacing={io.pacing} active={io.active} status={io.status} />
                        </td>
                        {/* ID */}
                        <td className="px-4 py-3 text-sm text-gray-500 font-mono">{io.ioId}</td>
                        {/* Type */}
                        <td className="px-4 py-3 text-sm text-gray-600 border-l border-gray-50">
                          {io.type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
                        </td>
                        {/* Budget */}
                        <td className="px-4 py-3 text-sm font-medium text-gray-800">
                          {io.currency === 'USD' ? '$' : io.currency}{Number(io.budget||0).toFixed(2)}
                        </td>
                        {/* Goal */}
                        <td className="px-4 py-3 text-sm text-gray-600 border-l border-gray-50">
                          {io.goalValue ? `${io.currency === 'USD' ? '$' : io.currency}${Number(io.goalValue).toFixed(2)} ${io.goalType?.toUpperCase()}` : '—'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">{io.goalType?.toUpperCase()}</td>
                        {/* Delivery */}
                        <td className="px-4 py-3 text-sm text-gray-700 border-l border-gray-50">{fmtNum(io.impressions)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {io.currency === 'USD' ? '$' : io.currency}{Number(io.revenue||0).toFixed(2)}
                        </td>
                        {/* Interactions */}
                        <td className="px-4 py-3 text-sm text-gray-700 border-l border-gray-50">{fmtNum(io.interactions)}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">{io.conversions || '·'}</td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {io.cpa ? `$${Number(io.cpa).toFixed(2)}` : '·'}
                        </td>
                        {/* Custom bidding */}
                        <td className="px-4 py-3 text-sm text-gray-500 border-l border-gray-50">
                          {io.customImprValue || '·'}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {io.customImprValue && io.amountSpent
                            ? `$${(Number(io.customImprValue) / Math.max(Number(io.amountSpent),1)).toFixed(2)}`
                            : '·'}
                        </td>
                        {/* Actions */}
                        {isAdmin && (
                          <td className="px-4 py-3 opacity-0 group-hover:opacity-100 transition">
                            <RowMenu io={io}
                              onEdit={() => { setEditIO(io); setShowModal(true); }}
                              onDelete={() => handleDelete(io._id)}
                              onToggle={() => handleToggle(io._id)} />
                          </td>
                        )}
                      </tr>
                    ))}

                    {/* Totals row */}
                    <tr className="bg-gray-50/70 border-t-2 border-gray-200 font-semibold text-sm">
                      <td colSpan={4} className="px-4 py-3 text-gray-600 text-xs font-bold">Total: All</td>
                      <td className="px-4 py-3" />
                      <td className="px-4 py-3 border-l border-gray-100" />
                      <td className="px-4 py-3 text-gray-800">${totalBudget.toFixed(2)}</td>
                      <td className="px-4 py-3 border-l border-gray-100 text-gray-500">·</td>
                      <td className="px-4 py-3 text-gray-500">·</td>
                      <td className="px-4 py-3 border-l border-gray-100 text-gray-800">{fmtNum(totalImpr)}</td>
                      <td className="px-4 py-3 text-gray-500">·</td>
                      <td className="px-4 py-3 border-l border-gray-100 text-gray-500">·</td>
                      <td className="px-4 py-3 text-gray-500">·</td>
                      <td className="px-4 py-3 text-gray-500">·</td>
                      <td className="px-4 py-3 border-l border-gray-100 text-gray-500">·</td>
                      <td className="px-4 py-3 text-gray-500">·</td>
                      {isAdmin && <td />}
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
            <span>Displaying data for {filtered.length} {filtered.length === 1 ? 'entity' : 'entities'}</span>
            {filtered.length !== orders.length && <span>{orders.length - filtered.length} hidden by filter</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

function fmtPct(n) { return Math.min(100, Math.round(n || 0)); }