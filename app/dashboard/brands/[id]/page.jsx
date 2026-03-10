"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import Link from "next/link";
import {
  ArrowLeft, Plus, Zap, PauseCircle, BarChart3,
  Target, Calendar, RefreshCw, Loader2, Activity,
} from "lucide-react";
import CampaignList from "@/components/DashboardManagement/CampaignManagement/CampaignList";
import CreateCampaign from "@/components/DashboardManagement/CampaignManagement/CreateCampaign";

const API = process.env.NEXT_PUBLIC_API_URL;

const PRESETS = [
  { label: 'All' },
  { label: 'Today',        days: 0  },
  { label: 'Last 7 days',  days: 7  },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

function offsetDate(days) {
  const d = new Date(); d.setDate(d.getDate() - days); return d.toISOString().split('T')[0];
}
function toMidnight(str) {
  if (!str) return null; const d = new Date(str); d.setHours(0,0,0,0); return d;
}
function AnimatedNumber({ value }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    if (!value) return;
    let c = 0; const step = Math.max(1, Math.ceil(value / 25));
    const t = setInterval(() => { c += step; if (c >= value) { setD(value); clearInterval(t); } else setD(c); }, 28);
    return () => clearInterval(t);
  }, [value]);
  return <span>{d.toLocaleString()}</span>;
}

