"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Plus, Trash2, Edit2, X, Loader2, Check,
  ChevronUp, ChevronDown, Search, Settings2,
  MoreHorizontal, Download, RefreshCw, Filter
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

const BRAND_COLORS = [
  '#1a73e8','#34a853','#ea4335','#fbbc04','#ff6d00',
  '#46bdc6','#9c27b0','#00897b','#e91e63','#3949ab',
];

// ─── Tiny sparkline bar (active vs total) ─────────────────────────────────────
function MiniBar({ active, total, color }) {
  const pct = total > 0 ? (active / total) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color || '#1a73e8' }} />
      </div>
      <span className="text-xs tabular-nums text-gray-500">
        {active} / {total}
      </span>
    </div>
  );
}

// ─── Sortable column header ────────────────────────────────────────────────────
function Th({ label, sortKey, sortState, onSort, align = 'left', className = '' }) {
  const active = sortState.key === sortKey;
  return (
    <th
      onClick={() => onSort(sortKey)}
      className={`px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap
        ${align === 'right' ? 'text-right' : 'text-left'}
        ${active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'} ${className}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        <span className="flex flex-col -space-y-1">
          <ChevronUp size={10} className={active && sortState.dir === 'asc' ? 'text-blue-600' : 'text-gray-300'} />
          <ChevronDown size={10} className={active && sortState.dir === 'desc' ? 'text-blue-600' : 'text-gray-300'} />
        </span>
      </span>
    </th>
  );
}

// ─── Brand Create/Edit Modal ───────────────────────────────────────────────────
function BrandModal({ brand, onSave, onClose, saving }) {
  const [name, setName]       = useState(brand?.name || '');
  const [desc, setDesc]       = useState(brand?.description || '');
  const [color, setColor]     = useState(brand?.color || '#1a73e8');
  const [logo, setLogo]       = useState(null);
  const [preview, setPreview] = useState(brand?.logo || '');
  const fileRef = useRef(null);

  const handleFile = (e) => {
    const f = e.target.files[0]; if (!f) return;
    setLogo(f); setPreview(URL.createObjectURL(f));
  };
  const submit = () => {
    if (!name.trim()) return alert('Brand name is required');
    const fd = new FormData();
    fd.append('name', name); fd.append('description', desc); fd.append('color', color);
    if (logo) fd.append('logo', logo);
    onSave(fd);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">{brand ? 'Edit Brand' : 'New Brand'}</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg"><X size={16} /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div onClick={() => fileRef.current?.click()}
              className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-400 transition overflow-hidden flex-shrink-0"
              style={{ background: preview ? 'transparent' : color + '15' }}>
              {preview
                ? <img src={preview} className="w-full h-full object-cover" />
                : <span className="text-xl font-black" style={{ color }}>{name.charAt(0) || '+'}</span>}
            </div>
            <div>
              <button onClick={() => fileRef.current?.click()} className="text-xs text-blue-600 font-medium hover:underline">
                {preview ? 'Change logo' : 'Upload logo'}
              </button>
              <p className="text-xs text-gray-400 mt-0.5">PNG, JPG · max 5MB</p>
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
          </div>
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Brand Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bata"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1.5">Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>
          {/* Color */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-2">Brand Color</label>
            <div className="flex items-center gap-2 flex-wrap">
              {BRAND_COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)}
                  className="w-7 h-7 rounded-full border-2 flex items-center justify-center transition-transform hover:scale-110"
                  style={{ background: c, borderColor: color === c ? '#1e293b' : 'transparent' }}>
                  {color === c && <Check size={12} className="text-white" strokeWidth={3} />}
                </button>
              ))}
              <input type="color" value={color} onChange={e => setColor(e.target.value)}
                className="w-7 h-7 rounded-full cursor-pointer border border-gray-200 overflow-hidden" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 px-6 pb-5">
          <button onClick={submit} disabled={saving}
            className="flex-1 bg-blue-600 text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
            {saving && <Loader2 size={14} className="animate-spin" />}
            {saving ? 'Saving…' : brand ? 'Save' : 'Create Brand'}
          </button>
          <button onClick={onClose} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function BrandsPage() {
  const { user, loading } = useAuth();
  const authFetch = useAuthFetch();
  const router    = useRouter();
  const redirected = useRef(false);

  const [brands, setBrands]         = useState([]);
  const [fetching, setFetching]     = useState(true);
  const [showModal, setShowModal]   = useState(false);
  const [editBrand, setEditBrand]   = useState(null);
  const [saving, setSaving]         = useState(false);
  const [search, setSearch]         = useState('');
  const [selected, setSelected]     = useState(new Set());
  const [toast, setToast]           = useState(null);
  const [sort, setSort]             = useState({ key: 'name', dir: 'asc' });

  useEffect(() => {
    if (loading || redirected.current) return;
    if (!user) { redirected.current = true; router.replace('/login'); }
  }, [user, loading]);

  useEffect(() => { if (user) fetchBrands(); }, [user]);

  const fetchBrands = async () => {
    setFetching(true);
    try {
      const res = await authFetch(`${API}/mother-brands`);
      const d   = await res.json();
      if (d.success) setBrands(d.data);
    } finally { setFetching(false); }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const handleSave = async (fd) => {
    setSaving(true);
    try {
      const token  = localStorage.getItem('token');
      const url    = editBrand ? `${API}/mother-brands/${editBrand._id}` : `${API}/mother-brands`;
      const method = editBrand ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
      const d      = await res.json();
      if (d.success) { showToast(editBrand ? 'Brand updated' : 'Brand created'); setShowModal(false); setEditBrand(null); fetchBrands(); }
      else showToast(d.message, 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this brand?')) return;
    const res = await authFetch(`${API}/mother-brands/${id}`, { method: 'DELETE' });
    const d   = await res.json();
    if (d.success) { setBrands(b => b.filter(x => x._id !== id)); showToast('Brand deleted'); }
    else showToast(d.message, 'error');
  };

  const handleSort = (key) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  const parseNum = (str) => parseFloat(String(str || '0').replace(/[^0-9.-]/g, '')) || 0;

  const sorted = useMemo(() => {
    const f = brands.filter(b => b.name.toLowerCase().includes(search.toLowerCase()));
    return [...f].sort((a, b) => {
      let av, bv;
      switch (sort.key) {
        case 'name':       av = a.name; bv = b.name; break;
        case 'total':      av = a.stats?.total || 0; bv = b.stats?.total || 0; break;
        case 'active':     av = a.stats?.active || 0; bv = b.stats?.active || 0; break;
        case 'impressions':av = parseNum(a.stats?.totalImpressions); bv = parseNum(b.stats?.totalImpressions); break;
        case 'budget':     av = parseNum(a.stats?.totalBudget); bv = parseNum(b.stats?.totalBudget); break;
        case 'spent':      av = parseNum(a.stats?.totalSpent); bv = parseNum(b.stats?.totalSpent); break;
        case 'results':    av = parseNum(a.stats?.totalResults); bv = parseNum(b.stats?.totalResults); break;
        default:           av = a.name; bv = b.name;
      }
      if (typeof av === 'string') return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sort.dir === 'asc' ? av - bv : bv - av;
    });
  }, [brands, search, sort]);

  const allSelected  = sorted.length > 0 && selected.size === sorted.length;
  const someSelected = selected.size > 0 && !allSelected;
  const toggleAll    = () => setSelected(allSelected ? new Set() : new Set(sorted.map(b => b._id)));
  const toggleOne    = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const totalCampaigns = brands.reduce((s, b) => s + (b.stats?.total || 0), 0);
  const totalActive    = brands.reduce((s, b) => s + (b.stats?.active || 0), 0);
  const isAdmin = user?.role === 'admin';

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <Loader2 className="animate-spin text-blue-600" size={28} />
    </div>
  );

  return (
    <div className="min-h-screen bg-white font-sans">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* ── Top toolbar ─────────────────────────────────────────────────────── */}
      <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 sticky top-0 bg-white z-20">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search brands…"
              className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52"
            />
          </div>

          {/* Global summary pills */}
          <div className="hidden sm:flex items-center gap-2 text-xs text-gray-500">
            <span className="px-2.5 py-1 bg-gray-100 rounded-full">
              <strong className="text-gray-800">{brands.length}</strong> brands
            </span>
            <span className="px-2.5 py-1 bg-gray-100 rounded-full">
              <strong className="text-gray-800">{totalCampaigns}</strong> campaigns
            </span>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full">
              <strong>{totalActive}</strong> active
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button onClick={fetchBrands}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
            <RefreshCw size={15} />
          </button>
          {isAdmin && (
            <button onClick={() => { setEditBrand(null); setShowModal(true); }}
              className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-700 transition">
              <Plus size={14} /> New Brand
            </button>
          )}
        </div>
      </div>

      {/* ── Bulk selection bar ───────────────────────────────────────────────── */}
      {selected.size > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-2 flex items-center gap-4 text-sm">
          <span className="text-blue-700 font-medium">{selected.size} selected</span>
          <button className="text-blue-600 hover:underline text-xs">Export</button>
          {isAdmin && (
            <button className="text-red-500 hover:underline text-xs"
              onClick={() => { if (confirm('Delete selected brands?')) selected.forEach(id => handleDelete(id)); }}>
              Delete
            </button>
          )}
          <button onClick={() => setSelected(new Set())} className="ml-auto text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Table ───────────────────────────────────────────────────────────── */}
      {sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Search size={20} className="text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-500">
            {search ? 'No brands match your search' : 'No brands yet'}
          </p>
          {!search && isAdmin && (
            <button onClick={() => setShowModal(true)}
              className="mt-4 text-sm text-blue-600 hover:underline font-medium">
              Create your first brand →
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            {/* Column group headers — like DV360 */}
            <thead>
              <tr className="border-b border-gray-100">
                <th colSpan={3} className="px-4 py-2" />
                <th colSpan={2} className="px-4 py-2 text-center">
                  <span className="text-xs text-gray-400 font-medium border-b border-dashed border-gray-300 pb-0.5">
                    Campaigns
                  </span>
                </th>
                <th colSpan={3} className="px-4 py-2 text-center">
                  <span className="text-xs text-gray-400 font-medium border-b border-dashed border-gray-300 pb-0.5">
                    Performance
                  </span>
                </th>
                <th className="px-4 py-2" />
              </tr>
              <tr className="border-b border-gray-200 bg-gray-50/60">
                {/* Checkbox */}
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" checked={allSelected} ref={el => el && (el.indeterminate = someSelected)}
                    onChange={toggleAll}
                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer" />
                </th>
                {/* Status dot col */}
                <th className="px-2 py-3 w-8" />
                {/* Name */}
                <Th label="Name" sortKey="name" sortState={sort} onSort={handleSort} className="min-w-[180px]" />
                {/* Total */}
                <Th label="Total" sortKey="total" sortState={sort} onSort={handleSort} align="right" />
                {/* Active / Inactive */}
                <Th label="Active / Inactive" sortKey="active" sortState={sort} onSort={handleSort} />
                {/* Impressions */}
                <Th label="Impressions" sortKey="impressions" sortState={sort} onSort={handleSort} align="right" />
                {/* Budget */}
                <Th label="Current Budget" sortKey="budget" sortState={sort} onSort={handleSort} align="right" />
                {/* Spent */}
                <Th label="Amount Spent" sortKey="spent" sortState={sort} onSort={handleSort} align="right" />
                {/* Results */}
                <Th label="Results" sortKey="results" sortState={sort} onSort={handleSort} align="right" />
                {/* Actions */}
                {isAdmin && <th className="px-4 py-3 w-10" />}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {sorted.map((brand, idx) => {
                const s        = brand.stats || {};
                const isSel    = selected.has(brand._id);
                const hasActive = (s.active || 0) > 0;

                return (
                  <tr key={brand._id}
                    className={`group transition-colors duration-100
                      ${isSel ? 'bg-blue-50/60' : 'hover:bg-gray-50/70'}`}
                    style={{ animationDelay: `${idx * 30}ms` }}>

                    {/* Checkbox */}
                    <td className="px-4 py-3.5">
                      <input type="checkbox" checked={isSel} onChange={() => toggleOne(brand._id)}
                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer" />
                    </td>

                    {/* Status dot */}
                    <td className="px-2 py-3.5">
                      <span className={`block w-2.5 h-2.5 rounded-full mx-auto ${hasActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                    </td>

                    {/* Brand name */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        {/* Logo or initial */}
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-black flex-shrink-0 overflow-hidden shadow-sm"
                          style={{ background: brand.logo ? 'transparent' : brand.color || '#1a73e8' }}>
                          {brand.logo
                            ? <img src={brand.logo} className="w-full h-full object-cover" />
                            : brand.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <Link href={`/dashboard/brands/${brand._id}`}
                            className="text-blue-600 hover:underline font-medium leading-none">
                            {brand.name}
                          </Link>
                          {brand.description && (
                            <p className="text-xs text-gray-400 mt-0.5 leading-none line-clamp-1 max-w-[200px]">
                              {brand.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Total campaigns */}
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-700 font-medium">
                      {s.total || 0}
                    </td>

                    {/* Active / Inactive bar */}
                    <td className="px-4 py-3.5">
                      <MiniBar active={s.active || 0} total={s.total || 0} color={brand.color} />
                    </td>

                    {/* Impressions */}
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-600">
                      {s.totalImpressions && s.totalImpressions !== '—'
                        ? s.totalImpressions : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Budget */}
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-600">
                      {s.totalBudget && s.totalBudget !== '—'
                        ? s.totalBudget : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Spent */}
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-600">
                      {s.totalSpent && s.totalSpent !== '—'
                        ? s.totalSpent : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Results */}
                    <td className="px-4 py-3.5 text-right tabular-nums text-gray-600">
                      {s.totalResults && s.totalResults !== '—'
                        ? s.totalResults : <span className="text-gray-300">—</span>}
                    </td>

                    {/* Row actions */}
                    {isAdmin && (
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => { setEditBrand(brand); setShowModal(true); }}
                            className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition">
                            <Edit2 size={13} />
                          </button>
                          <button onClick={() => handleDelete(brand._id)}
                            className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>

            {/* Footer totals row */}
            {sorted.length > 1 && (
              <tfoot>
                <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                  <td colSpan={3} className="px-4 py-3 text-xs font-bold text-gray-500 uppercase tracking-wide">
                    Total · {sorted.length} brands
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs font-bold text-gray-700">
                    {sorted.reduce((s, b) => s + (b.stats?.total || 0), 0)}
                  </td>
                  <td className="px-4 py-3">
                    <MiniBar
                      active={sorted.reduce((s, b) => s + (b.stats?.active || 0), 0)}
                      total={sorted.reduce((s, b) => s + (b.stats?.total || 0), 0)}
                      color="#1a73e8"
                    />
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums text-xs font-bold text-gray-700" colSpan={4} />
                  {isAdmin && <td />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}

      {showModal && (
        <BrandModal brand={editBrand}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditBrand(null); }}
          saving={saving} />
      )}
    </div>
  );
}