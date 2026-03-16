"use client";
import { useState, useMemo } from "react";
import {
  ArrowLeft, Plus, Trash2, ChevronUp, ChevronDown,
  Search, X, Check
} from "lucide-react";

// ─── Category definitions ─────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: "recommended",
    label: "Recommended columns",
    fields: ["Conv. rate", "Conversions", "Cost / conv."],
  },
  {
    id: "performance",
    label: "Performance",
    fields: [
      "Clicks", "Cost", "Impr.", "All video ad seq. impr.",
      "CTR", "Interactions", "Interaction rate", "Engagements",
      "Engagement rate", "Avg. CPC", "Avg. cost", "Avg. CPE",
      "Avg. CPM", "YouTube public views", "TrueView view rate: In-stream, In-feed, Shorts", "Avg. watch time",
      "Avg. watch time / impr.", "Video played to: 25%, 50%, 75%, 100%", "Impr. (co-viewed)",
    ],
  },
  {
    id: "viewability",
    label: "Viewability",
    fields: [
      "Viewable impr.", "Non-viewable impr.", "Measurable impr.", "Non-measurable impr.",
      "Measurable cost", "Measurable rate", "Avg. viewable CPM", "Viewable CTR",
      "Viewable impr. distrib.", "Non-viewable impr. distrib.", "Non-measurable impr. distrib.", "Viewable rate",
    ],
  },
  {
    id: "conversions",
    label: "Conversions",
    fields: [
      "Conversions", "Cost / conv.", "Conv. rate", "Conv. value",
      "Conv. value / cost", "Conv. value / click", "Value / conv.", "Value adjustment",
      "New customer lifetime value", "Win-back customer lifetime value",
      "Conversions (by conv. time)", "Conv. value (by conv. time)", "Value / conv. (by conv. time)",
      "All conv.", "Cost / all conv.", "All conv. rate", "All conv. value",
      "All conv. value / cost", "All conv. value / click", "Value / all conv.", "All value adjustment",
      "All new customer lifetime value", "All win-back customer lifetime value",
      "All conv. (by conv. time)", "All conv. value (by conv. time)", "Value / all conv. (by conv. time)",
      "Cross-device conv.", "Cross-device conv. value",
      "Cross-device conv. (by conv. time)", "Cross-device conv. value (by conv. time)",
      "View-through conv.", "New customers", "Win-back customers", "Purchase conversions",
    ],
  },
  {
    id: "attribution",
    label: "Attribution",
    fields: [
      "Conversions (current model)", "Cost / conv. (current model)",
      "Conv. rate (current model)", "Conv. value (current model)",
      "Conv. value / click (current model)", "Conv. rate / cost (current model)",
      "Value / conv. (current model)", "Conversions (current model, by conv. time)",
      "Value (current model, by conv. time)", "Conv. value (current model, by conv. time)",
    ],
  },
  {
    id: "attributes",
    label: "Attributes",
    fields: [
      "Campaign", "Campaign ID", "Campaign type", "Campaign subtype",
      "Ad group ID", "Ad group type", "Final URL suffix", "Tracking template",
      "Max. CPM", "Bid strategy", "Bid strategy type", "Active bid adj",
      "Ad rotation", "Custom parameter", "Brand Inclusions", "Locations of interest",
      "Commission", "Label", "Campaign group", "Optimized targeting",
    ],
  },
  {
    id: "competitive",
    label: "Competitive metrics",
    fields: ["Display impr. share", "Display lost IS (rank)"],
  },
  {
    id: "youtube",
    label: "YouTube Earned actions",
    fields: [
      "Earned likes", "Earned playlist additions",
      "Earned shares", "Earned subscribers", "Earned views",
    ],
  },
  {
    id: "reach",
    label: "Reach metrics",
    fields: ["Avg. impr. freq. / user", "Unique users"],
  },
];

const FIELD_TYPES = ["text", "number", "email", "date", "textarea", "select", "checkbox", "url"];

