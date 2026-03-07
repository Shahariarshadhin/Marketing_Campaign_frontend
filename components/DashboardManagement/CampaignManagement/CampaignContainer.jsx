"use client"
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useAuthFetch } from '@/hooks/useAuthFetch';
import CreateCampaign from './CreateCampaign';
import ManageFields from './ManageCustomFields';
import CampaignList from './CampaignList';
import {
  Calendar, RefreshCw, TrendingUp, Zap, PauseCircle,
  BarChart3, Target, ChevronRight, Sparkles, Activity
} from 'lucide-react';
import CampaignCharts from './Campaigncharts';

const API_URL           = `${process.env.NEXT_PUBLIC_API_URL}/campaigns`;
const CUSTOM_FIELDS_URL = `${process.env.NEXT_PUBLIC_API_URL}/custom-fields`;

const PRESETS = [
  { label: 'All' },
  { label: 'Today',        days: 0  },
  { label: 'Last 7 days',  days: 7  },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

function offsetDate(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().split('T')[0];
}

function toMidnight(str) {
  if (!str) return null;
  const d = new Date(str);
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = Math.ceil(value / 20);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(start);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <span>{display}</span>;
}

// ─── Stats + Status Bar ───────────────────────────────────────────────────────
function CampaignStats({ campaigns, filtered, hasFilter }) {
  const total    = campaigns.length;
  const active   = campaigns.filter(c => c.active).length;
  const inactive = total - active;
  const draft    = campaigns.filter(c => c.status === 'draft').length;
  const scheduled = campaigns.filter(c => c.status === 'scheduled').length;

  const activePercent   = total ? Math.round((active / total) * 100)   : 0;
  const inactivePercent = total ? Math.round((inactive / total) * 100) : 0;
  const draftPercent    = total ? Math.round((draft / total) * 100)    : 0;

  const filteredActive   = filtered.filter(c => c.active).length;
  const filteredInactive = filtered.length - filteredActive;

  return (
    <div className="mb-5 space-y-3">
      {/* Stat cards row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-4 text-black shadow-lg">
          <div className="absolute -right-3 -top-3 w-16 h-16 bg-white/5 rounded-full" />
          <div className="absolute -right-1 -bottom-4 w-10 h-10 bg-white/5 rounded-full" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-widest mb-1">Total</p>
              <p className="text-3xl font-black tabular-nums"><AnimatedNumber value={hasFilter ? filtered.length : total} /></p>
              {hasFilter && <p className="text-slate-500 text-xs mt-1">of {total} total</p>}
            </div>
            <div className="w-9 h-9 bg-white/10 rounded-xl flex items-center justify-center">
              <BarChart3 size={18} className="text-slate-300" />
            </div>
          </div>
        </div>

        {/* Active */}
          <div className="relative overflow-hidden bg-white rounded-2xl p-4 text-black shadow-lg">
          <div className="absolute -right-3 -top-3 w-16 h-16 bg-white/10 rounded-full" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-black text-xs font-medium uppercase tracking-widest mb-1">Active</p>
              <p className="text-3xl font-black tabular-nums">
                <AnimatedNumber value={hasFilter ? filteredActive : active} />
              </p>
              <p className="text-black text-xs mt-1">{activePercent}% of campaigns</p>
            </div>
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Zap size={18} className="text-white" />
            </div>
          </div>
          {/* Pulse dot */}
          <span className="absolute top-3 right-3 flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
        </div>

        {/* Inactive */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-4 text-black shadow-lg">
          <div className="absolute -right-3 -top-3 w-16 h-16 bg-white/10 rounded-full" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-black text-xs font-medium uppercase tracking-widest mb-1">Inactive</p>
              <p className="text-3xl font-black tabular-nums">
                <AnimatedNumber value={hasFilter ? filteredInactive : inactive} />
              </p>
              <p className="text-black text-xs mt-1">{inactivePercent}% of campaigns</p>
            </div>
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <PauseCircle size={18} className="text-white" />
            </div>
          </div>
        </div>

        {/* Draft / Scheduled */}
        <div className="relative overflow-hidden bg-white rounded-2xl p-4 text-black shadow-lg">
          <div className="absolute -right-3 -top-3 w-16 h-16 bg-white/10 rounded-full" />
          <div className="flex items-start justify-between">
            <div>
              <p className="text-black text-xs font-medium uppercase tracking-widest mb-1">Draft</p>
              <p className="text-3xl font-black tabular-nums"><AnimatedNumber value={draft} /></p>
              <p className="text-black text-xs mt-1">{scheduled} scheduled</p>
            </div>
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Target size={18} className="text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      {/* {total > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-gray-500" />
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Campaign Status Distribution</span>
            </div>
            <span className="text-xs text-black">{total} total</span>
          </div>

          
          <div className="flex h-3 rounded-full overflow-hidden gap-0.5 mb-3">
            {activePercent > 0 && (
              <div
                className="bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${activePercent}%` }}
                title={`Active: ${active}`}
              />
            )}
            {draftPercent > 0 && (
              <div
                className="bg-gradient-to-r from-amber-400 to-orange-400 rounded-full transition-all duration-700 ease-out"
                style={{ width: `${draftPercent}%` }}
                title={`Draft: ${draft}`}
              />
            )}
            {inactivePercent - draftPercent > 0 && (
              <div
                className="bg-gradient-to-r from-rose-400 to-pink-400 rounded-full transition-all duration-700 ease-out flex-1"
                title={`Inactive: ${inactive}`}
              />
            )}
          </div>

     
          <div className="flex items-center gap-5 flex-wrap">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-500" />
              <span className="text-xs text-gray-500">Active <strong className="text-gray-700">{active}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400" />
              <span className="text-xs text-gray-500">Draft <strong className="text-gray-700">{draft}</strong></span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-rose-400 to-pink-400" />
              <span className="text-xs text-gray-500">Inactive <strong className="text-gray-700">{inactive}</strong></span>
            </div>
            {scheduled > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                <span className="text-xs text-gray-500">Scheduled <strong className="text-gray-700">{scheduled}</strong></span>
              </div>
            )}
          </div>
        </div>
      )} */}
    </div>
  );
}

