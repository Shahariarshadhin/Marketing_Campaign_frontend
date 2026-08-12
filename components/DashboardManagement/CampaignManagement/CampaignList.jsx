
"use client";
import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { Copy, Edit, Plus, Settings, Trash2, X, CalendarDays, Loader2, Eye, EyeOff, Search, Filter, ChevronDown, GripVertical, Check, ChevronUp, Rows3, Columns3, FileBarChart, DownloadIcon, Maximize2, MoreVertical, LineChart, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';

// ─── helpers ──────────────────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().split('T')[0]; }
function offsetISO(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; }
function fmtShort(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Format a value as currency — adds $ if it's a plain number/string, leaves
// existing currency symbols, dashes, and non-numeric text alone.
function fmtMoney(v) {
  if (v === null || v === undefined || v === '' || v === '—') return v ?? '—';
  const str = String(v).trim();
  if (str === '—' || /[$€£¥]/.test(str)) return str; // already has a currency sign
  const num = parseFloat(str.replace(/,/g, ''));
  if (isNaN(num)) return str; // not a number (e.g. "Using ad set budget") — leave as-is
  return `$${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}


function fmtDateShort(iso) {
  if (!iso || iso === 'Ongoing' || iso === '—') return null;
  const d = new Date(iso.includes('T') ? iso : `${iso}T00:00:00`);
  if (isNaN(d)) return iso; // fallback if it's already a non-ISO string
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Safely read a value from either a plain object or a Mongoose Map
function getCF(obj, key) {
  if (!obj || !key) return null;
  if (typeof obj.get === 'function') return obj.get(key) ?? null;
  if (obj instanceof Map) return obj.get(key) ?? null;
  return obj[key] ?? null;
}

// Format a custom field value for display
function fmtCFVal(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

function HeaderToolbarButton({ icon: Icon, label, badge, onClick }) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-black transition">
      <span className="relative">
        <Icon size={18} strokeWidth={1.8} />
        {badge != null && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-blue-600 text-white text-[10px] font-bold leading-none">
            {badge}
          </span>
        )}
      </span>
      <span className="text-[11px] font-medium leading-none">{label}</span>
    </button>
  );
}

function ToolbarIconButton({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition
        ${disabled ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:bg-gray-100 hover:text-black'}`}>
      <Icon size={16} strokeWidth={1.8} />
      <span className="text-[11px] font-medium leading-none">{label}</span>
    </button>
  );
}

