"use client";
import { useState, useMemo } from 'react';
import {
  Plus, Settings, Trash2, Edit, Copy, X, Search, ChevronDown,
  RefreshCw, Download, CalendarDays, Loader2
} from 'lucide-react';

function todayISO() { return new Date().toISOString().split('T')[0]; }
function offsetISO(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; }
function fmtShort(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCF(obj, key) {
  if (!obj || !key) return null;
  if (typeof obj.get === 'function') return obj.get(key) ?? null;
  if (obj instanceof Map) return obj.get(key) ?? null;
  return obj[key] ?? null;
}
function fmtCFVal(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

const ALL_COLUMNS = [
  { key: 'status',      label: 'Status' },
  { key: 'budget',      label: 'Budget' },
  { key: 'totalCost',   label: 'Total cost' },
  { key: 'cpc',         label: 'CPC (Destination)' },
  { key: 'cpm',         label: 'CPM' },
  { key: 'impressions', label: 'Impressions' },
  { key: 'clicks',      label: 'Clicks (Destination)' },
  { key: 'ctr',         label: 'CTR (Destination)' },
  { key: 'conversions', label: 'Conversions' },
  { key: 'cpa',         label: 'CPA' },
];

// ─── Cell value: shows daily/range override data if a date filter is active ───
function CellVal({ campaignId, fieldKey, defaultVal, dailyDataMap, tableDate }) {
  if (!tableDate || !dailyDataMap) return <>{defaultVal || '—'}</>;
  const rec = dailyDataMap[campaignId];
  if (!rec) return <span className="text-gray-400 italic text-xs">—</span>;
  const val = rec[fieldKey];
  if (!val || val === '—') return <span className="text-gray-400 italic text-xs">—</span>;
  return (
    <span className="text-black">
      {val}
      {rec._aggregated && rec.days > 1 && (
        <span className="ml-1 text-xs text-violet-500 font-normal">Σ{rec.days}d</span>
      )}
    </span>
  );
}

function TableDateBar({ tableDate, onTableDateChange, tableEndDate, onTableEndDateChange, loadingDaily, dailyDataMap, campaigns }) {
  const today = todayISO();
  const presets = [
    { label: 'Today', start: today, end: today },
    { label: 'Yesterday', start: offsetISO(1), end: offsetISO(1) },
    { label: '7 days', start: offsetISO(6), end: today },
    { label: '30 days', start: offsetISO(29), end: today },
  ];
  const isPreset = (p) => tableDate === p.start && tableEndDate === p.end;
  const hasEntries = Object.keys(dailyDataMap || {}).length;

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-200 flex-wrap bg-gray-50">
      <div className="flex items-center gap-2">
        <CalendarDays size={14} className="text-gray-500" />
        {presets.map(p => (
          <button key={p.label}
            onClick={() => { onTableDateChange(p.start); onTableEndDateChange(p.end); }}
            className={`px-2.5 py-1 rounded text-xs font-medium border transition
              ${isPreset(p) ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'}`}>
            {p.label}
          </button>
        ))}
      </div>
      <input type="date" value={tableDate} onChange={e => onTableDateChange(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs text-black bg-white" />
      <span className="text-gray-300">→</span>
      <input type="date" value={tableEndDate} min={tableDate} onChange={e => onTableEndDateChange(e.target.value)}
        className="border border-gray-200 rounded px-2 py-1 text-xs text-black bg-white" />
      {loadingDaily && <Loader2 size={13} className="animate-spin text-gray-400" />}
      <span className="ml-auto text-xs text-gray-500">
        {hasEntries}/{campaigns.length} campaigns have data · {fmtShort(tableDate)}{tableDate !== tableEndDate ? ` → ${fmtShort(tableEndDate)}` : ''}
      </span>
    </div>
  );
}

export default function TiktokCampaignList({
  campaigns,
  customFields,
  loading,
  visibleColumns,
  toggleColumn,
  onCreateClick,
  onManageFieldsClick,
  onEdit,
  onToggle,
  onDuplicate,
  onDelete,
  userRole,
  tableDate,
  onTableDateChange,
  tableEndDate,
  onTableEndDateChange,
  dailyDataMap,
  loadingDaily,
  onOpenDailyEntry,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [showColumnManager, setShowColumnManager] = useState(false);
  const [selected, setSelected] = useState(new Set());

  const isAdmin = userRole === 'admin';

  const filtered = useMemo(() => {
    return campaigns.filter(c => {
      const matchSearch = !search || c.name?.toLowerCase().includes(search.toLowerCase());
      const matchStatus = statusFilter === 'All' || c.status === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [campaigns, search, statusFilter]);

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) setSelected(new Set());
    else setSelected(new Set(filtered.map(c => c._id)));
  };
  const toggleSelectOne = (id) => {
    setSelected(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  const customFieldDefs = useMemo(() =>
    (customFields || []).filter(f => visibleColumns[`custom_${f.name}`] !== false),
    [customFields, visibleColumns]
  );

  return (
    <div className="bg-white">
      {/* ── Top toolbar (mirrors TikTok Ads Manager header) ─────────────── */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button onClick={onCreateClick}
              className="flex items-center gap-1.5 bg-black text-white px-4 py-2 rounded text-sm font-semibold hover:bg-gray-800 transition">
              <Plus size={15} /> Create
            </button>
          )}
          {isAdmin && (
            <button onClick={() => selected.size === 1 && onEdit(campaigns.find(c => c._id === [...selected][0]))}
              disabled={selected.size !== 1}
              className="px-4 py-2 rounded text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 transition">
              Edit
            </button>
          )}
          {isAdmin && (
            <button onClick={onManageFieldsClick}
              className="flex items-center gap-1.5 px-4 py-2 rounded text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition">
              <Plus size={14} /> Manage Fields
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or ID"
              className="pl-8 pr-3 py-1.5 border border-gray-200 rounded text-sm text-black focus:outline-none focus:ring-1 focus:ring-black w-56" />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 border border-gray-200 rounded text-sm text-black bg-white cursor-pointer">
              {['All', 'active', 'inactive', 'paused', 'draft', 'scheduled', 'completed'].map(s => (
                <option key={s} value={s}>{s === 'All' ? 'All statuses' : s[0].toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          </div>
          <button onClick={() => setShowColumnManager(v => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 transition">
            <Settings size={14} /> Columns
          </button>
          <button title="Refresh" className="p-1.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 transition">
            <RefreshCw size={14} />
          </button>
          <button title="Export" className="p-1.5 border border-gray-200 rounded text-gray-500 hover:bg-gray-50 transition">
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* ── Column manager panel ─────────────────────────────────────────── */}
      {showColumnManager && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-wrap gap-3">
            {ALL_COLUMNS.map(col => (
              <label key={col.key} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                <input type="checkbox" checked={visibleColumns[col.key] !== false}
                  onChange={() => toggleColumn(col.key)} className="rounded accent-black" />
                {col.label}
              </label>
            ))}
            {customFields?.map(f => (
              <label key={f._id} className="flex items-center gap-1.5 text-xs text-purple-700 cursor-pointer">
                <input type="checkbox" checked={visibleColumns[`custom_${f.name}`] !== false}
                  onChange={() => toggleColumn(`custom_${f.name}`)} className="rounded accent-purple-600" />
                {f.label}
              </label>
            ))}
          </div>
        </div>
      )}

      {/* ── Daily data date bar ──────────────────────────────────────────── */}
      {onTableDateChange && (
        <TableDateBar
          tableDate={tableDate} onTableDateChange={onTableDateChange}
          tableEndDate={tableEndDate} onTableEndDateChange={onTableEndDateChange}
          loadingDaily={loadingDaily} dailyDataMap={dailyDataMap} campaigns={filtered}
        />
      )}

      {loading ? (
        <div className="py-16 text-center">
          <Loader2 className="animate-spin text-black mx-auto" size={28} />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-white">
                <th className="w-10 px-4 py-2.5">
                  <input type="checkbox" checked={selected.size > 0 && selected.size === filtered.length}
                    onChange={toggleSelectAll} className="rounded accent-black" />
                </th>
                {isAdmin && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">On/Off</th>}
                <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Name</th>
                {visibleColumns.status !== false && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Status</th>}
                {visibleColumns.budget !== false && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Budget</th>}
                {visibleColumns.totalCost !== false && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Total cost</th>}
                {visibleColumns.cpc !== false && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">CPC (Destination)</th>}
                {visibleColumns.cpm !== false && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">CPM</th>}
                {visibleColumns.impressions !== false && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Impressions</th>}
                {visibleColumns.clicks !== false && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Clicks (Destination)</th>}
                {visibleColumns.ctr !== false && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">CTR (Destination)</th>}
                {visibleColumns.conversions !== false && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Conversions</th>}
                {visibleColumns.cpa !== false && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">CPA</th>}
                {customFieldDefs.map(f => (
                  <th key={f._id} className="px-3 py-2.5 text-left text-xs font-semibold text-purple-500 whitespace-nowrap">{f.label}</th>
                ))}
                {isAdmin && <th className="px-3 py-2.5 text-left text-xs font-semibold text-gray-500 whitespace-nowrap">Daily Entry</th>}
                {isAdmin && <th className="px-3 py-2.5 text-right text-xs font-semibold text-gray-500 whitespace-nowrap">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={20} className="px-4 py-10 text-center text-gray-400">
                    No TikTok campaigns yet. {isAdmin && 'Click "Create" to add your first one.'}
                  </td>
                </tr>
              ) : filtered.map(c => {
                const hasDaily = tableDate && dailyDataMap && dailyDataMap[c._id];
                return (
                  <tr key={c._id} className={`border-b border-gray-100 hover:bg-gray-50 transition ${tableDate && !hasDaily ? 'opacity-70' : ''}`}>
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selected.has(c._id)} onChange={() => toggleSelectOne(c._id)} className="rounded accent-black" />
                    </td>
                    {isAdmin && (
                      <td className="px-3 py-3">
                        <button onClick={() => onToggle(c._id)}
                          className={`w-9 h-5 rounded-full transition relative ${c.active ? 'bg-black' : 'bg-gray-300'}`}>
                          <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition ${c.active ? 'right-0.5' : 'left-0.5'}`} />
                        </button>
                      </td>
                    )}
                    <td className="px-3 py-3 min-w-[200px]">
                      <p className="font-medium text-black truncate">{c.name}</p>
                    </td>
                    {visibleColumns.status !== false && (
                      <td className="px-3 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${c.status === 'active' ? 'bg-green-500' : c.status === 'paused' ? 'bg-yellow-500' : 'bg-gray-400'}`} />
                          <span className="text-black capitalize">{c.status}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{c.statusNote}</p>
                      </td>
                    )}
                    {visibleColumns.budget !== false && <td className="px-3 py-3 text-black whitespace-nowrap">{c.budget}</td>}
                    {visibleColumns.totalCost !== false && <td className="px-3 py-3 text-black whitespace-nowrap"><CellVal campaignId={c._id} fieldKey="totalCost" defaultVal={c.totalCost} dailyDataMap={dailyDataMap} tableDate={tableDate} /></td>}
                    {visibleColumns.cpc !== false && <td className="px-3 py-3 text-black whitespace-nowrap"><CellVal campaignId={c._id} fieldKey="cpc" defaultVal={c.cpc} dailyDataMap={dailyDataMap} tableDate={tableDate} /></td>}
                    {visibleColumns.cpm !== false && <td className="px-3 py-3 text-black whitespace-nowrap"><CellVal campaignId={c._id} fieldKey="cpm" defaultVal={c.cpm} dailyDataMap={dailyDataMap} tableDate={tableDate} /></td>}
                    {visibleColumns.impressions !== false && <td className="px-3 py-3 text-black whitespace-nowrap"><CellVal campaignId={c._id} fieldKey="impressions" defaultVal={c.impressions} dailyDataMap={dailyDataMap} tableDate={tableDate} /></td>}
                    {visibleColumns.clicks !== false && <td className="px-3 py-3 text-black whitespace-nowrap"><CellVal campaignId={c._id} fieldKey="clicks" defaultVal={c.clicks} dailyDataMap={dailyDataMap} tableDate={tableDate} /></td>}
                    {visibleColumns.ctr !== false && <td className="px-3 py-3 text-black whitespace-nowrap"><CellVal campaignId={c._id} fieldKey="ctr" defaultVal={c.ctr} dailyDataMap={dailyDataMap} tableDate={tableDate} /></td>}
                    {visibleColumns.conversions !== false && <td className="px-3 py-3 text-black whitespace-nowrap"><CellVal campaignId={c._id} fieldKey="conversions" defaultVal={c.conversions} dailyDataMap={dailyDataMap} tableDate={tableDate} /></td>}
                    {visibleColumns.cpa !== false && <td className="px-3 py-3 text-black whitespace-nowrap"><CellVal campaignId={c._id} fieldKey="cpa" defaultVal={c.cpa} dailyDataMap={dailyDataMap} tableDate={tableDate} /></td>}
                    {customFieldDefs.map(f => {
                      let val;
                      if (tableDate && dailyDataMap?.[c._id]) {
                        val = fmtCFVal(getCF(dailyDataMap[c._id].customFields, f.name));
                      } else {
                        val = fmtCFVal(getCF(c.customFields, f.name));
                      }
                      return (
                        <td key={f._id} className="px-3 py-3 text-black whitespace-nowrap">
                          {val || <span className="text-gray-300">—</span>}
                        </td>
                      );
                    })}
                    {isAdmin && (
                      <td className="px-3 py-3">
                        <button onClick={() => onOpenDailyEntry(c)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded border border-amber-300 text-amber-700 hover:bg-amber-50 transition whitespace-nowrap">
                          <CalendarDays size={12} /> Enter Data
                        </button>
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-3 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => onEdit(c)} className="p-1.5 hover:bg-gray-100 rounded" title="Edit"><Edit size={14} className="text-gray-500" /></button>
                          <button onClick={() => onDuplicate(c._id)} className="p-1.5 hover:bg-gray-100 rounded" title="Duplicate"><Copy size={14} className="text-gray-500" /></button>
                          <button onClick={() => onDelete(c._id)} className="p-1.5 hover:bg-red-50 rounded" title="Delete"><Trash2 size={14} className="text-red-400" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
        Total of {filtered.length} campaign{filtered.length !== 1 ? 's' : ''}
      </div>
    </div>
  );
}
