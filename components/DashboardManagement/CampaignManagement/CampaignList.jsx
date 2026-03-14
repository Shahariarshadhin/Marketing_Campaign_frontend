"use client";
import { useState } from 'react';
import { Copy, Edit, Plus, Settings, Trash2, X, CalendarDays, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

// ─── helpers ──────────────────────────────────────────────────────────────────
function todayISO() { return new Date().toISOString().split('T')[0]; }
function offsetISO(n) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().split('T')[0]; }
function fmtShort(iso) {
  if (!iso) return '';
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// Safely read a value from either a plain object or a Mongoose Map
function getCF(obj, key) {
  if (!obj || !key) return null;
  if (typeof obj.get === 'function') return obj.get(key) ?? null;
  if (obj instanceof Map)           return obj.get(key) ?? null;
  return obj[key] ?? null;
}

// Format a custom field value for display
function fmtCFVal(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  return String(v);
}

// ─── Date range bar ────────────────────────────────────────────────────────────
function TableDateBar({ tableDate, onTableDateChange, tableEndDate, onTableEndDateChange, loadingDaily, dailyDataMap, campaigns }) {
  const today = todayISO();

  const presets = [
    { label: 'Today',     start: today,        end: today },
    { label: 'Yesterday', start: offsetISO(1),  end: offsetISO(1) },
    { label: '7 days',    start: offsetISO(6),  end: today },
    { label: '30 days',   start: offsetISO(29), end: today },
    { label: '90 days',   start: offsetISO(89), end: today },
  ];

  const isPreset   = (p) => tableDate === p.start && tableEndDate === p.end;
  const isSingleDay = tableDate === tableEndDate;
  const hasEntries  = Object.keys(dailyDataMap || {}).length;
  const rangeLabel  = tableDate === tableEndDate
    ? fmtShort(tableDate)
    : `${fmtShort(tableDate)} → ${fmtShort(tableEndDate)}`;

  return (
    <div className="bg-white border border-blue-100 rounded-xl mx-4 mt-3 mb-1 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-2.5 flex-wrap border-b border-blue-50">
        <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
          <CalendarDays size={14} />
          Daily Data View
        </div>
        <div className="flex flex-wrap gap-1">
          {presets.map(p => (
            <button key={p.label}
              onClick={() => { onTableDateChange(p.start); onTableEndDateChange(p.end); }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition border
                ${isPreset(p)
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300'}`}>
              {p.label}
            </button>
          ))}
        </div>
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
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
        </div>
        <span className="text-gray-300 text-sm">→</span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">To</label>
          <input type="date" value={tableEndDate} min={tableDate} onChange={e => onTableEndDateChange(e.target.value)}
            className="border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400" />
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
function CellVal({ campaignId, fieldKey, defaultVal, dailyDataMap, tableDate }) {
  if (!tableDate || !dailyDataMap) return <>{defaultVal || '—'}</>;
  const rec = dailyDataMap[campaignId];
  if (!rec) return <span className="text-gray-300 italic text-xs">—</span>;
  const val = rec[fieldKey];
  if (!val || val === '—') return <span className="text-gray-300 italic text-xs">—</span>;
  return (
    <span className="font-semibold text-blue-700">
      {val}
      {rec._aggregated && rec.days > 1 && (
        <span className="ml-1 text-xs text-violet-400 font-normal">Σ{rec.days}d</span>
      )}
    </span>
  );
}

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

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto">

        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-800">Campaigns</h1>
            <div className="flex gap-2">
              {/* ★ Eye toggle button */}
              <button
                onClick={() => setShowRowActions(v => !v)}
                title={showRowActions ? 'Hide actions' : 'Show actions'}
                className={`flex items-center gap-2 px-4 py-2 shadow-lg rounded-md transition border text-sm font-medium
                  ${showRowActions
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'}`}>
                {showRowActions ? <EyeOff size={16} /> : <Eye size={16} />}
                {showRowActions ? 'Hide Actions' : 'Show Actions'}
              </button>

              <button onClick={() => setShowColumnManager(!showColumnManager)}
                className="flex items-center gap-2 bg-white text-black px-4 py-2 shadow-lg rounded-md transition border border-blue-200">
                <Settings size={18} /> Columns
              </button>
              <button onClick={onManageFieldsClick}
                className="flex items-center gap-2 bg-white text-black px-4 py-2 shadow-lg rounded-md transition border border-blue-200">
                <Plus size={18} /> Manage Fields
              </button>
              <button onClick={onCreateClick}
                className="flex items-center gap-2 bg-white text-black px-4 py-2 shadow-lg rounded-md transition border border-green-200">
                <Plus size={18} /> Create Campaign
              </button>
            </div>
          </div>

          {/* Column Manager */}
          {showColumnManager && (
            <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Manage Table Columns</h3>
                <div className="flex gap-2">
                  <button onClick={showAllColumns} className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition">Show All</button>
                  <button onClick={hideAllColumns} className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition">Hide All</button>
                  <button onClick={() => setShowColumnManager(false)} className="text-gray-500 hover:text-gray-700"><X size={18} /></button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {[
                  { key: 'checkbox',      label: 'Checkbox' },
                  { key: 'toggle',        label: 'On/Off' },
                  { key: 'delivery',      label: 'Delivery' },
                  { key: 'actions',       label: 'Actions' },
                  { key: 'results',       label: 'Results' },
                  { key: 'costPerResult', label: 'Cost per Result' },
                  { key: 'budget',        label: 'Budget' },
                  { key: 'amountSpent',   label: 'Amount Spent' },
                  { key: 'impressions',   label: 'Impressions' },
                  { key: 'reach',         label: 'Reach' },
                  { key: 'ends',          label: 'Ends' },
                ].map(col => (
                  <label key={col.key} className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={visibleColumns[col.key] !== false}
                      onChange={() => toggleColumn(col.key)} className="rounded" />
                    <span className="text-sm text-gray-700">{col.label}</span>
                  </label>
                ))}
                <label className="flex items-center gap-2 cursor-pointer opacity-50">
                  <input type="checkbox" checked disabled className="rounded" />
                  <span className="text-sm text-gray-700">Campaign (Always Visible)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer opacity-50">
                  <input type="checkbox" checked disabled className="rounded" />
                  <span className="text-sm text-gray-700">Actions (Always Visible)</span>
                </label>
              </div>
              {customFields.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Custom Fields</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {customFields.map(field => (
                      <label key={field._id} className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={visibleColumns[`custom_${field.name}`] !== false}
                          onChange={() => toggleColumn(`custom_${field.name}`)} className="rounded" />
                        <span className="text-sm text-gray-700">{field.label}</span>
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
            campaigns={campaigns}
          />
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            <p className="mt-2 text-gray-600">Loading campaigns...</p>
          </div>
        )}

        {/* Campaign Table */}
        {!loading && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {visibleColumns.checkbox && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase"><input type="checkbox" className="rounded" /></th>}
                    {visibleColumns.toggle   && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">On/Off</th>}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Campaign</th>
                    {visibleColumns.delivery      && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Delivery</th>}
                    {visibleColumns.actions       && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>}
                    {visibleColumns.results       && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Results</th>}
                    {visibleColumns.costPerResult && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Cost per Result</th>}
                    {visibleColumns.budget        && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase border border-gray-200">Budget</th>}
                    {visibleColumns.amountSpent   && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Amount Spent</th>}
                    {visibleColumns.impressions   && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase border border-gray-200">Impressions</th>}
                    {visibleColumns.reach         && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Reach</th>}
                    {visibleColumns.ends          && <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Ends</th>}
                    {customFields.map(f =>
                      visibleColumns[`custom_${f.name}`] !== false && (
                        <th key={f._id} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase border border-gray-200">{f.label}</th>
                      )
                    )}

                    {/* ★ Daily Entry + Actions column header — only when visible */}
                    {showRowActions && userRole === 'admin' && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase bg-amber-50 whitespace-nowrap">
                        Daily Entry
                      </th>
                    )}
                    {/* ★ Eye toggle in last header cell */}
                    <th className="px-3 py-3 text-right">
                      <button
                        onClick={() => setShowRowActions(v => !v)}
                        title={showRowActions ? 'Hide actions' : 'Show actions'}
                        className={`p-1.5 rounded-lg border transition
                          ${showRowActions
                            ? 'bg-blue-50 border-blue-200 text-blue-600'
                            : 'bg-gray-50 border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-300'}`}>
                        {showRowActions ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-200">
                  {campaigns.length === 0 ? (
                    <tr>
                      <td colSpan="20" className="px-4 py-8 text-center text-gray-500">
                        No campaigns found. Create your first campaign!
                      </td>
                    </tr>
                  ) : (
                    campaigns.map(campaign => {
                      const hasDaily = tableDate && dailyDataMap && dailyDataMap[campaign._id];
                      return (
                        <tr key={campaign._id}
                          className={`hover:bg-gray-50 transition ${tableDate && !hasDaily ? 'opacity-75' : ''}`}>

                          {visibleColumns.checkbox && <td className="px-4 py-3"><input type="checkbox" className="rounded" /></td>}
                          {visibleColumns.toggle && (
                            <td className="px-4 py-3">
                              <button onClick={() => onToggle(campaign._id)}
                                className={`w-10 h-6 rounded-full transition ${campaign.active ? 'bg-blue-600' : 'bg-gray-300'} relative`}>
                                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${campaign.active ? 'right-1' : 'left-1'}`} />
                              </button>
                            </td>
                          )}

                          {/* Campaign name */}
                          <td className="px-4 py-3">
                            <Link
                              href={userRole === 'admin'
                                ? `/dashboard/campaign/${campaign._id}/insertion-orders`
                                : `/viewer/campaign/${campaign._id}`}
                              className="text-blue-600 hover:underline font-medium">
                              {campaign.name}
                            </Link>
                            {tableDate && (
                              <div className="text-xs mt-0.5">
                                {hasDaily
                                  ? <span className="text-emerald-600 font-medium">● has entry</span>
                                  : <span className="text-gray-300">○ no entry</span>}
                              </div>
                            )}
                          </td>

                          {visibleColumns.delivery && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${campaign.status==='active'?'bg-green-500':campaign.status==='draft'?'bg-gray-400':'bg-yellow-500'}`} />
                                <span className="text-sm text-gray-700">
                                  <CellVal campaignId={campaign._id} fieldKey="delivery" defaultVal={campaign.delivery} dailyDataMap={dailyDataMap} tableDate={tableDate} />
                                </span>
                              </div>
                            </td>
                          )}
                          {visibleColumns.actions && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <CellVal campaignId={campaign._id} fieldKey="actions" defaultVal={campaign.actions} dailyDataMap={dailyDataMap} tableDate={tableDate} />
                            </td>
                          )}
                          {visibleColumns.results && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <CellVal campaignId={campaign._id} fieldKey="results" defaultVal={campaign.results} dailyDataMap={dailyDataMap} tableDate={tableDate} />
                            </td>
                          )}
                          {visibleColumns.costPerResult && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <CellVal campaignId={campaign._id} fieldKey="costPerResult" defaultVal={campaign.costPerResult} dailyDataMap={dailyDataMap} tableDate={tableDate} />
                            </td>
                          )}
                          {visibleColumns.budget && (
                            <td className="px-4 py-3 text-sm text-gray-700 font-medium border border-gray-200">
                              <CellVal campaignId={campaign._id} fieldKey="budget" defaultVal={campaign.budget} dailyDataMap={dailyDataMap} tableDate={tableDate} />
                            </td>
                          )}
                          {visibleColumns.amountSpent && (
                            <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                              <CellVal campaignId={campaign._id} fieldKey="amountSpent" defaultVal={campaign.amountSpent} dailyDataMap={dailyDataMap} tableDate={tableDate} />
                            </td>
                          )}
                          {visibleColumns.impressions && (
                            <td className="px-4 py-3 text-sm text-gray-600 border border-gray-200">
                              <CellVal campaignId={campaign._id} fieldKey="impressions" defaultVal={campaign.impressions} dailyDataMap={dailyDataMap} tableDate={tableDate} />
                            </td>
                          )}
                          {visibleColumns.reach && (
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <CellVal campaignId={campaign._id} fieldKey="reach" defaultVal={campaign.reach} dailyDataMap={dailyDataMap} tableDate={tableDate} />
                            </td>
                          )}
                          {visibleColumns.ends && (
                            <td className="px-4 py-3 text-sm text-gray-600">{campaign.endDate}</td>
                          )}

                          {/* Custom fields */}
                          {customFields.map(field =>
                            visibleColumns[`custom_${field.name}`] !== false && (
                              <td key={field._id} className="px-4 py-3 text-sm text-gray-600 border border-gray-200">
                                {(() => {
                                  if (tableDate && dailyDataMap?.[campaign._id]) {
                                    const rec = dailyDataMap[campaign._id];
                                    const v   = getCF(rec.customFields, field.name);
                                    const str = fmtCFVal(v);
                                    if (str) return (
                                      <span className="font-semibold text-blue-700">
                                        {str}
                                        {rec._aggregated && rec.days > 1 && (
                                          <span className="ml-1 text-xs text-violet-400 font-normal">Σ{rec.days}d</span>
                                        )}
                                      </span>
                                    );
                                    return <span className="text-gray-300 italic text-xs">—</span>;
                                  }
                                  const v   = getCF(campaign.customFields, field.name)
                                           ?? getCF(campaign.customFieldsData, field.name);
                                  const str = fmtCFVal(v);
                                  return str
                                    ? <span className="text-gray-800">{str}</span>
                                    : <span className="text-gray-300">—</span>;
                                })()}
                              </td>
                            )
                          )}

                          {/* ★ Daily Entry + Edit/Duplicate/Delete — hidden by default, shown when showRowActions */}
                          {showRowActions ? (
                            <>
                              {userRole === 'admin' && (
                                <td className="px-4 py-3 bg-amber-50/40">
                                  <button
                                    onClick={() => onOpenDailyEntry && onOpenDailyEntry(campaign)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition
                                      bg-white border-amber-300 text-amber-700 hover:bg-amber-50 hover:border-amber-500 whitespace-nowrap">
                                    <CalendarDays size={12} />
                                    Enter Data
                                  </button>
                                </td>
                              )}
                              <td className="px-4 py-3">
                                <div className="flex gap-2">
                                  <button onClick={() => onEdit(campaign)} className="p-1 hover:bg-gray-200 rounded" title="Edit">
                                    <Edit size={16} className="text-gray-600" />
                                  </button>
                                  <button onClick={() => onDuplicate(campaign._id)} className="p-1 hover:bg-gray-200 rounded" title="Duplicate">
                                    <Copy size={16} className="text-gray-600" />
                                  </button>
                                  <button onClick={() => onDelete(campaign._id)} className="p-1 hover:bg-gray-200 rounded" title="Delete">
                                    <Trash2 size={16} className="text-gray-600" />
                                  </button>
                                </div>
                              </td>
                            </>
                          ) : (
                            /* ★ Collapsed state — just the eye button to expand */
                            <td className="px-3 py-3 text-right">
                              <button
                                onClick={() => setShowRowActions(true)}
                                title="Show actions"
                                className="p-1.5 rounded-lg border bg-gray-50 border-gray-200 text-gray-400 hover:text-blue-500 hover:border-blue-300 transition">
                                <Eye size={14} />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600 flex items-center justify-between">
              <span>Results from {campaigns.length} campaigns</span>
              {tableDate && (
                <span className="text-xs text-blue-600 font-medium flex items-center gap-1">
                  <CalendarDays size={12} />
                  {tableDate === tableEndDate
                    ? `${Object.keys(dailyDataMap || {}).length}/${campaigns.length} have entries for ${fmtShort(tableDate)}`
                    : `${Object.keys(dailyDataMap || {}).length}/${campaigns.length} have data · ${fmtShort(tableDate)} → ${fmtShort(tableEndDate)} (summed)`
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