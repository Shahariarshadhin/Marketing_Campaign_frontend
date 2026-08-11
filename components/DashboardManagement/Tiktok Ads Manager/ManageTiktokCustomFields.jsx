"use client";
import { useState } from 'react';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';

const CATEGORIES = ['Performance', 'Attribution', 'Audience', 'Creative', 'Custom'];

export default function ManageTiktokCustomFields({ customFields, onAddField, onDeleteField, onBack }) {
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [newField, setNewField] = useState({
    name: '', label: '', type: 'text', category: '',
    required: false, placeholder: '', description: '', options: [],
  });

  const existingNames = new Set((customFields || []).map(f => f.name));

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewField(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSave = async () => {
    setFormError('');
    if (!newField.name || !newField.label) {
      setFormError('Field name and label are required.');
      return;
    }
    if (existingNames.has(newField.name)) {
      setFormError('A field with this name already exists.');
      return;
    }
    setSaving(true);
    await onAddField(newField);
    setSaving(false);
    setNewField({ name: '', label: '', type: 'text', category: '', required: false, placeholder: '', description: '', options: [] });
    setShowForm(false);
  };

  const inp = "w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black text-black text-sm";

  const grouped = {};
  (customFields || []).forEach(f => {
    const cat = f.category || 'Uncategorized';
    if (!grouped[cat]) grouped[cat] = [];
    grouped[cat].push(f);
  });

  if (showForm) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => { setShowForm(false); setFormError(''); }} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">New TikTok Custom Field</h1>
        </div>

        {formError && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{formError}</div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Field Name (Internal) *</label>
            <input type="text" name="name" value={newField.name} onChange={handleFieldChange}
              placeholder="e.g., video_id" className={inp} />
            <p className="text-xs text-gray-500 mt-1">Use lowercase with underscores (no spaces)</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Field Label (Display) *</label>
            <input type="text" name="label" value={newField.label} onChange={handleFieldChange}
              placeholder="e.g., Video ID" className={inp} />
          </div>
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
          {newField.type === 'select' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Options (comma separated)</label>
              <input type="text" placeholder="Option 1, Option 2, Option 3"
                onChange={e => setNewField(prev => ({ ...prev, options: e.target.value.split(',').map(o => o.trim()) }))}
                className={inp} />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select name="category" value={newField.category} onChange={handleFieldChange} className={inp}>
              <option value="">— No category —</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Placeholder</label>
            <input type="text" name="placeholder" value={newField.placeholder} onChange={handleFieldChange}
              placeholder="Enter placeholder text" className={inp} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
            <textarea name="description" value={newField.description} onChange={handleFieldChange}
              placeholder="Field description (optional)" rows={2} className={inp} />
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" name="required" checked={newField.required} onChange={handleFieldChange}
              className="rounded w-4 h-4 accent-black" />
            <label className="text-sm text-gray-700">Required field</label>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50">
            <Plus size={18} /> {saving ? 'Creating…' : 'Create Field'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition">
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">TikTok Custom Fields</h1>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-lg hover:bg-gray-800 transition text-sm font-medium">
          <Plus size={16} /> New Field
        </button>
      </div>

      {(customFields || []).length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="mb-4">No custom fields yet.</p>
          <button onClick={() => setShowForm(true)}
            className="px-4 py-2 bg-black text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition">
            Add your first field
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, fields]) => (
            <div key={cat}>
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">{cat}</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {fields.map(field => (
                  <div key={field._id} className="flex items-center justify-between border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="min-w-0">
                      <h4 className="font-semibold text-gray-800 truncate">{field.label}</h4>
                      <p className="text-xs text-gray-500 font-mono truncate">{field.name}</p>
                      <div className="flex gap-1.5 mt-1.5 flex-wrap">
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 rounded text-xs font-medium">{field.type}</span>
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
  );
}