// ─── Date Range Filter ────────────────────────────────────────────────────────
function DateRangeFilter({ startDate, endDate, activePreset, onStartChange, onEndChange, onPreset, onClear, resultCount, total }) {
  const hasFilter = activePreset !== 'All';

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm mb-4 overflow-hidden">
      {/* Header stripe */}
      {/* <div className="bg-white px-5 py-2.5 flex items-center gap-2">
        <Calendar size={14} className="text-blue-200" />
        <span className="text-xs font-semibold  text-black uppercase tracking-widest">Date Range Filter</span>
        {hasFilter && (
          <span className="ml-auto bg-white/20  text-black text-xs px-2.5 py-0.5 rounded-full font-medium">
            {resultCount} of {total} shown
          </span>
        )}
      </div> */}

      <div className="px-5 py-4 flex flex-wrap items-end gap-4">
        {/* Preset chips */}
        <div className="flex flex-wrap gap-2">
          {PRESETS.map(p => (
            <button
              key={p.label}
              onClick={() => onPreset(p)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all duration-200
                ${activePreset === p.label
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 scale-105'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-gray-300'
                }`}
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Separator */}
        <div className="hidden sm:flex items-center gap-2 text-gray-300">
          <div className="w-px h-8 bg-gray-200" />
        </div>

        {/* Custom date inputs */}
        <div className="flex items-end gap-3">
          <div>
            <label className="block text-xs text-black mb-1.5 font-semibold uppercase tracking-wide">From</label>
            <input
              type="date"
              value={startDate}
              onChange={e => onStartChange(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition"
            />
          </div>
          <div className="pb-2 text-gray-300 font-light text-lg">→</div>
          <div>
            <label className="block text-xs text-black mb-1.5 font-semibold uppercase tracking-wide">To</label>
            <input
              type="date"
              value={endDate}
              onChange={e => onEndChange(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm text-black focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 hover:bg-white transition"
            />
          </div>
        </div>

        {/* Clear */}
        {hasFilter && (
          <button
            onClick={onClear}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 text-gray-500 rounded-xl text-xs font-semibold hover:bg-red-50 hover:text-red-500 transition-all duration-200 border border-gray-200 hover:border-red-200"
          >
            <RefreshCw size={12} /> Reset
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function CampaignManager() {
  const { user }   = useAuth();
  const authFetch  = useAuthFetch();

  const [currentView, setCurrentView]           = useState('list');
  const [campaigns, setCampaigns]               = useState([]);
  const [loading, setLoading]                   = useState(false);
  const [error, setError]                       = useState(null);
  const [editingCampaign, setEditingCampaign]   = useState(null);
  const [customFields, setCustomFields]         = useState([]);
  const [showColumnManager, setShowColumnManager] = useState(false);

  const [startDate, setStartDate]       = useState('');
  const [endDate, setEndDate]           = useState('');
  const [activePreset, setActivePreset] = useState('All');

  const [visibleColumns, setVisibleColumns] = useState({
    checkbox: true, toggle: true, campaign: true, delivery: true, actions: true,
    results: true, costPerResult: true, budget: true, amountSpent: true,
    impressions: true, reach: true, ends: true, actionButtons: true
  });

  const [formData, setFormData] = useState({
    name: '', objective: 'awareness', status: 'draft', delivery: 'In draft',
    actions: '', results: '', costPerResult: '', bidStrategy: 'lowest_cost',
    budgetType: 'daily', dailyBudget: '', lifetimeBudget: '', budget: '',
    amountSpent: '', impressions: '', reach: '', startDate: '', endDate: '',
    targetAudience: '', placement: 'automatic', active: false, customFieldsData: {}
  });

  useEffect(() => { fetchCampaigns(); fetchCustomFields(); }, []);

  useEffect(() => {
    if (customFields.length > 0) {
      const extra = {};
      customFields.forEach(f => {
        if (!visibleColumns.hasOwnProperty(`custom_${f.name}`)) extra[`custom_${f.name}`] = true;
      });
      if (Object.keys(extra).length > 0) setVisibleColumns(prev => ({ ...prev, ...extra }));
    }
  }, [customFields]);

  const filteredCampaigns = useMemo(() => {
    if (!startDate && !endDate) return campaigns;
    const filterStart = toMidnight(startDate);
    const filterEnd   = toMidnight(endDate);
    if (filterEnd) filterEnd.setHours(23, 59, 59, 999);
    return campaigns.filter(c => {
      const campStart = c.startDate ? toMidnight(c.startDate) : null;
      const campEnd   = c.endDate && c.endDate !== 'Ongoing' ? toMidnight(c.endDate) : null;
      if (!campStart && !campEnd) return true;
      if (filterStart && campEnd && campEnd < filterStart) return false;
      if (filterEnd && campStart && campStart > filterEnd)   return false;
      return true;
    });
  }, [campaigns, startDate, endDate]);

  const handlePreset = (preset) => {
    setActivePreset(preset.label);
    if (preset.label === 'All') { setStartDate(''); setEndDate(''); }
    else {
      const end   = new Date().toISOString().split('T')[0];
      const start = preset.days === 0 ? end : offsetDate(preset.days);
      setStartDate(start); setEndDate(end);
    }
  };

  const handleClear      = () => { setStartDate(''); setEndDate(''); setActivePreset('All'); };
  const handleStartChange = (v) => { setStartDate(v); setActivePreset('Custom'); };
  const handleEndChange   = (v) => { setEndDate(v);   setActivePreset('Custom'); };

  const fetchCampaigns = async () => {
    try {
      setLoading(true); setError(null);
      const res  = await authFetch(API_URL);
      const data = await res.json();
      if (data.success) setCampaigns(data.data);
      else setError('Failed to fetch campaigns');
    } catch (err) { setError('Error: ' + err.message); }
    finally { setLoading(false); }
  };

  const fetchCustomFields = async () => {
    try {
      const res  = await authFetch(CUSTOM_FIELDS_URL);
      const data = await res.json();
      if (data.success) setCustomFields(data.data);
    } catch {}
  };

  const toggleCampaign = async (id) => {
    try {
      const res  = await authFetch(`${API_URL}/${id}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (data.success) setCampaigns(campaigns.map(c => c._id === id ? data.data : c));
    } catch (err) { alert('Failed to toggle: ' + err.message); }
  };

  const deleteCampaign = async (id) => {
    if (!confirm('Delete this campaign?')) return;
    try {
      const res  = await authFetch(`${API_URL}/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) setCampaigns(campaigns.filter(c => c._id !== id));
    } catch (err) { alert('Failed to delete: ' + err.message); }
  };

  const duplicateCampaign = async (id) => {
    try {
      const res  = await authFetch(`${API_URL}/${id}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (data.success) setCampaigns([...campaigns, data.data]);
    } catch (err) { alert('Failed to duplicate: ' + err.message); }
  };

  const editCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name, objective: campaign.objective, status: campaign.status,
      delivery: campaign.delivery, actions: campaign.actions, results: campaign.results,
      costPerResult: campaign.costPerResult, bidStrategy: campaign.bidStrategy,
      budgetType: campaign.dailyBudget ? 'daily' : 'lifetime',
      dailyBudget: campaign.dailyBudget, lifetimeBudget: campaign.lifetimeBudget,
      budget: campaign.budget, amountSpent: campaign.amountSpent,
      impressions: campaign.impressions, reach: campaign.reach,
      startDate: campaign.startDate, endDate: campaign.endDate,
      targetAudience: campaign.targetAudience, placement: campaign.placement,
      active: campaign.active, customFieldsData: campaign.customFields || {}
    });
    setCurrentView('create');
  };

  const handleSubmit = async () => {
    if (!formData.name) { alert('Please enter a campaign name'); return; }
    try {
      setLoading(true);
      const budget = formData.budgetType === 'daily'
        ? `$${formData.dailyBudget}/day`
        : `$${formData.lifetimeBudget} lifetime`;
      const campaignData = {
        name: formData.name, status: formData.status,
        delivery: formData.delivery || (formData.status === 'active' ? 'Active' : formData.status === 'draft' ? 'In draft' : 'Scheduled'),
        actions: formData.actions || '', results: formData.results || '—',
        costPerResult: formData.costPerResult || '—', budget: formData.budget || budget,
        amountSpent: formData.amountSpent || '$0.00', impressions: formData.impressions || '—',
        reach: formData.reach || '—', endDate: formData.endDate || 'Ongoing',
        active: formData.active, objective: formData.objective, bidStrategy: formData.bidStrategy,
        dailyBudget: formData.dailyBudget, lifetimeBudget: formData.lifetimeBudget,
        startDate: formData.startDate, targetAudience: formData.targetAudience,
        placement: formData.placement, customFields: formData.customFieldsData
      };
      const url    = editingCampaign ? `${API_URL}/${editingCampaign._id}` : API_URL;
      const method = editingCampaign ? 'PUT' : 'POST';
      const res    = await authFetch(url, { method, body: JSON.stringify(campaignData) });
      const data   = await res.json();
      if (data.success) {
        if (editingCampaign) setCampaigns(campaigns.map(c => c._id === editingCampaign._id ? data.data : c));
        else setCampaigns([...campaigns, data.data]);
        resetForm(); setCurrentView('list');
      } else alert('Failed: ' + data.message);
    } catch { alert('Failed to save campaign'); }
    finally { setLoading(false); }
  };

  const handleCancel = () => { setCurrentView('list'); resetForm(); };
  const resetForm = () => {
    setEditingCampaign(null);
    setFormData({
      name: '', objective: 'awareness', status: 'draft', delivery: 'In draft', actions: '',
      results: '', costPerResult: '', bidStrategy: 'lowest_cost', budgetType: 'daily',
      dailyBudget: '', lifetimeBudget: '', budget: '', amountSpent: '', impressions: '',
      reach: '', startDate: '', endDate: '', targetAudience: '', placement: 'automatic',
      active: false, customFieldsData: {}
    });
  };

  const addCustomField = async (fieldData) => {
    try {
      const res  = await authFetch(CUSTOM_FIELDS_URL, { method: 'POST', body: JSON.stringify(fieldData) });
      const data = await res.json();
      if (data.success) setCustomFields([...customFields, data.data]);
    } catch { alert('Failed to add custom field'); }
  };

  const deleteCustomField = async (id) => {
    if (!confirm('Are you sure?')) return;
    try {
      const res = await authFetch(`${CUSTOM_FIELDS_URL}/${id}`, { method: 'DELETE' });
      if (res.ok) setCustomFields(customFields.filter(f => f._id !== id));
    } catch { alert('Failed to delete custom field'); }
  };

  const toggleColumn   = (key) => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));
  const showAllColumns = () => { const a = {}; Object.keys(visibleColumns).forEach(k => a[k] = true); setVisibleColumns(a); };
  const hideAllColumns = () => { const h = {}; Object.keys(visibleColumns).forEach(k => h[k] = k === 'campaign' || k === 'actionButtons'); setVisibleColumns(h); };

  if (currentView === 'create') {
    return <CreateCampaign formData={formData} setFormData={setFormData} customFields={customFields}
      editingCampaign={editingCampaign} onSubmit={handleSubmit} onCancel={handleCancel} loading={loading} />;
  }
  if (currentView === 'manage-fields') {
    return <ManageFields customFields={customFields} onAddField={addCustomField}
      onDeleteField={deleteCustomField} onBack={() => setCurrentView('list')} />;
  }

  return (
    <div>
      {/* Stats + Status Bar */}
      <CampaignStats
        campaigns={campaigns}
        filtered={filteredCampaigns}
        hasFilter={activePreset !== 'All'}
      />

       {/* Google Ads-style Charts */}
       <CampaignCharts
        campaigns={filteredCampaigns}
        startDate={startDate}
        endDate={endDate}
      />

      {/* Date Range Filter */}
      <DateRangeFilter
        startDate={startDate}
        endDate={endDate}
        activePreset={activePreset}
        onStartChange={handleStartChange}
        onEndChange={handleEndChange}
        onPreset={handlePreset}
        onClear={handleClear}
        resultCount={filteredCampaigns.length}
        total={campaigns.length}
      />

      {/* Campaign List */}
      <CampaignList
        campaigns={filteredCampaigns}
        customFields={customFields}
        loading={loading}
        error={error}
        visibleColumns={visibleColumns}
        showColumnManager={showColumnManager}
        setShowColumnManager={setShowColumnManager}
        toggleColumn={toggleColumn}
        showAllColumns={showAllColumns}
        hideAllColumns={hideAllColumns}
        onCreateClick={() => setCurrentView('create')}
        onManageFieldsClick={() => setCurrentView('manage-fields')}
        onEdit={editCampaign}
        onToggle={toggleCampaign}
        onDuplicate={duplicateCampaign}
        onDelete={deleteCampaign}
        userRole={user?.role}
      />
    </div>
  );
}