export default function BrandDetailPage() {
  const { id: brandId } = useParams();
  const router  = useRouter();
  const { user, loading } = useAuth();
  const authFetch = useAuthFetch();
  const redirected = useRef(false);

  const [brand, setBrand]           = useState(null);
  const [campaigns, setCampaigns]   = useState([]);
  const [customFields, setCF]       = useState([]);
  const [fetching, setFetching]     = useState(true);
  const [startDate, setStartDate]   = useState('');
  const [endDate, setEndDate]       = useState('');
  const [activePreset, setActivePreset] = useState('All');
  const [toast, setToast]           = useState(null);

  // CreateCampaign (edit) mode inside this page
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [showCreate, setShowCreate]           = useState(false);
  const [savingCampaign, setSavingCampaign]   = useState(false);
  const [formData, setFormData] = useState({
    motherBrand: brandId,
    name: '', objective: 'awareness', status: 'draft',
    delivery: 'In draft', actions: '', results: '',
    costPerResult: '', bidStrategy: 'lowest_cost',
    budgetType: 'daily', dailyBudget: '', lifetimeBudget: '',
    budget: '', amountSpent: '', impressions: '', reach: '',
    startDate: '', endDate: '', targetAudience: '',
    placement: 'automatic', active: false, customFieldsData: {}
  });

  // Column visibility — same as CampaignContainer
  const [visibleColumns, setVisibleColumns] = useState({
    checkbox: true, toggle: true, campaign: true, delivery: true, actions: true,
    results: true, costPerResult: true, budget: true, amountSpent: true,
    impressions: true, reach: true, ends: true, actionButtons: true
  });
  const [showColumnManager, setShowColumnManager] = useState(false);

  useEffect(() => {
    if (loading || redirected.current) return;
    if (!user) { redirected.current = true; router.replace('/login'); }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user, brandId]);

  const loadData = async () => {
    setFetching(true);
    try {
      const [brandRes, campRes, cfRes] = await Promise.all([
        authFetch(`${API}/mother-brands/${brandId}`).then(r => r.json()),
        authFetch(`${API}/mother-brands/${brandId}/campaigns`).then(r => r.json()),
        authFetch(`${API}/custom-fields`).then(r => r.json()),
      ]);
      if (brandRes.success) setBrand(brandRes.data);
      if (campRes.success)  setCampaigns(campRes.data);
      if (cfRes.success)    setCF(cfRes.data || []);
    } finally { setFetching(false); }
  };

  // Sync custom field columns
  useEffect(() => {
    if (customFields.length > 0) {
      const extra = {};
      customFields.forEach(f => {
        if (!visibleColumns.hasOwnProperty(`custom_${f.name}`)) extra[`custom_${f.name}`] = true;
      });
      if (Object.keys(extra).length > 0) setVisibleColumns(prev => ({ ...prev, ...extra }));
    }
  }, [customFields]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  // Date filter
  const filteredCampaigns = useMemo(() => {
    if (!startDate && !endDate) return campaigns;
    const fs = toMidnight(startDate);
    const fe = toMidnight(endDate);
    if (fe) fe.setHours(23, 59, 59, 999);
    return campaigns.filter(c => {
      const cs = c.startDate ? toMidnight(c.startDate) : null;
      const ce = c.endDate && c.endDate !== 'Ongoing' ? toMidnight(c.endDate) : null;
      if (!cs && !ce) return true;
      if (fs && ce && ce < fs) return false;
      if (fe && cs && cs > fe) return false;
      return true;
    });
  }, [campaigns, startDate, endDate]);

  const handlePreset = (p) => {
    setActivePreset(p.label);
    if (p.label === 'All') { setStartDate(''); setEndDate(''); }
    else {
      const end = new Date().toISOString().split('T')[0];
      setStartDate(p.days === 0 ? end : offsetDate(p.days));
      setEndDate(end);
    }
  };

  // ── Campaign CRUD ──────────────────────────────────────────────────────────
  const toggleCampaign = async (id) => {
    const res  = await authFetch(`${API}/campaigns/${id}/toggle`, { method: 'PATCH' });
    const data = await res.json();
    if (data.success) setCampaigns(cs => cs.map(c => c._id === id ? data.data : c));
  };

  const deleteCampaign = async (id) => {
    if (!confirm('Delete this campaign?')) return;
    const res  = await authFetch(`${API}/campaigns/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { setCampaigns(cs => cs.filter(c => c._id !== id)); showToast('Campaign deleted'); }
  };

  const duplicateCampaign = async (id) => {
    const res  = await authFetch(`${API}/campaigns/${id}/duplicate`, { method: 'POST' });
    const data = await res.json();
    if (data.success) { setCampaigns(cs => [...cs, data.data]); showToast('Campaign duplicated!'); }
  };

  const openEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      motherBrand:   campaign.motherBrand?._id || campaign.motherBrand || brandId,
      name:          campaign.name,
      objective:     campaign.objective,
      status:        campaign.status,
      delivery:      campaign.delivery,
      actions:       campaign.actions,
      results:       campaign.results,
      costPerResult: campaign.costPerResult,
      bidStrategy:   campaign.bidStrategy,
      budgetType:    campaign.dailyBudget ? 'daily' : 'lifetime',
      dailyBudget:   campaign.dailyBudget,
      lifetimeBudget:campaign.lifetimeBudget,
      budget:        campaign.budget,
      amountSpent:   campaign.amountSpent,
      impressions:   campaign.impressions,
      reach:         campaign.reach,
      startDate:     campaign.startDate,
      endDate:       campaign.endDate,
      targetAudience:campaign.targetAudience,
      placement:     campaign.placement,
      active:        campaign.active,
      customFieldsData: campaign.customFields || {}
    });
    setShowCreate(true);
  };

  const openCreate = () => {
    setEditingCampaign(null);
    setFormData({
      motherBrand: brandId,
      name: '', objective: 'awareness', status: 'draft',
      delivery: 'In draft', actions: '', results: '',
      costPerResult: '', bidStrategy: 'lowest_cost',
      budgetType: 'daily', dailyBudget: '', lifetimeBudget: '',
      budget: '', amountSpent: '', impressions: '', reach: '',
      startDate: '', endDate: '', targetAudience: '',
      placement: 'automatic', active: false, customFieldsData: {}
    });
    setShowCreate(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { alert('Campaign name is required'); return; }
    setSavingCampaign(true);
    try {
      const budget = formData.budgetType === 'daily'
        ? `$${formData.dailyBudget}/day` : `$${formData.lifetimeBudget} lifetime`;
      const payload = {
        motherBrand:   brandId,
        name:          formData.name,
        objective:     formData.objective,
        status:        formData.status,
        delivery:      formData.delivery || (formData.status === 'active' ? 'Active' : 'In draft'),
        actions:       formData.actions,
        results:       formData.results    || '—',
        costPerResult: formData.costPerResult || '—',
        bidStrategy:   formData.bidStrategy,
        dailyBudget:   formData.dailyBudget,
        lifetimeBudget:formData.lifetimeBudget,
        budget:        formData.budget     || budget,
        amountSpent:   formData.amountSpent|| '$0.00',
        impressions:   formData.impressions|| '—',
        reach:         formData.reach      || '—',
        startDate:     formData.startDate,
        endDate:       formData.endDate    || 'Ongoing',
        targetAudience:formData.targetAudience,
        placement:     formData.placement,
        active:        formData.active,
        customFields:  formData.customFieldsData,
      };

      const url    = editingCampaign ? `${API}/campaigns/${editingCampaign._id}` : `${API}/campaigns`;
      const method = editingCampaign ? 'PUT' : 'POST';
      const res    = await authFetch(url, { method, body: JSON.stringify(payload) });
      const data   = await res.json();

      if (data.success) {
        showToast(editingCampaign ? 'Campaign updated!' : 'Campaign created!');
        setShowCreate(false);
        setEditingCampaign(null);
        loadData(); // refresh
      } else alert(data.message);
    } catch { alert('Failed to save campaign'); }
    finally { setSavingCampaign(false); }
  };

  const toggleColumn    = (key) => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  const showAllColumns  = () => { const a = {}; Object.keys(visibleColumns).forEach(k => a[k] = true); setVisibleColumns(a); };
  const hideAllColumns  = () => { const h = {}; Object.keys(visibleColumns).forEach(k => h[k] = k === 'campaign' || k === 'actionButtons'); setVisibleColumns(h); };

  const active        = filteredCampaigns.filter(c => c.active).length;
  const inactive      = filteredCampaigns.length - active;
  const activePercent = filteredCampaigns.length ? Math.round((active / filteredCampaigns.length) * 100) : 0;
  const isAdmin       = user?.role === 'admin';

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-indigo-600" size={36} />
    </div>
  );

  if (!brand) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-gray-500 mb-3">Brand not found</p>
        <Link href="/dashboard/brands" className="text-indigo-600 text-sm hover:underline">← Back to brands</Link>
      </div>
    </div>
  );

  // ── Show CreateCampaign form inline when editing/creating ──────────────────
  if (showCreate) {
    return (
      <CreateCampaign
        formData={formData}
        setFormData={setFormData}
        customFields={customFields}
        editingCampaign={editingCampaign}
        onSubmit={handleSubmit}
        onCancel={() => { setShowCreate(false); setEditingCampaign(null); }}
        loading={savingCampaign}
        preselectedBrand={brand}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium
          ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Brand Hero Header ─────────────────────────────────────────────── */}
      {/* <div className="relative overflow-hidden bg-white border-b border-gray-100 px-6 py-8 mb-2">
        <div className="absolute inset-0 opacity-5"
          style={{ background: `radial-gradient(circle at 70% 50%, ${brand.color}, transparent 70%)` }} />
        <div className="max-w-full mx-auto">

           
          <div className="flex items-center gap-2 mb-5 text-sm">
            <Link href="/dashboard/brands"
              className="flex items-center gap-1.5 text-gray-400 hover:text-gray-700 transition">
              <ArrowLeft size={15} /> All Brands
            </Link>
            <span className="text-gray-300">/</span>
            <span className="font-semibold text-gray-700">{brand.name}</span>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
           
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl shadow-lg flex items-center justify-center text-white text-2xl font-black overflow-hidden flex-shrink-0"
                style={{ background: brand.logo ? 'transparent' : `linear-gradient(135deg, ${brand.color}, ${brand.color}99)` }}>
                {brand.logo ? <img src={brand.logo} className="w-full h-full object-cover" /> : brand.name.charAt(0)}
              </div>
              <div>
                <h1 className="text-3xl font-black text-gray-900">{brand.name}</h1>
                {brand.description && <p className="text-gray-400 mt-0.5 text-sm">{brand.description}</p>}
              </div>
            </div>

            
            {isAdmin && (
              <button onClick={openCreate}
                className="flex items-center gap-2 text-white px-5 py-2.5 rounded-xl font-semibold text-sm shadow-md transition hover:opacity-90"
                style={{ background: `linear-gradient(135deg, ${brand.color}, ${brand.color}cc)` }}>
                <Plus size={16} /> New Campaign
              </button>
            )}
          </div>

          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              { label: 'Total',    value: filteredCampaigns.length,                                           icon: <BarChart3 size={13} />, bg: 'bg-gray-50',    text: 'text-gray-700' },
              { label: 'Active',   value: active,                                                             icon: <Zap size={13} />,       bg: 'bg-emerald-50', text: 'text-emerald-600' },
              { label: 'Inactive', value: inactive,                                                           icon: <PauseCircle size={13} />,bg: 'bg-rose-50',   text: 'text-rose-500' },
              { label: 'Draft',    value: filteredCampaigns.filter(c => c.status === 'draft').length,         icon: <Target size={13} />,    bg: 'bg-amber-50',   text: 'text-amber-600' },
            ].map(s => (
              <div key={s.label} className={`${s.bg} rounded-xl px-4 py-3 flex items-center gap-3`}>
                <div className={`${s.text} opacity-60`}>{s.icon}</div>
                <div>
                  <p className={`text-xl font-black ${s.text}`}><AnimatedNumber value={s.value} /></p>
                  <p className="text-xs text-gray-400">{s.label}</p>
                </div>
              </div>
            ))}
          </div>

       
          {filteredCampaigns.length > 0 && (
            <div className="mt-4">
              <div className="flex h-1.5 rounded-full overflow-hidden bg-gray-100 gap-0.5">
                {activePercent > 0 && (
                  <div className="rounded-full bg-gradient-to-r from-emerald-400 to-teal-500 transition-all duration-700"
                    style={{ width: `${activePercent}%` }} />
                )}
                {100 - activePercent > 0 && (
                  <div className="rounded-full bg-gradient-to-r from-rose-300 to-pink-400 flex-1" />
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {activePercent}% active · {inactive} paused/draft
              </p>
            </div>
          )}
        </div>
      </div> */}

      {/* ── Date Range Filter ─────────────────────────────────────────────── */}
      <div className="px-6 mb-2">
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-5 py-2.5 border-b border-gray-50 flex items-center gap-2"
            style={{ background: `linear-gradient(90deg, ${brand.color}15, transparent)` }}>
            <Calendar size={13} style={{ color: brand.color }} />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-500">Date Range</span>
            {activePreset !== 'All' && (
              <span className="ml-auto text-xs px-2 py-0.5 rounded-full text-white font-medium"
                style={{ background: brand.color }}>
                {filteredCampaigns.length} / {campaigns.length}
              </span>
            )}
          </div>
          <div className="px-5 py-3 flex flex-wrap items-end gap-3">
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map(p => (
                <button key={p.label} onClick={() => handlePreset(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all
                    ${activePreset === p.label ? 'text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'}`}
                  style={activePreset === p.label ? { background: brand.color } : {}}>
                  {p.label}
                </button>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <div>
                <label className="block text-xs text-gray-400 mb-1">From</label>
                <input type="date" value={startDate}
                  onChange={e => { setStartDate(e.target.value); setActivePreset('Custom'); }}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 bg-gray-50" />
              </div>
              <span className="pb-1.5 text-gray-300">→</span>
              <div>
                <label className="block text-xs text-gray-400 mb-1">To</label>
                <input type="date" value={endDate}
                  onChange={e => { setEndDate(e.target.value); setActivePreset('Custom'); }}
                  className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-1 bg-gray-50" />
              </div>
            </div>
            {activePreset !== 'All' && (
              <button onClick={() => { setStartDate(''); setEndDate(''); setActivePreset('All'); }}
                className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-500 rounded-lg text-xs hover:bg-red-50 hover:text-red-500 transition">
                <RefreshCw size={11} /> Reset
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Campaign List — exact same component as the main dashboard ─────── */}
      <div className="px-6 pb-10">
        <CampaignList
          campaigns={filteredCampaigns}
          customFields={customFields}
          loading={false}
          error={null}
          visibleColumns={visibleColumns}
          showColumnManager={showColumnManager}
          setShowColumnManager={setShowColumnManager}
          toggleColumn={toggleColumn}
          showAllColumns={showAllColumns}
          hideAllColumns={hideAllColumns}
          onCreateClick={openCreate}
          onManageFieldsClick={() => router.push('/dashboard/manage-fields')}
          onEdit={openEdit}
          onToggle={toggleCampaign}
          onDuplicate={duplicateCampaign}
          onDelete={deleteCampaign}
          userRole={user?.role}
        />
      </div>
    </div>
  );
}