// ─── Single collapsible category section ─────────────────────────────────────
function CategorySection({ category, selectedFields, onToggle, existingNames }) {
  const [open, setOpen] = useState(category.id === "recommended");

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-6 py-3.5 hover:bg-gray-50 transition text-left">
        <span className="text-sm font-semibold text-gray-800">{category.label}</span>
        {open
          ? <ChevronUp size={16} className="text-gray-400 flex-shrink-0" />
          : <ChevronDown size={16} className="text-gray-400 flex-shrink-0" />}
      </button>

      {open && (
        <div className="px-6 pb-5">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-2.5">
            {category.fields.map(field => {
              const key        = field.toLowerCase().replace(/[^a-z0-9]/g, '_');
              const isSelected = selectedFields.has(field);
              const alreadyIn  = existingNames.has(key);
              return (
                <label key={field}
                  className={`flex items-start gap-2 cursor-pointer group ${alreadyIn ? 'opacity-40 cursor-not-allowed' : ''}`}>
                  <input type="checkbox"
                    checked={isSelected || alreadyIn}
                    disabled={alreadyIn}
                    onChange={() => !alreadyIn && onToggle(field)}
                    className="mt-0.5 w-4 h-4 flex-shrink-0 rounded border-gray-300 accent-blue-600" />
                  <span className="text-xs text-gray-700 leading-relaxed">
                    {field}
                    {alreadyIn && <span className="text-gray-400 ml-1">(added)</span>}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main component — keeps same props as original ManageFields ───────────────
export default function ManageFields({ customFields, onAddField, onDeleteField, onBack }) {
  const [view, setView]         = useState("list"); // "list" | "add-category" | "add-custom"

  // Category selection state
  const [selectedFields, setSelectedFields] = useState(new Set());
  const [search, setSearch]                 = useState("");
  const [saving, setSaving]                 = useState(false);

  // Custom field form state (mirrors original)
  const [newField, setNewField] = useState({
    name: "", label: "", type: "text", category: "",
    required: false, placeholder: "", description: "", options: [],
  });
  const [formError, setFormError] = useState("");

  // Derived
  const existingNames = useMemo(() =>
    new Set((customFields || []).map(f => f.name)), [customFields]);

  const toggleField = (field) =>
    setSelectedFields(s => { const n = new Set(s); n.has(field) ? n.delete(field) : n.add(field); return n; });

  const filteredCategories = useMemo(() => {
    if (!search.trim()) return CATEGORIES;
    const q = search.toLowerCase();
    return CATEGORIES.map(cat => ({
      ...cat,
      fields: cat.fields.filter(f => f.toLowerCase().includes(q)),
    })).filter(cat => cat.fields.length > 0);
  }, [search]);

  // ── Save selected category fields ─────────────────────────────────────────
  const handleSaveSelected = async () => {
    if (!selectedFields.size) return;
    setSaving(true);
    for (const field of selectedFields) {
      const name = field.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (existingNames.has(name)) continue;
      const catLabel = CATEGORIES.find(c => c.fields.includes(field))?.label || "";
      await onAddField({ name, label: field, type: "text", category: catLabel });
    }
    setSaving(false);
    setSelectedFields(new Set());
    setSearch("");
    setView("list");
  };

  // ── Save custom field (mirrors original handleAddField) ───────────────────
  const handleSaveCustom = async () => {
    setFormError("");
    if (!newField.name || !newField.label) {
      setFormError("Field name and label are required.");
      return;
    }
    if (existingNames.has(newField.name)) {
      setFormError("A field with this name already exists.");
      return;
    }
    setSaving(true);
    await onAddField(newField);
    setSaving(false);
    setNewField({ name: "", label: "", type: "text", category: "", required: false, placeholder: "", description: "", options: [] });
    setView("list");
  };

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewField(prev => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const inp  = "w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black text-sm";
  const inp2 = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white text-gray-800";
  const lbl  = "block text-xs font-bold text-gray-500 uppercase tracking-wide mb-1.5";

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: LIST
  // ════════════════════════════════════════════════════════════════════════════
  if (view === "list") {
    const grouped = {};
    (customFields || []).forEach(f => {
      const cat = f.category || "Uncategorized";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(f);
    });

    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition">
                  <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <h1 className="text-2xl font-semibold text-gray-800">Manage Custom Fields</h1>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setView("add-category")}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
                  <Plus size={16} /> Add from category
                </button>
                <button onClick={() => setView("add-custom")}
                  className="flex items-center gap-2 bg-white text-gray-700 border border-gray-200 px-4 py-2 rounded-lg hover:bg-gray-50 transition text-sm font-medium">
                  <Plus size={16} /> Custom field
                </button>
              </div>
            </div>
          </div>

          {/* Fields grouped by category */}
          {(customFields || []).length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-12 text-center">
              <p className="text-gray-500 mb-4">No custom fields yet.</p>
              <div className="flex justify-center gap-3">
                <button onClick={() => setView("add-category")}
                  className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition">
                  Add from category
                </button>
                <button onClick={() => setView("add-custom")}
                  className="px-4 py-2 border border-gray-200 text-gray-700 text-sm font-semibold rounded-lg hover:bg-gray-50 transition">
                  Custom field
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(grouped).map(([cat, fields]) => (
                <div key={cat} className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">{cat}</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {fields.map(field => (
                      <div key={field._id}
                        className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="min-w-0">
                          <h4 className="font-semibold text-gray-800 truncate">{field.label}</h4>
                          <p className="text-xs text-gray-500 font-mono truncate">{field.name}</p>
                          <div className="flex gap-1.5 mt-1.5 flex-wrap">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium">{field.type}</span>
                            {field.required && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs font-medium">Required</span>}
                          </div>
                        </div>
                        <button onClick={() => onDeleteField(field._id)}
                          className="ml-3 p-1.5 hover:bg-red-50 rounded-lg text-gray-300 hover:text-red-500 transition flex-shrink-0">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: ADD FROM CATEGORY (Google Ads style)
  // ════════════════════════════════════════════════════════════════════════════
  if (view === "add-category") {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto p-6">

          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm mb-4 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button onClick={() => { setView("list"); setSelectedFields(new Set()); setSearch(""); }}
                className="p-2 hover:bg-gray-100 rounded-full transition">
                <ArrowLeft size={18} className="text-gray-600" />
              </button>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Add columns</h2>
                {selectedFields.size > 0 && (
                  <p className="text-xs text-blue-600 font-medium">{selectedFields.size} selected</p>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setView("list"); setSelectedFields(new Set()); setSearch(""); }}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition">
                Cancel
              </button>
              <button onClick={handleSaveSelected}
                disabled={saving || selectedFields.size === 0}
                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                {saving ? "Saving…" : `Apply${selectedFields.size > 0 ? ` (${selectedFields.size})` : ""}`}
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="bg-white rounded-lg shadow-sm mb-2 px-6 py-3">
            <div className="relative max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search columns…"
                className="w-full pl-9 pr-8 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400" />
              {search && (
                <button onClick={() => setSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={13} />
                </button>
              )}
            </div>
          </div>

          {/* Selected chips */}
          {selectedFields.size > 0 && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-4 py-2 mb-2 flex flex-wrap gap-1.5">
              {[...selectedFields].map(f => (
                <span key={f} className="flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                  {f}
                  <button onClick={() => toggleField(f)} className="hover:text-blue-900 ml-0.5"><X size={10} /></button>
                </span>
              ))}
            </div>
          )}

          {/* Category sections */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {filteredCategories.length === 0 ? (
              <p className="text-sm text-gray-400 italic text-center py-10">No columns match &quot;{search}&quot;</p>
            ) : (
              filteredCategories.map(cat => (
                <CategorySection
                  key={cat.id}
                  category={cat}
                  selectedFields={selectedFields}
                  onToggle={toggleField}
                  existingNames={existingNames}
                />
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════════════════════════
  // VIEW: ADD CUSTOM FIELD (keeps all original fields)
  // ════════════════════════════════════════════════════════════════════════════
  if (view === "add-custom") {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">

          <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
            <div className="flex items-center gap-4">
              <button onClick={() => { setView("list"); setFormError(""); }}
                className="p-2 hover:bg-gray-100 rounded-full transition">
                <ArrowLeft size={20} className="text-gray-600" />
              </button>
              <h1 className="text-2xl font-semibold text-gray-800">Create Custom Field</h1>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 space-y-4">
            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">{formError}</div>
            )}

            {/* Field Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Field Name (Internal) *</label>
              <input type="text" name="name" value={newField.name} onChange={handleFieldChange}
                placeholder="e.g., customer_id"
                className={inp} />
              <p className="text-xs text-gray-500 mt-1">Use lowercase with underscores (no spaces)</p>
            </div>

            {/* Label */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Field Label (Display) *</label>
              <input type="text" name="label" value={newField.label} onChange={handleFieldChange}
                placeholder="e.g., Customer ID"
                className={inp} />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Field Type</label>
              <select name="type" value={newField.type} onChange={handleFieldChange} className={inp}>
                <option value="text">Text</option>
                <option value="number">Number</option>
                <option value="email">Email</option>
                <option value="date">Date</option>
                <option value="textarea">Text Area</option>
                <option value="select">Dropdown</option>
                <option value="checkbox">Checkbox</option>
                <option value="url">URL</option>
              </select>
            </div>

            {/* Options — shown only for select type */}
            {newField.type === "select" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Options (comma separated)</label>
                <input type="text" placeholder="Option 1, Option 2, Option 3"
                  onChange={e => setNewField(prev => ({ ...prev, options: e.target.value.split(',').map(o => o.trim()) }))}
                  className={inp} />
              </div>
            )}

            {/* Category — NEW */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <select name="category" value={newField.category} onChange={handleFieldChange} className={inp}>
                <option value="">— No category —</option>
                {CATEGORIES.filter(c => c.id !== "recommended").map(c => (
                  <option key={c.id} value={c.label}>{c.label}</option>
                ))}
                <option value="Custom">Custom</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Groups this field in the column manager</p>
            </div>

            {/* Placeholder */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder</label>
              <input type="text" name="placeholder" value={newField.placeholder} onChange={handleFieldChange}
                placeholder="Enter placeholder text" className={inp} />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
              <textarea name="description" value={newField.description} onChange={handleFieldChange}
                placeholder="Field description (optional)" rows={2}
                className={inp} />
            </div>

            {/* Required */}
            <div className="flex items-center gap-2">
              <input type="checkbox" name="required" checked={newField.required} onChange={handleFieldChange}
                className="rounded w-4 h-4 accent-blue-600" />
              <label className="text-sm text-gray-700">Required field</label>
            </div>

            <button onClick={handleSaveCustom} disabled={saving}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50">
              <Plus size={18} />
              {saving ? "Creating…" : "Create Field"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}