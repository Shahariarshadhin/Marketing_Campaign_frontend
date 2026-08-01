"use client";
import { useEffect, useRef, useState, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
    Plus, Trash2, Edit2, X, Loader2, Check,
    ChevronUp, ChevronDown, Search, Settings2,
    MoreHorizontal, Download, RefreshCw, Filter, Calendar, ChevronLeft, ChevronRight
} from "lucide-react";
import BrandCharts from "@/components/DashboardManagement/Brands/BrandCharts";

const API = process.env.NEXT_PUBLIC_API_URL;

const BRAND_COLORS = [
    '#1a73e8', '#34a853', '#ea4335', '#fbbc04', '#ff6d00',
    '#46bdc6', '#9c27b0', '#00897b', '#e91e63', '#3949ab',
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
function Th({ label, sortKey, sortState, onSort, align = 'left', className = '', colKey, onCommitAllWidths }) {
    const active = sortState.key === sortKey;
    return (
        <th
            data-col-key={colKey}
            onClick={() => onSort(sortKey)}
            className={`relative px-4 py-3 text-xs font-semibold uppercase tracking-wider cursor-pointer select-none whitespace-nowrap overflow-hidden border border-gray-200
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
            {colKey && (
                <div onClick={e => e.stopPropagation()}>
                    <ColResizeHandle colKey={colKey} onCommitAll={onCommitAllWidths} />
                </div>
            )}
        </th>
    );
}

// ─── Column resize handle (DOM-direct, smooth) ─────────────────────────────
// ─── Column resize handle — captures ALL column widths on first drag ───────
function ColResizeHandle({ colKey, min = 4, onCommitAll }) {
    const onMouseDown = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const colEl = document.querySelector(`col[data-col-key="${colKey}"]`);
        const tableEl = colEl ? colEl.closest('table') : null;
        if (!tableEl) return;

        const allCols = Array.from(tableEl.querySelectorAll('col[data-col-key]'));
        const headerCells = tableEl.querySelectorAll('thead tr:last-child > th[data-col-key]');

        // Snapshot every column's CURRENT rendered width — not just the dragged one
        const baseWidths = {};
        headerCells.forEach(th => {
            const k = th.getAttribute('data-col-key');
            if (k) baseWidths[k] = th.getBoundingClientRect().width;
        });

        const startX = e.clientX;
        const startWidth = baseWidths[colKey] || 100;
        let latestWidths = { ...baseWidths };
        let rafId = null;

        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const applyWidths = () => {
            allCols.forEach(c => {
                const k = c.getAttribute('data-col-key');
                if (latestWidths[k] != null) c.style.width = `${latestWidths[k]}px`;
            });
            const total = Object.values(latestWidths).reduce((s, w) => s + w, 0);
            tableEl.style.width = `${total}px`;
            rafId = null;
        };

        const onMove = (ev) => {
            const delta = ev.clientX - startX;
            const newWidth = Math.max(min, startWidth + delta);
            latestWidths = { ...latestWidths, [colKey]: newWidth };
            if (rafId == null) rafId = requestAnimationFrame(applyWidths);
        };

        const onUp = () => {
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            if (rafId) cancelAnimationFrame(rafId);
            onCommitAll(latestWidths); // ← commits ALL columns, not just this one
        };

        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
    };

    return (
        <div
            onMouseDown={onMouseDown}
            className="absolute top-0 right-0 translate-x-1/2 w-2 h-full cursor-col-resize z-20 hover:bg-blue-400/70 active:bg-blue-500/80"
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

// ─── Brand Create/Edit Modal ───────────────────────────────────────────────────
function BrandModal({ brand, onSave, onClose, saving }) {
    const [name, setName] = useState(brand?.name || '');
    const [desc, setDesc] = useState(brand?.description || '');
    const [color, setColor] = useState(brand?.color || '#1a73e8');
    const [logo, setLogo] = useState(null);
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
                            className="w-14 h-14 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center cursor-pointer hover:border-blue-400 transition overflow-hidden shrink-0"
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
    const isAdmin = user?.role === 'admin';
    const authFetch = useAuthFetch();
    const router = useRouter();
    const redirected = useRef(false);

    const [brands, setBrands] = useState([]);
    const [fetching, setFetching] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editBrand, setEditBrand] = useState(null);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState(new Set());
    const [toast, setToast] = useState(null);
    const [sort, setSort] = useState({ key: 'name', dir: 'asc' });
    const tableRef = useRef(null);
    const [colWidths, setColWidths] = useState({});
    const [rowHeights, setRowHeights] = useState({});
    const getColWidth = (key, fallback) => colWidths[key] ?? fallback;
    const commitAllColWidths = (widths) => setColWidths(widths); // full overwrite, not merge
    const getRowHeight = (id) => rowHeights[id] ?? 56;
    const setRowHeight = (id, h) => setRowHeights(prev => ({ ...prev, [id]: h }));
    const columnDefs = useMemo(() => {
        const defs = [
            { key: 'checkbox', width: 44, resizable: false },
            { key: 'statusDot', width: 36 },
            { key: 'name', width: 220 },
            { key: 'total', width: 90 },
            { key: 'impressions', width: 120 },
            { key: 'budget', width: 130 },
            { key: 'spent', width: 130 },
            { key: 'results', width: 100 },
        ];
        if (isAdmin) defs.push({ key: 'rowActions', width: 70, resizable: false });
        return defs;
    }, [isAdmin]);

    const totalTableWidth = useMemo(
        () => columnDefs.reduce((sum, c) => sum + (colWidths[c.key] ?? c.width), 0),
        [columnDefs, colWidths]
    );

    const hasCustomWidths = Object.keys(colWidths).length > 0;

    // Date filter for charts
    const [chartDate, setChartDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [calOpen, setCalOpen] = useState(false);
    const [calView, setCalView] = useState(() => {
        const n = new Date(); return { year: n.getFullYear(), month: n.getMonth() };
    });

    useEffect(() => {
        if (loading || redirected.current) return;
        if (!user) { redirected.current = true; router.replace('/login'); }
    }, [user, loading]);

    useEffect(() => { if (user) fetchBrands(); }, [user]);

    const fetchBrands = async () => {
        setFetching(true);
        try {
            const res = await authFetch(`${API}/mother-brands`);
            const d = await res.json();
            if (d.success) setBrands(d.data);
        } finally { setFetching(false); }
    };

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
    };

    const handleSave = async (fd) => {
        setSaving(true);
        try {
            const token = localStorage.getItem('token');
            const url = editBrand ? `${API}/mother-brands/${editBrand._id}` : `${API}/mother-brands`;
            const method = editBrand ? 'PUT' : 'POST';
            const res = await fetch(url, { method, headers: { Authorization: `Bearer ${token}` }, body: fd });
            const d = await res.json();
            if (d.success) { showToast(editBrand ? 'Brand updated' : 'Brand created'); setShowModal(false); setEditBrand(null); fetchBrands(); }
            else showToast(d.message, 'error');
        } finally { setSaving(false); }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this brand?')) return;
        const res = await authFetch(`${API}/mother-brands/${id}`, { method: 'DELETE' });
        const d = await res.json();
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
                case 'name': av = a.name; bv = b.name; break;
                case 'total': av = a.stats?.total || 0; bv = b.stats?.total || 0; break;
                case 'active': av = a.stats?.active || 0; bv = b.stats?.active || 0; break;
                case 'impressions': av = parseNum(a.stats?.totalImpressions); bv = parseNum(b.stats?.totalImpressions); break;
                case 'budget': av = parseNum(a.stats?.totalBudget); bv = parseNum(b.stats?.totalBudget); break;
                case 'spent': av = parseNum(a.stats?.totalSpent); bv = parseNum(b.stats?.totalSpent); break;
                case 'results': av = parseNum(a.stats?.totalResults); bv = parseNum(b.stats?.totalResults); break;
                default: av = a.name; bv = b.name;
            }
            if (typeof av === 'string') return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
            return sort.dir === 'asc' ? av - bv : bv - av;
        });
    }, [brands, search, sort]);

    const allSelected = sorted.length > 0 && selected.size === sorted.length;
    const someSelected = selected.size > 0 && !allSelected;
    const toggleAll = () => setSelected(allSelected ? new Set() : new Set(sorted.map(b => b._id)));
    const toggleOne = (id) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

    const totalCampaigns = brands.reduce((s, b) => s + (b.stats?.total || 0), 0);
    const totalActive = brands.reduce((s, b) => s + (b.stats?.active || 0), 0);
    // Filter brand stats by chartDate — recompute from campaigns if available,
    // otherwise pass raw brands (backend doesn't expose per-day stats breakdown here)
    // We pass chartDate down to BrandCharts which can show "as of" label


    if (loading || fetching) return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-blue-600" size={28} />
        </div>
    );

    return (
        <div className="min-h-screen bg-white font-sans pb-20">
            {toast && (
                <div className={`fixed top-4 right-4 z-50 px-4 py-2.5 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-gray-900 text-white'}`}>
                    {toast.msg}
                </div>
            )}


            <div className="bg-slate-50 flex items-center px-8 py-4">
                <h2 className="text-2xl font-medium text-gray-700">Advertiser</h2>
                <h2 className="text-lg font-medium text-gray-900 mx-4 px-4 bg-gray-100 rounded-md">Limited Access</h2>
            </div>


           <BrandCharts brands={sorted} chartDate={chartDate} />

            <div className="flex items-center gap-4 px-4">
                <div className="flex items-center gap-2">

                    {isAdmin && (
                        <button onClick={() => { setEditBrand(null); setShowModal(true); }}
                            className="flex items-center gap-1.5 bg-blue-600 text-white px-6 py-4 rounded-md text-sm  hover:bg-blue-700 transition">
                            {/* <Plus size={14} />  */}
                            Create advertise
                        </button>
                    )}

                    <button onClick={fetchBrands}
                        className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition">
                        <RefreshCw size={15} />
                    </button>
                </div>

                <div>
                    {brands.length > 0 && (
                        <div className="px-6 py-4 border-b border-gray-100">
                            {/* Date picker row */}
                            <div className="flex items-center gap-3 ">
                                {/* <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            <Calendar size={13} className="text-blue-500" />
                            Chart Date
                        </div> */}
                                <div className="relative">
                                    <button
                                        onClick={() => setCalOpen(o => !o)}
                                        className="flex items-center gap-2 px-6 py-4 bg-white border border-gray-200 rounded-md text-sm font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition shadow-sm"
                                    >
                                        <Calendar size={13} className="text-blue-500" />
                                        {new Date(chartDate + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                                    </button>

                                    {calOpen && (
                                        <div className="absolute top-full left-0 mt-2 z-50 bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 w-72" style={{ minWidth: '280px' }}>
                                            {/* Year + Month navigation */}
                                            <div className="flex items-center justify-between mb-3">
                                                <button onClick={() => setCalView(v => {
                                                    const d = new Date(v.year, v.month - 1);
                                                    return { year: d.getFullYear(), month: d.getMonth() };
                                                })} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                                                    <ChevronLeft size={15} className="text-gray-600" />
                                                </button>
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={calView.month}
                                                        onChange={e => setCalView(v => ({ ...v, month: Number(e.target.value) }))}
                                                        className="text-sm font-semibold text-gray-800 border-0 focus:outline-none bg-transparent cursor-pointer"
                                                    >
                                                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m, i) => (
                                                            <option key={i} value={i}>{m}</option>
                                                        ))}
                                                    </select>
                                                    <select
                                                        value={calView.year}
                                                        onChange={e => setCalView(v => ({ ...v, year: Number(e.target.value) }))}
                                                        className="text-sm font-semibold text-gray-800 border-0 focus:outline-none bg-transparent cursor-pointer"
                                                    >
                                                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i).map(y => (
                                                            <option key={y} value={y}>{y}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                                <button onClick={() => setCalView(v => {
                                                    const d = new Date(v.year, v.month + 1);
                                                    return { year: d.getFullYear(), month: d.getMonth() };
                                                })} className="p-1.5 hover:bg-gray-100 rounded-lg transition">
                                                    <ChevronRight size={15} className="text-gray-600" />
                                                </button>
                                            </div>

                                            {/* Day labels */}
                                            <div className="grid grid-cols-7 mb-1">
                                                {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                                                    <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
                                                ))}
                                            </div>

                                            {/* Day grid */}
                                            <div className="grid grid-cols-7 gap-y-0.5">
                                                {(() => {
                                                    const firstDay = new Date(calView.year, calView.month, 1).getDay();
                                                    const daysInMonth = new Date(calView.year, calView.month + 1, 0).getDate();
                                                    const today = new Date().toISOString().split('T')[0];
                                                    const cells = [];
                                                    for (let i = 0; i < firstDay; i++) cells.push(<div key={'e' + i} />);
                                                    for (let d = 1; d <= daysInMonth; d++) {
                                                        const iso = `${calView.year}-${String(calView.month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                                                        const isSelected = iso === chartDate;
                                                        const isToday = iso === today;
                                                        cells.push(
                                                            <button key={d}
                                                                onClick={() => { setChartDate(iso); setCalOpen(false); }}
                                                                className={`w-full aspect-square flex items-center justify-center text-xs rounded-lg font-medium transition
                              ${isSelected ? 'bg-blue-600 text-white shadow-md' :
                                                                        isToday ? 'bg-blue-50 text-blue-600 font-bold' :
                                                                            'text-gray-700 hover:bg-gray-100'}`}
                                                            >{d}</button>
                                                        );
                                                    }
                                                    return cells;
                                                })()}
                                            </div>

                                            {/* Quick shortcuts */}
                                            <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
                                                {['Today', 'Yesterday'].map(label => {
                                                    const d = new Date();
                                                    if (label === 'Yesterday') d.setDate(d.getDate() - 1);
                                                    const iso = d.toISOString().split('T')[0];
                                                    return (
                                                        <button key={label}
                                                            onClick={() => {
                                                                setChartDate(iso); setCalOpen(false);
                                                                setCalView({ year: d.getFullYear(), month: d.getMonth() });
                                                            }}
                                                            className="flex-1 text-xs py-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition border border-gray-200">
                                                            {label}
                                                        </button>
                                                    );
                                                })}
                                                {[7, 30, 90].map(n => (
                                                    <button key={n}
                                                        onClick={() => {
                                                            const d = new Date(); d.setDate(d.getDate() - n);
                                                            const iso = d.toISOString().split('T')[0];
                                                            setChartDate(iso);
                                                            setCalView({ year: d.getFullYear(), month: d.getMonth() });
                                                            setCalOpen(false);
                                                        }}
                                                        className="flex-1 text-xs py-1.5 bg-gray-50 hover:bg-blue-50 hover:text-blue-600 rounded-lg font-medium transition border border-gray-200">
                                                        -{n}d
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                {/* Close cal on outside click */}
                                {calOpen && <div className="fixed inset-0 z-40" onClick={() => setCalOpen(false)} />}
                            </div>


                        </div>
                    )}
                </div>

            </div>
            {/* ── Top toolbar ─────────────────────────────────────────────────────── */}
            <div className="border-b border-gray-200 px-6 py-3 flex items-center justify-between gap-4 sticky top-0 bg-white z-20">
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search brands…"
                            className="pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-52 text-black"
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

            {/* ── Charts + Date Picker ─────────────────────────────────────────── */}


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
                    <table
                        ref={tableRef}
                        className="border-collapse text-sm"
                        style={{
                            tableLayout: 'fixed',
                            width: hasCustomWidths ? totalTableWidth : '100%',
                            minWidth: totalTableWidth,
                        }}
                    >
                        <colgroup>
                            {columnDefs.map(c => (
                                <col key={c.key} data-col-key={c.key} style={{ width: getColWidth(c.key, c.width) }} />
                            ))}
                        </colgroup>

                        {/* Column group headers — like DV360 */}
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th colSpan={3} className="px-4 py-2 border border-gray-200" />
                                <th colSpan={1} className="px-4 py-2 text-center border border-gray-200">
                                    <span className="text-xs text-gray-400 font-medium border-b border-dashed border-gray-300 pb-0.5">
                                        Campaigns
                                    </span>
                                </th>
                                <th colSpan={3} className="px-4 py-2 text-center border border-gray-200">
                                    <span className="text-xs text-gray-400 font-medium border-b border-dashed border-gray-300 pb-0.5">
                                        Performance
                                    </span>
                                </th>
                                <th className="px-4 py-2 border border-gray-200" />
                                {isAdmin && <th className="px-4 py-2 border border-gray-200" />}
                            </tr>
                            <tr className="border-b border-gray-200 bg-gray-50/60">
                                {/* Checkbox */}
                                <th data-col-key="checkbox" className="relative px-4 py-3 border border-gray-200 overflow-hidden">
                                    <input type="checkbox" checked={allSelected} ref={el => el && (el.indeterminate = someSelected)}
                                        onChange={toggleAll}
                                        className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer" />
                                </th>
                                {/* Status dot col */}
                                <th data-col-key="statusDot" className="relative px-2 py-3 border border-gray-200 overflow-hidden">
                                    <ColResizeHandle colKey="statusDot" onCommitAll={commitAllColWidths} />
                                </th>
                                {/* Name */}
                                <Th label="Name" sortKey="name" sortState={sort} onSort={handleSort}
                                    colKey="name" onCommitAllWidths={commitAllColWidths} />
                                {/* Total */}
                                <Th label="Total" sortKey="total" sortState={sort} onSort={handleSort} align="right"
                                    colKey="total" onCommitAllWidths={commitAllColWidths} />
                                {/* Impressions */}
                                <Th label="Impressions" sortKey="impressions" sortState={sort} onSort={handleSort} align="right"
                                    colKey="impressions" onCommitAllWidths={commitAllColWidths} />
                                {/* Budget */}
                                <Th label="Current Budget" sortKey="budget" sortState={sort} onSort={handleSort} align="right"
                                    colKey="budget" onCommitAllWidths={commitAllColWidths} />
                                {/* Spent */}
                                <Th label="Amount Spent" sortKey="spent" sortState={sort} onSort={handleSort} align="right"
                                    colKey="spent" onCommitAllWidths={commitAllColWidths} />
                                {/* Results */}
                                <Th label="Results" sortKey="results" sortState={sort} onSort={handleSort} align="right"
                                    colKey="results" onCommitAllWidths={commitAllColWidths} />
                                {/* Actions */}
                                {isAdmin && <th data-col-key="rowActions" className="px-4 py-3 border border-gray-200" />}
                            </tr>
                        </thead>

                        <tbody className="divide-y divide-gray-100 border-b border-gray-200">
                            {sorted.map((brand, idx) => {
                                const s = brand.stats || {};
                                const isSel = selected.has(brand._id);
                                const hasActive = (s.active || 0) > 0;
                                const rh = getRowHeight(brand._id);

                                return (
                                    <tr key={brand._id}
                                        data-row-id={brand._id}
                                        className={`group transition-colors duration-100
                      ${isSel ? 'bg-blue-50/60' : 'hover:bg-gray-50/70'}`}
                                        style={{ height: rh, animationDelay: `${idx * 30}ms` }}>

                                        {/* Checkbox */}
                                        <td className="relative border border-gray-200 p-0">
                                            <ClipCell height={rh} className="px-4">
                                                <input type="checkbox" checked={isSel} onChange={() => toggleOne(brand._id)}
                                                    className="w-3.5 h-3.5 rounded border-gray-300 text-blue-600 cursor-pointer" />
                                            </ClipCell>
                                            <RowResizeHandle
                                                rowId={brand._id}
                                                currentHeight={rh}
                                                onCommit={h => setRowHeight(brand._id, h)}
                                            />
                                        </td>

                                        {/* Status dot */}
                                        <td className="border border-gray-200 p-0">
                                            <ClipCell height={rh} className="px-2 justify-center">
                                                <span className={`block w-2.5 h-2.5 rounded-full ${hasActive ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                            </ClipCell>
                                        </td>

                                        {/* Brand name */}
                                        <td className="border border-gray-200 p-0">
                                            <ClipCell height={rh} className="px-4">
                                                <div className="flex items-center gap-2.5 min-w-0 w-full">
                                                    <div className="min-w-0">
                                                        <Link href={`/dashboard/brands/${brand._id}`}
                                                            className="text-blue-600 hover:underline font-medium leading-none truncate block">
                                                            {brand.name}
                                                        </Link>
                                                        {brand.description && (
                                                            <p className="text-xs text-gray-400 mt-0.5 leading-none truncate">
                                                                {brand.description}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </ClipCell>
                                        </td>

                                        {/* Total campaigns */}
                                        <td className="border border-gray-200 p-0 text-right tabular-nums text-gray-700 font-medium">
                                            <ClipCell height={rh} className="px-4 justify-end">
                                                {s.total || 0}
                                            </ClipCell>
                                        </td>

                                        {/* Impressions */}
                                        <td className="border border-gray-200 p-0 text-right tabular-nums text-gray-600">
                                            <ClipCell height={rh} className="px-4 justify-end">
                                                {s.totalImpressions && s.totalImpressions !== '—'
                                                    ? s.totalImpressions : <span className="text-gray-300">—</span>}
                                            </ClipCell>
                                        </td>

                                        {/* Budget */}
                                        <td className="border border-gray-200 p-0 text-right tabular-nums text-gray-600">
                                            <ClipCell height={rh} className="px-4 justify-end">
                                                {s.totalBudget && s.totalBudget !== '—'
                                                    ? s.totalBudget : <span className="text-gray-300">—</span>}
                                            </ClipCell>
                                        </td>

                                        {/* Spent */}
                                        <td className="border border-gray-200 p-0 text-right tabular-nums text-gray-600">
                                            <ClipCell height={rh} className="px-4 justify-end">
                                                {s.totalSpent && s.totalSpent !== '—'
                                                    ? s.totalSpent : <span className="text-gray-300">—</span>}
                                            </ClipCell>
                                        </td>

                                        {/* Results */}
                                        <td className="border border-gray-200 p-0 text-right tabular-nums text-gray-600">
                                            <ClipCell height={rh} className="px-4 justify-end">
                                                {s.totalResults && s.totalResults !== '—'
                                                    ? s.totalResults : <span className="text-gray-300">—</span>}
                                            </ClipCell>
                                        </td>

                                        {/* Row actions */}
                                        {isAdmin && (
                                            <td className="border border-gray-200 p-0">
                                                <ClipCell height={rh} className="px-4">
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
                                                </ClipCell>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
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