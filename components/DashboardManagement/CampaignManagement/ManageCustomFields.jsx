"use client"
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function ManageFields({ 
  customFields, 
  onAddField, 
  onDeleteField, 
  onBack 
}) {
  const [newField, setNewField] = useState({
    name: '',
    label: '',
    type: 'text',
    required: false,
    placeholder: '',
    description: '',
    options: []
  });

  const handleFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewField(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddField = () => {
    if (!newField.name || !newField.label) {
      alert('Field name and label are required');
      return;
    }

    onAddField(newField);
    
    // Reset form
    setNewField({
      name: '',
      label: '',
      type: 'text',
      required: false,
      placeholder: '',
      description: '',
      options: []
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="flex items-center gap-4 mb-4">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-full transition"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <h1 className="text-2xl font-semibold text-gray-800">Manage Custom Fields</h1>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add New Field Form */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Add New Field</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Name (Internal) *
                </label>
                <input
                  type="text"
                  name="name"
                  value={newField.name}
                  onChange={handleFieldChange}
                  placeholder="e.g., customer_id"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Use lowercase with underscores (no spaces)</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Label (Display) *
                </label>
                <input
                  type="text"
                  name="label"
                  value={newField.label}
                  onChange={handleFieldChange}
                  placeholder="e.g., Customer ID"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Field Type
                </label>
                <select
                  name="type"
                  value={newField.type}
                  onChange={handleFieldChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="email">Email</option>
                  <option value="date">Date</option>
                  <option value="textarea">Text Area</option>
                  <option value="select">Dropdown</option>
                  <option value="checkbox">Checkbox</option>
                </select>
              </div>

              {newField.type === 'select' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options (comma separated)
                  </label>
                  <input
                    type="text"
                    placeholder="Option 1, Option 2, Option 3"
                    onChange={(e) => setNewField(prev => ({
                      ...prev,
                      options: e.target.value.split(',').map(opt => opt.trim())
                    }))}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Placeholder
                </label>
                <input
                  type="text"
                  name="placeholder"
                  value={newField.placeholder}
                  onChange={handleFieldChange}
                  placeholder="Enter placeholder text"
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={newField.description}
                  onChange={handleFieldChange}
                  placeholder="Field description (optional)"
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="required"
                  checked={newField.required}
                  onChange={handleFieldChange}
                  className="rounded"
                />
                <label className="text-sm text-gray-700">Required field</label>
              </div>

              <button
                onClick={handleAddField}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                <Plus size={18} />
                Add Field
              </button>
            </div>
          </div>

          {/* Existing Fields List */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Existing Fields ({customFields.length})</h2>
            
            {customFields.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No custom fields yet. Add your first field!</p>
            ) : (
              <div className="space-y-3">
                {customFields.map((field) => (
                  <div key={field._id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold text-gray-800">{field.label}</h3>
                        <p className="text-sm text-gray-500">Name: {field.name}</p>
                      </div>
                      <button
                        onClick={() => onDeleteField(field._id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        <Trash2 size={16} className="text-red-600" />
                      </button>
                    </div>
                    <div className="flex gap-2 flex-wrap mt-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {field.type}
                      </span>
                      {field.required && (
                        <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                          Required
                        </span>
                      )}
                    </div>
                    {field.description && (
                      <p className="text-xs text-gray-600 mt-2">{field.description}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}