function exportCampaignsCSV(campaigns) {
  const headers = ['Campaign', 'Delivery', 'Results', 'Actions', 'Cost per Result', 'Budget', 'Amount Spent', 'Impressions', 'Reach', 'Ends'];
  const rows = campaigns.map(c => [c.name, c.delivery, c.results, c.actions, c.costPerResult, c.budget, c.amountSpent, c.impressions, c.reach, c.endDate]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'campaigns.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ─── DV360-style filter bar ────────────────────────────────────────────────────
function FilterBar({
  statusFilter, onStatusChange, filters, onAddFilter, onRemoveFilter, onClearAll,
  onColumnsClick, onDownloadClick, onSegmentClick, onReportsClick, onExpandClick, onMoreClick,
  collapsed, onToggleCollapsed,
}) {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const searchInputRef = useRef(null);

  const STATUS_OPTIONS = ['All', 'Active', 'Paused', 'Draft', 'Scheduled', 'Completed'];

  const commitFilter = () => {
    const text = inputValue.trim();
    if (!text) return;
    onAddFilter(text);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); commitFilter(); }
  };

  const hasAnyFilter = filters.length > 0 || statusFilter !== 'All';

  return (
    <div className="flex items-center justify-between border-b border-gray-200 bg-white">
      {/* ── Left: existing filter chips + search ─────────────────────── */}
      <div className="flex items-center gap-2 px-4 py-2 flex-wrap flex-1 min-w-0">
        <div className="relative shrink-0">
          <div className="w-8 h-8 flex items-center justify-center text-blue-600">
            <Filter size={17} strokeWidth={2} />
            {hasAnyFilter && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white text-white flex items-center justify-center" style={{ fontSize: '7px' }}>
                {filters.length + (statusFilter !== 'All' ? 1 : 0)}
              </span>
            )}
          </div>
        </div>

        <div className="relative shrink-0">
          <div className="flex items-center gap-1 bg-gray-100 border border-gray-300 rounded-full px-3 py-1 text-xs font-medium text-black">
            <span>Status: </span>
            <button onClick={() => setShowStatusMenu(v => !v)}
              className="flex items-center gap-0.5 font-semibold text-gray-800 hover:text-blue-600 transition">
              {statusFilter === 'All' ? 'Active' : statusFilter}
              <ChevronDown size={11} className="ml-0.5" />
            </button>
            <button onClick={() => onStatusChange('All')} className="ml-1 hover:text-red-500 transition text-gray-400">
              <X size={12} />
            </button>
          </div>
          {showStatusMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
              <div className="absolute left-0 top-8 z-20 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[130px]">
                {STATUS_OPTIONS.map(s => (
                  <button key={s} onClick={() => { onStatusChange(s); setShowStatusMenu(false); }}
                    className={`w-full text-left px-4 py-2 text-sm transition
                      ${statusFilter === s ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-black hover:bg-gray-50'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {filters.map(f => (
          <div key={f.id} className="flex items-center gap-1.5 bg-gray-100 border border-gray-300 rounded-full px-3 py-1 text-xs font-medium text-black shrink-0">
            <span className="text-black">Campaign name contains</span>
            <span className="font-semibold">{f.text}</span>
            <button onClick={() => onRemoveFilter(f.id)} className="ml-1 hover:text-red-500 transition text-gray-400">
              <X size={12} />
            </button>
          </div>
        ))}

        <div className="flex-1 min-w-[160px] relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            ref={searchInputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitFilter}
            placeholder="Enter a search term or select filters"
            className="w-full pl-8 pr-3 py-1.5 text-sm text-black bg-transparent border-0 focus:outline-none placeholder-gray-400"
          />
        </div>

        {hasAnyFilter && (
          <button onClick={onClearAll}
            className="shrink-0 w-7 h-7 flex items-center justify-center text-gray-400 hover:text-black hover:bg-gray-100 rounded-full transition">
            <X size={15} />
          </button>
        )}
      </div>

      {/* ── Right: icon toolbar (matches Google Ads style) ────────────── */}
      <div className="flex items-center gap-0.5 px-2 border-l border-gray-100 shrink-0">
        <ToolbarIconButton icon={Search} label="Search" onClick={() => searchInputRef.current?.focus()} />
        <ToolbarIconButton icon={Rows3} label="Segment" onClick={onSegmentClick} />
        <ToolbarIconButton icon={Columns3} label="Columns" onClick={onColumnsClick} />
        <ToolbarIconButton icon={FileBarChart} label="Reports" onClick={onReportsClick} />
        <ToolbarIconButton icon={DownloadIcon} label="Download" onClick={onDownloadClick} />
        <ToolbarIconButton icon={Maximize2} label="Expand" onClick={onExpandClick} />
        <ToolbarIconButton icon={MoreVertical} label="More" onClick={onMoreClick} disabled />
        <div className="w-px h-6 bg-gray-200 mx-1" />
        <button onClick={onToggleCollapsed}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-black rounded-lg transition">
          <ChevronUp size={16} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </div>
  );
}


function TableDateBar({ tableDate, onTableDateChange, tableEndDate, onTableEndDateChange, loadingDaily, dailyDataMap, campaigns }) {
  const today = todayISO();

  const presets = [
    { label: 'Today', start: today, end: today },
    { label: 'Yesterday', start: offsetISO(1), end: offsetISO(1) },
    { label: '7 days', start: offsetISO(6), end: today },
    { label: '30 days', start: offsetISO(29), end: today },
    { label: '90 days', start: offsetISO(89), end: today },
  ];



  const isPreset = (p) => tableDate === p.start && tableEndDate === p.end;
  const isSingleDay = tableDate === tableEndDate;
  const hasEntries = Object.keys(dailyDataMap || {}).length;
  const rangeLabel = tableDate === tableEndDate
    ? fmtShort(tableDate)
    : `${fmtShort(tableDate)} → ${fmtShort(tableEndDate)}`;

  function DailyViewDropdown({ presets, isPreset, onTableDateChange, onTableEndDateChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    // Close on outside click
    useEffect(() => {
      const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
      document.addEventListener('mousedown', onClick);
      return () => document.removeEventListener('mousedown', onClick);
    }, []);

    const active = presets.find(p => isPreset(p)) || presets[0];

    return (
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen(v => !v)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 text-white border border-blue-600 shadow-sm hover:bg-blue-700 transition">
          {active.label}
          <ChevronDown size={13} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute left-0 top-full mt-1.5 z-30 bg-white border border-gray-200 rounded-xl shadow-lg py-1 min-w-[140px]">
            {presets.map(p => (
              <button
                key={p.label}
                onClick={() => {
                  onTableDateChange(p.start);
                  onTableEndDateChange(p.end);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-xs font-medium text-left transition
                ${isPreset(p) ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-50'}`}>
                {p.label}
                {isPreset(p) && <Check size={13} className="text-blue-600" />}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-blue-100 rounded-xl my-3 shadow-sm">
      <div className="flex items-center gap-3 px-4 py-2.5 flex-wrap border-b border-blue-50">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
          <CalendarDays size={14} />
          Daily Data View
        </div>
        <DailyViewDropdown
          presets={presets}
          isPreset={isPreset}
          onTableDateChange={onTableDateChange}
          onTableEndDateChange={onTableEndDateChange}
        />
        {/* <div className="flex flex-wrap gap-1">
          {presets.map(p => (
            <button key={p.label}
              onClick={() => { onTableDateChange(p.start); onTableEndDateChange(p.end); }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition border
                ${isPreset(p)
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-gray-50 text-black border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300'}`}>
              {p.label}
            </button>
          ))}
        </div> */}
        {loadingDaily && (
          <div className="flex items-center gap-1.5 text-xs text-blue-500 ml-1">
            <Loader2 size={12} className="animate-spin" /> Loading…
          </div>
        )}
        {!loadingDaily && (
          <span className="ml-auto text-xs font-medium text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">
            {hasEntries}/{campaigns.length} campaigns have data
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 px-4 py-2 flex-wrap">
        <span className="text-xs text-gray-500 font-medium">Custom range:</span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">From</label>
          <input type="date" value={tableDate} onChange={e => onTableDateChange(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <span className="text-gray-300 text-sm">→</span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">To</label>
          <input type="date" value={tableEndDate} min={tableDate} onChange={e => onTableEndDateChange(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-black bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <div className={`ml-2 flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full
          ${isSingleDay ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-violet-50 text-violet-700 border border-violet-200'}`}>
          <CalendarDays size={11} />
          {isSingleDay ? rangeLabel : `${rangeLabel} (summed)`}
        </div>
      </div>
    </div>
  );
}

// ─── Cell value: show daily/range data if available ───────────────────────────
function CellVal({ campaignId, fieldKey, defaultVal, dailyDataMap, tableDate, currency = false }) {
  const fmt = (v) => (currency ? fmtMoney(v) : v);

  if (!tableDate || !dailyDataMap) return <>{fmt(defaultVal) || '—'}</>;
  const rec = dailyDataMap[campaignId];
  if (!rec) return <span className="text-black italic text-xs">—</span>;
  const val = rec[fieldKey];
  if (!val || val === '—') return <span className="text-black italic text-xs">—</span>;
  return (
    <span className="font-normal text-black">
      {fmt(val)}
      {rec._aggregated && rec.days > 1 && (
        <span className="ml-1 text-xs text-violet-400 font-normal">Σ{rec.days}d</span>
      )}
    </span>
  );
}

function BudgetCell({ campaign, dailyDataMap, tableDate }) {
  const start = fmtDateShort(campaign.startDate);
  const end = campaign.endDate === 'Ongoing' ? 'Ongoing' : fmtDateShort(campaign.endDate);
  const dateRange = start ? `${start} - ${end || 'Ongoing'}` : null;

  return (
    <div className="text-right leading-tight">
      <div className="text-black">
        <CellVal
          campaignId={campaign._id}
          fieldKey="budget"
          defaultVal={campaign.budget}
          dailyDataMap={dailyDataMap}
          tableDate={tableDate}
          currency
        />
      </div>
      {dateRange && (
        <div className="text-xs text-gray-400 mt-0.5">{dateRange}</div>
      )}
    </div>
  );
}

// ─── Column resize handle (DOM-direct, smooth) ─────────────────────────────
function ColResizeHandle({ colKey, currentWidth, onCommit, min = 4 }) {
  const onMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = currentWidth;
    let latestWidth = startWidth;
    let rafId = null;

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const colEl = document.querySelector(`col[data-col-key="${colKey}"]`);
    const tableEl = colEl ? colEl.closest('table') : null;

    if (tableEl && !tableEl.dataset.dragBaseWidth) {
      tableEl.dataset.dragBaseWidth = tableEl.offsetWidth;
    }
    const baseTableWidth = tableEl ? parseFloat(tableEl.dataset.dragBaseWidth || tableEl.offsetWidth) : 0;

    const onMove = (ev) => {
      const delta = ev.clientX - startX;
      latestWidth = Math.max(min, startWidth + delta);
      if (rafId == null) {
        rafId = requestAnimationFrame(() => {
          if (colEl) colEl.style.width = `${latestWidth}px`;
          if (tableEl) tableEl.style.width = `${baseTableWidth + (latestWidth - startWidth)}px`;
          rafId = null;
        });
      }
    };

    const onUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (rafId) cancelAnimationFrame(rafId);
      if (tableEl) delete tableEl.dataset.dragBaseWidth;
      onCommit(latestWidth);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute top-0 right-0 translate-x-1/2 w-1.5 h-full cursor-col-resize z-20 hover:bg-blue-400/60 active:bg-blue-500/70"
    />
  );
}

// ─── Row resize handle (DOM-direct, smooth) ────────────────────────────────
function RowResizeHandle({ rowId, currentHeight, onCommit, min = 4 }) {
  const onMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const startY = e.clientY;
    const startHeight = currentHeight;
    let latestHeight = startHeight;
    let rafId = null;

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const rowEl = document.querySelector(`tr[data-row-id="${rowId}"]`);

    const onMove = (ev) => {
      const delta = ev.clientY - startY;
      latestHeight = Math.max(min, startHeight + delta);
      if (rafId == null) {
        rafId = requestAnimationFrame(() => {
          if (rowEl) rowEl.style.height = `${latestHeight}px`;
          rafId = null;
        });
      }
    };

    const onUp = () => {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      if (rafId) cancelAnimationFrame(rafId);
      onCommit(latestHeight);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  return (
    <div
      onMouseDown={onMouseDown}
      className="absolute left-0 bottom-0 translate-y-1/2 w-full h-1.5 cursor-row-resize z-20 hover:bg-blue-400/60 active:bg-blue-500/70"
    />
  );
}

// ─── Clips cell content to an exact pixel box, ignoring content size ───────
function ClipCell({ height, className = '', children }) {
  return (
    <div
      style={{ height, overflow: 'hidden' }}
      className={`flex items-center min-w-0 ${className}`}
    >
      <div className="min-w-0 w-full truncate">
        {children}
      </div>
    </div>
  );
}

const BUILTIN_ORDERABLE = [
  'delivery', 'actions', 'results', 'costPerResult',
  'budget', 'amountSpent', 'impressions', 'reach', 'ends',
];

// ─── Main component ────────────────────────────────────────────────────────────
export default function CampaignList({
  campaigns,
  customFields,
  loading,
  error,
  visibleColumns,
  showColumnManager,
  setShowColumnManager,
  toggleColumn,
  showAllColumns,
  hideAllColumns,
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
  // ★ Controls visibility of Enter Data + action buttons columns
  const [showRowActions, setShowRowActions] = useState(false);
  // ★ DV360-style filter bar state
  const [statusFilter, setStatusFilter] = useState('Active');
  const [filters, setFilters] = useState([]); // [{ id, text }]

  const [filterBarCollapsed, setFilterBarCollapsed] = useState(false);

  const addFilter = useCallback((text) => {
    setFilters(prev => {
      // avoid duplicate chips for the same text (case-insensitive)
      if (prev.some(f => f.text.toLowerCase() === text.toLowerCase())) return prev;
      return [...prev, { id: `${Date.now()}-${Math.random()}`, text }];
    });
  }, []);

  const removeFilter = useCallback((id) => {
    setFilters(prev => prev.filter(f => f.id !== id));
  }, []);

  const clearAllFilters = useCallback(() => {
    setStatusFilter('All');
    setFilters([]);
  }, []);

  const tableRef = useRef(null);
  const [colWidths, setColWidths] = useState({});
  const [rowHeights, setRowHeights] = useState({});
  const getColWidth = (key, fallback) => colWidths[key] ?? fallback;
  const setColWidth = (key, w) => setColWidths(prev => ({ ...prev, [key]: w }));
  const getRowHeight = (id) => rowHeights[id] ?? 56;
  const setRowHeight = (id, h) => setRowHeights(prev => ({ ...prev, [id]: h }));

  const [adjustCount, setAdjustCount] = useState(0); // or derive it from something real, e.g. pending column/field changes

  const onMetricsClick = () => { /* open your metrics summary view */ };
  const onAdjustClick = () => { /* open bulk-edit / adjust panel */ };
  const onExpandClick = () => { /* toggle fullscreen / expand table */ };

  // ─── Column ordering (drag & drop) ─────────────────────────────────────────

  const ORDER_STORAGE_KEY = 'campaignTable_columnOrder';

  const [columnOrder, setColumnOrder] = useState(() => {
    if (typeof window === 'undefined') return BUILTIN_ORDERABLE;
    try {
      const saved = JSON.parse(localStorage.getItem(ORDER_STORAGE_KEY) || 'null');
      return Array.isArray(saved) && saved.length ? saved : BUILTIN_ORDERABLE;
    } catch { return BUILTIN_ORDERABLE; }
  });
  const [draggedKey, setDraggedKey] = useState(null);
  const [dragOverKey, setDragOverKey] = useState(null);

  // ★ Build the live column list based on visibleColumns / customFields / showRowActions
  const customFieldDefs = useMemo(() =>
    customFields
      .filter(f => visibleColumns[`custom_${f.name}`] !== false)
      .map(f => ({ key: `custom_${f.name}`, label: f.label, width: 160, field: f })),
    [customFields, visibleColumns]
  );

  const columnDefs = useMemo(() => {
    const defs = [];
    if (visibleColumns.checkbox) defs.push({ key: 'checkbox', label: '', width: 50, resizable: false, fixed: true });
    if (visibleColumns.toggle) defs.push({ key: 'toggle', label: 'On/Off', width: 90, fixed: true });
    defs.push({ key: 'name', label: 'Campaign', width: 220, fixed: true });

    const orderableMap = {};
    if (visibleColumns.delivery) orderableMap.delivery = { key: 'delivery', label: 'Delivery', width: 140 };
    if (visibleColumns.actions) orderableMap.actions = { key: 'actions', label: 'Actions', width: 110 };
    if (visibleColumns.results) orderableMap.results = { key: 'results', label: 'Results', width: 110 };
    if (visibleColumns.costPerResult) orderableMap.costPerResult = { key: 'costPerResult', label: 'Cost per Result', width: 130 };
    if (visibleColumns.budget) orderableMap.budget = { key: 'budget', label: 'Budget', width: 120 };
    if (visibleColumns.amountSpent) orderableMap.amountSpent = { key: 'amountSpent', label: 'Amount Spent', width: 130 };
    if (visibleColumns.impressions) orderableMap.impressions = { key: 'impressions', label: 'Impressions', width: 120 };
    if (visibleColumns.reach) orderableMap.reach = { key: 'reach', label: 'Reach', width: 110 };
    if (visibleColumns.ends) orderableMap.ends = { key: 'ends', label: 'Ends', width: 110 };
    customFieldDefs.forEach(d => { orderableMap[d.key] = d; });

    const effectiveOrder = [
      ...columnOrder.filter(k => orderableMap[k]),
      ...Object.keys(orderableMap).filter(k => !columnOrder.includes(k)),
    ];

    effectiveOrder.forEach(key => {
      defs.push({ ...orderableMap[key], orderable: true });
    });

    if (showRowActions && userRole === 'admin') defs.push({ key: 'dailyEntry', label: 'Daily Entry', width: 140, fixed: true });
    defs.push({ key: 'lastCol', label: '', width: showRowActions ? 110 : 50, resizable: false, fixed: true });
    return defs;
  }, [visibleColumns, customFieldDefs, showRowActions, userRole, columnOrder]);

  // Persist order — side effect, belongs in useEffect, not useMemo
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ORDER_STORAGE_KEY, JSON.stringify(columnOrder));
    }
  }, [columnOrder]);

  const handleDragStart = useCallback((key) => setDraggedKey(key), []);
  const handleDragOver = useCallback((e, key) => { e.preventDefault(); setDragOverKey(key); }, []);
  const handleDragEnd = useCallback(() => { setDraggedKey(null); setDragOverKey(null); }, []);

  const handleDrop = useCallback((targetKey) => {
    if (!draggedKey || draggedKey === targetKey) { setDraggedKey(null); setDragOverKey(null); return; }
    setColumnOrder(prev => {
      const next = [...prev];
      const allKeys = columnDefs.filter(c => c.orderable).map(c => c.key);
      allKeys.forEach(k => { if (!next.includes(k)) next.push(k); });

      const from = next.indexOf(draggedKey);
      const to = next.indexOf(targetKey);
      if (from === -1 || to === -1) return prev;
      next.splice(from, 1);
      next.splice(to, 0, draggedKey);
      return next;
    });
    setDraggedKey(null);
    setDragOverKey(null);
  }, [draggedKey, columnDefs]);


  const totalTableWidth = useMemo(
    () => columnDefs.reduce((sum, c) => sum + (colWidths[c.key] ?? c.width), 0),
    [columnDefs, colWidths]
  );

  // Apply status + all active search filters on top of parent-provided campaigns
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter(c => {
      const matchStatus = statusFilter === 'All'
        || c.status?.toLowerCase() === statusFilter.toLowerCase()
        || (statusFilter === 'Active' && c.active);
      const matchAllFilters = filters.every(f =>
        c.name?.toLowerCase().includes(f.text.toLowerCase())
      );
      return matchStatus && matchAllFilters;
    });
  }, [campaigns, statusFilter, filters]);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-1 p-4">
          <div className="space-y-3">
            <h1 className="text-2xl font-semibold text-gray-800">Campaigns</h1>
            <div className="flex justify-between gap-2">
              {/* ★ Eye toggle button */}
              {/* <button
                onClick={() => setShowRowActions(v => !v)}
                title={showRowActions ? 'Hide actions' : 'Show actions'}
                className={`flex items-center gap-2 px-4 py-2 shadow-lg rounded-md transition border text-sm font-medium
                  ${showRowActions
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
                {showRowActions ? <EyeOff size={16} /> : <Eye size={16} />}
                {showRowActions ? 'Hide Actions' : 'Show Actions'}
              </button> */}


              <div className='flex gap-2'>
                <button onClick={onCreateClick}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 shadow-lg rounded-md transition border border-green-200">
                  <Plus size={18} /> Create Campaign
                </button>

                <button onClick={() => setShowColumnManager(!showColumnManager)}
                  className="flex items-center gap-2 bg-white text-black px-4 py-2 shadow-lg rounded-md transition border border-blue-200">
                  <Settings size={18} /> Columns
                </button>
                <button onClick={onManageFieldsClick}
                  className="flex items-center gap-2 bg-white text-black px-4 py-2 shadow-lg rounded-md transition border border-blue-200">
                  <Plus size={18} /> Manage Fields
                </button>
              </div>
              <div className="flex items-center gap-0.5">
                <HeaderToolbarButton icon={LineChart} label="Metrics" onClick={onMetricsClick} />
                <HeaderToolbarButton icon={SlidersHorizontal} label="Adjust" badge={adjustCount} onClick={onAdjustClick} />
                <HeaderToolbarButton icon={DownloadIcon} label="Download" onClick={() => exportCampaignsCSV(filteredCampaigns)} />
                <HeaderToolbarButton icon={Maximize2} label="Expand" onClick={onExpandClick} />
              </div>
            </div>
          </div>

          {/* Column Manager */}
          {showColumnManager && (
            <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Manage Table Columns</h3>
                <div className="flex gap-2">
                  <button onClick={showAllColumns} className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">Show All</button>
                  <button onClick={hideAllColumns} className="text-xs px-3 py-1 bg-gray-100 text-black rounded hover:bg-gray-200 transition">Hide All</button>
                  <button onClick={() => setShowColumnManager(false)} className="text-gray-500 hover:text-black"><X size={18} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { key: 'checkbox', label: 'Checkbox' },
                  { key: 'toggle', label: 'On/Off' },
                  { key: 'delivery', label: 'Delivery' },
                  { key: 'actions', label: 'Actions' },
                  { key: 'results', label: 'Results' },
                  { key: 'costPerResult', label: 'Cost per Result' },
                  { key: 'budget', label: 'Budget' },
                  { key: 'amountSpent', label: 'Amount Spent' },
                  { key: 'impressions', label: 'Impressions' },
                  { key: 'reach', label: 'Reach' },
                  { key: 'ends', label: 'Ends' },
                ].map(col => (
                  <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={visibleColumns[col.key] !== false}
                      onChange={() => toggleColumn(col.key)} className="rounded" />
                    <span className="text-sm text-black">{col.label}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer opacity-50">
                  <input type="checkbox" checked disabled className="rounded" />
                  <span className="text-sm text-black">Campaign (Always Visible)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer opacity-50">
                  <input type="checkbox" checked disabled className="rounded" />
                  <span className="text-sm text-black">Actions (Always Visible)</span>
                </label>
              </div>
              {customFields.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-black mb-3">Custom Fields</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {customFields.map(field => (
                      <label key={field._id} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={visibleColumns[`custom_${field.name}`] !== false}
                          onChange={() => toggleColumn(`custom_${field.name}`)} className="rounded" />
                        <span className="text-sm text-black">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">{error}</div>}
        </div>



        {/* ── Date range filter bar ─────────────────────────────────────────── */}
        {onTableDateChange && (
          <TableDateBar
            tableDate={tableDate}
            onTableDateChange={onTableDateChange}
            tableEndDate={tableEndDate}
            onTableEndDateChange={onTableEndDateChange}
            loadingDaily={loadingDaily}
            dailyDataMap={dailyDataMap}
            campaigns={filteredCampaigns}
          />
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="mt-2 text-black">Loading campaigns...</p>
          </div>
        )}

        {/* ── DV360-style filter bar ────────────────────────────────────── */}
        <div className="bg-white border border-gray-200">
          <FilterBar
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            filters={filters}
            onAddFilter={addFilter}
            onRemoveFilter={removeFilter}
            onClearAll={clearAllFilters}
            onColumnsClick={() => setShowColumnManager(v => !v)}
            onDownloadClick={() => exportCampaignsCSV(filteredCampaigns)}
            onSegmentClick={() => { }}
            onReportsClick={() => { }}
            onExpandClick={() => { }}
            onMoreClick={() => { }}
            collapsed={filterBarCollapsed}
            onToggleCollapsed={() => setFilterBarCollapsed(v => !v)}
          />
        </div>


        {/* Campaign Table */}
        {!loading && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table
                ref={tableRef}
                className="border-collapse text-sm"
                style={{ tableLayout: 'fixed', width: totalTableWidth }}
              >
                <colgroup>
                  {columnDefs.map(c => (
                    <col key={c.key} data-col-key={c.key} style={{ width: getColWidth(c.key, c.width) }} />
                  ))}
                </colgroup>

                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {columnDefs.map(c => {
                      const isLastColEye = c.key === 'lastCol';
                      const isOrderable = c.orderable;
                      return (
                        <th
                          key={c.key}
                          draggable={isOrderable}
                          onDragStart={() => isOrderable && handleDragStart(c.key)}
                          onDragOver={(e) => isOrderable && handleDragOver(e, c.key)}
                          onDrop={() => isOrderable && handleDrop(c.key)}
                          onDragEnd={handleDragEnd}
                          className={`relative px-4 py-3  text-center text-xs font-bold text-black border border-gray-200 overflow-hidden whitespace-nowrap
        ${isOrderable ? 'cursor-move' : ''}
        ${dragOverKey === c.key && draggedKey !== c.key ? 'bg-blue-100' : ''}
        ${draggedKey === c.key ? 'opacity-40' : ''}`}
                        >
                          {c.key === 'checkbox' && <input type="checkbox" className="rounded" />}
                          {c.key !== 'checkbox' && !isLastColEye && (
                            <span className="flex items-center gap-1">
                              {isOrderable && <GripVertical size={11} className="text-black shrink-0" />}
                              {c.label}
                            </span>
                          )}
                          {isLastColEye && (
                            <div className="flex justify-end">
                              <button
                                onClick={() => setShowRowActions(v => !v)}
                                title={showRowActions ? 'Hide actions' : 'Show actions'}
                                className={`p-1.5 rounded-lg border transition
              ${showRowActions
                                    ? 'bg-blue-50 border-blue-200 text-blue-600'
                                    : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-300'}`}>
                                {showRowActions ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          )}
                          {c.resizable !== false && (
                            <ColResizeHandle
                              colKey={c.key}
                              currentWidth={getColWidth(c.key, c.width)}
                              onCommit={w => setColWidth(c.key, w)}
                            />
                          )}
                        </th>
                      );
                    })}
                  </tr>
                </thead>

                <tbody>
                  {filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={columnDefs.length} className="px-4 py-8 text-center text-gray-500 border border-gray-200">
                        No campaigns found. Create your first campaign!
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map(campaign => {
                      const hasDaily = tableDate && dailyDataMap && dailyDataMap[campaign._id];
                      const rh = getRowHeight(campaign._id);

                      return (
                        <tr
                          key={campaign._id}
                          data-row-id={campaign._id}
                          className={`hover:bg-gray-50 text-center transition ${tableDate && !hasDaily ? 'opacity-75' : ''}`}
                          style={{ height: rh }}
                        >
                          {columnDefs.map((c, idx) => {
                            let content = null;

                            switch (c.key) {
                              case 'checkbox':
                                content = <input type="checkbox" className="rounded" />;
                                break;
                              case 'toggle':
                                content = (
                                  <button onClick={() => onToggle(campaign._id)}
                                    className={`w-10 h-6 rounded-full transition ${campaign.active ? 'bg-blue-600' : 'bg-gray-300'} relative`}>
                                    <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${campaign.active ? 'right-1' : 'left-1'}`} />
                                  </button>
                                );
                                break;
                              case 'name':
                                content = (
                                  <div className="flex flex-col gap-0.5 min-w-0 w-full text-left">
                                    <Link
                                      href={userRole === 'admin'
                                        ? `/dashboard/campaign/${campaign._id}/insertion-orders`
                                        : `/viewer/campaign/${campaign._id}`}
                                      className="text-blue-600 hover:underline font-medium truncate">
                                      {campaign.name}
                                    </Link>
                                    {tableDate && (
                                      <div className="text-xs">
                                        {hasDaily
                                          ? <span className="text-emerald-600 font-medium">● has entry</span>
                                          : <span className="text-black">○ no entry</span>}
                                      </div>
                                    )}
                                  </div>
                                );
                                break;
                              case 'delivery':
                                content = (
                                  <div className="flex items-center gap-2 min-w-0">
                                    <span className={`w-2 h-2 rounded-full shrink-0  ${campaign.status === 'active' ? 'bg-green-500' : campaign.status === 'draft' ? 'bg-gray-400' : 'bg-yellow-500'}`} />
                                    <span className="text-sm text-black truncate">
                                      <CellVal campaignId={campaign._id} fieldKey="delivery" defaultVal={campaign.delivery} dailyDataMap={dailyDataMap} tableDate={tableDate} />
                                    </span>
                                  </div>
                                );
                                break;
                              case 'actions':
                                content = <CellVal campaignId={campaign._id} fieldKey="actions" defaultVal={campaign.actions} dailyDataMap={dailyDataMap} tableDate={tableDate} />;
                                break;
                              case 'results':
                                content = <CellVal campaignId={campaign._id} fieldKey="results" defaultVal={campaign.results} dailyDataMap={dailyDataMap} tableDate={tableDate} />;
                                break;
                              case 'costPerResult':
                                content = <CellVal campaignId={campaign._id} fieldKey="costPerResult" defaultVal={campaign.costPerResult} dailyDataMap={dailyDataMap} tableDate={tableDate} currency />;
                                break;
                              case 'budget':
                                content = <BudgetCell campaign={campaign} dailyDataMap={dailyDataMap} tableDate={tableDate} />;
                                break;
                              case 'amountSpent':
                                content = <CellVal campaignId={campaign._id} fieldKey="amountSpent" defaultVal={campaign.amountSpent} dailyDataMap={dailyDataMap} tableDate={tableDate} currency />;
                                break;
                              case 'impressions':
                                content = <CellVal campaignId={campaign._id} fieldKey="impressions" defaultVal={campaign.impressions} dailyDataMap={dailyDataMap} tableDate={tableDate} />;
                                break;
                              case 'reach':
                                content = <CellVal campaignId={campaign._id} fieldKey="reach" defaultVal={campaign.reach} dailyDataMap={dailyDataMap} tableDate={tableDate} />;
                                break;
                              case 'ends':
                                content = <span className="text-black">{campaign.endDate}</span>;
                                break;;
                              case 'dailyEntry':
                                content = (
                                  <button
                                    onClick={() => onOpenDailyEntry && onOpenDailyEntry(campaign)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition
                                      bg-white border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-500 whitespace-nowrap">
                                    <CalendarDays size={12} />
                                    Enter Data
                                  </button>
                                );
                                break;
                              case 'lastCol':
                                content = showRowActions ? (
                                  <div className="flex gap-2">
                                    <button onClick={() => onEdit(campaign)} className="p-1 hover:bg-gray-200 rounded" title="Edit">
                                      <Edit size={16} className="text-black" />
                                    </button>
                                    <button onClick={() => onDuplicate(campaign._id)} className="p-1 hover:bg-gray-200 rounded" title="Duplicate">
                                      <Copy size={16} className="text-black" />
                                    </button>
                                    <button onClick={() => onDelete(campaign._id)} className="p-1 hover:bg-gray-200 rounded" title="Delete">
                                      <Trash2 size={16} className="text-black" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex justify-end w-full">
                                    <button
                                      onClick={() => setShowRowActions(true)}
                                      title="Show actions"
                                      className="p-1.5 rounded-lg border bg-gray-50 border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-300 transition">
                                      <Eye size={14} />
                                    </button>
                                  </div>
                                );
                                break;
                              default:
                                if (c.field) {
                                  // custom field column
                                  if (tableDate && dailyDataMap?.[campaign._id]) {
                                    const rec = dailyDataMap[campaign._id];
                                    const v = getCF(rec.customFields, c.field.name);
                                    const str = fmtCFVal(v);
                                    content = str ? (
                                      <span className="text-black">
                                        {str}
                                        {rec._aggregated && rec.days > 1 && (
                                          <span className="ml-1 text-xs text-black font-normal">Σ{rec.days}d</span>
                                        )}
                                      </span>
                                    ) : <span className="text-gray-300 italic text-xs">—</span>;
                                  } else {
                                    const v = getCF(campaign.customFields, c.field.name)
                                      ?? getCF(campaign.customFieldsData, c.field.name);
                                    const str = fmtCFVal(v);
                                    content = str
                                      ? <span className="text-gray-800">{str}</span>
                                      : <span className="text-gray-300">—</span>;
                                  }
                                }
                            }

                            return (
                              <td key={c.key} className="relative border border-gray-200 p-0">
                                <ClipCell height={rh} className="px-4">
                                  {content}
                                </ClipCell>
                                {idx === 0 && (
                                  <RowResizeHandle
                                    rowId={campaign._id}
                                    currentHeight={rh}
                                    onCommit={h => setRowHeight(campaign._id, h)}
                                  />
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-black flex items-center justify-between">
              <span>Results from {filteredCampaigns.length} of {campaigns.length} campaigns</span>
              {tableDate && (
                <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                  <CalendarDays size={12} />
                  {tableDate === tableEndDate
                    ? `${Object.keys(dailyDataMap || {}).length}/${filteredCampaigns.length} have entries for ${fmtShort(tableDate)}`
                    : `${Object.keys(dailyDataMap || {}).length}/${filteredCampaigns.length} have data · ${fmtShort(tableDate)} → ${fmtShort(tableEndDate)} (summed)`
                  }
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}