// components/CreateCampaign.jsx
// Works in TWO modes:
//   1. From CampaignContainer (old flow) — user picks a mother brand from dropdown
//   2. From /dashboard/brands/[id]/create-campaign — brandId pre-filled, no dropdown shown

import { useEffect, useState } from 'react';
import { ArrowLeft, Save, X, Loader2 } from 'lucide-react';

export default function CreateCampaign({
  formData,
  setFormData,
  customFields,
  editingCampaign,
  onSubmit,
  onCancel,
  loading,
  // Optional: pre-selected brand (passed when creating from brand detail page)
  preselectedBrand = null,
  // Optional: all available brands list (passed from CampaignContainer)
  availableBrands = [],
}) {

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCustomFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      customFieldsData: { ...(prev.customFieldsData || {}), [fieldName]: value },
    }));
  };

  // Accent color driven by selected brand
  const accent = preselectedBrand?.color
    || availableBrands.find(b => b._id === formData.motherBrand)?.color
    || '#2563eb';

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              {/* breadcrumb when brand is known */}
              {(preselectedBrand || formData.motherBrand) && (
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="w-3 h-3 rounded-full inline-block"
                    style={{ background: accent }} />
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {preselectedBrand?.name
                      || availableBrands.find(b => b._id === formData.motherBrand)?.name
                      || 'Brand'}
                  </span>
                </div>
              )}
              <h1 className="text-2xl font-semibold text-gray-800">
                {editingCampaign ? 'Edit Campaign' : 'Create New Campaign'}
              </h1>
            </div>
          </div>
        </div>

        {/* ── Form ──────────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">

          {/* ── Mother Brand selector ──────────────────────────────────────── */}
          {/* Hidden when brand is preselected (coming from brand page) */}
          {!preselectedBrand && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mother Brand <span className="text-red-500">*</span>
              </label>
              {availableBrands.length === 0 ? (
                <div className="border border-amber-200 bg-amber-50 rounded-lg px-4 py-3 text-sm text-amber-700">
                  No brands found. Please{' '}
                  <a href="/dashboard/brands" className="underline font-medium">create a brand</a>
                  {' '}first before creating a campaign.
                </div>
              ) : (
                <select
                  name="motherBrand"
                  value={formData.motherBrand || ''}
                  onChange={handleInputChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                >
                  <option value="">— Select a brand —</option>
                  {availableBrands.map(b => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* ── Campaign Name ──────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name *</label>
            <input
              type="text" name="name" value={formData.name}
              onChange={handleInputChange} placeholder="Enter campaign name"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* ── Objective ─────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Objective *</label>
            <select
              name="objective" value={formData.objective} onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="awareness">Awareness</option>
              <option value="traffic">Traffic</option>
              <option value="engagement">Engagement</option>
              <option value="leads">Leads</option>
              <option value="sales">Sales</option>
              <option value="app_promotion">App Promotion</option>
            </select>
          </div>

          {/* ── Status + Active toggle ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Status</label>
              <select
                name="status" value={formData.status} onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Active Status</label>
              <div className="flex items-center gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                  className={`w-12 h-6 rounded-full transition relative ${formData.active ? 'bg-blue-600' : 'bg-gray-300'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${formData.active ? 'right-1' : 'left-1'}`} />
                </button>
                <span className="text-sm text-gray-600">{formData.active ? 'On' : 'Off'}</span>
              </div>
            </div>
          </div>

          {/* ── Delivery Status ───────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Delivery Status</label>
            <input
              type="text" name="delivery" value={formData.delivery}
              onChange={handleInputChange} placeholder="e.g., In draft, Active, Scheduled"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* ── Actions ───────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
            <input
              type="text" name="actions" value={formData.actions}
              onChange={handleInputChange} placeholder="Enter actions"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* ── Results ───────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
            <input
              type="text" name="results" value={formData.results}
              onChange={handleInputChange} placeholder="e.g., Landing page view, Impressions"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* ── Cost Per Result ───────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Cost Per Result</label>
            <input
              type="text" name="costPerResult" value={formData.costPerResult}
              onChange={handleInputChange} placeholder="e.g., Per landing page view"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* ── Budget ────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget Type</label>
            <div className="flex gap-4 mb-3">
              {['daily', 'lifetime'].map(t => (
                <label key={t} className="flex items-center">
                  <input
                    type="radio" name="budgetType" value={t}
                    checked={formData.budgetType === t} onChange={handleInputChange} className="mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    {t.charAt(0).toUpperCase() + t.slice(1)} Budget
                  </span>
                </label>
              ))}
            </div>
            {formData.budgetType === 'daily' ? (
              <input
                type="number" name="dailyBudget" value={formData.dailyBudget}
                onChange={handleInputChange} placeholder="Enter daily budget amount"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            ) : (
              <input
                type="number" name="lifetimeBudget" value={formData.lifetimeBudget}
                onChange={handleInputChange} placeholder="Enter lifetime budget amount"
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            )}
          </div>

          {/* ── Budget Display ─────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget (Display)</label>
            <input
              type="text" name="budget" value={formData.budget}
              onChange={handleInputChange} placeholder="e.g., $30.00, Using ad set budget"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* ── Amount Spent ──────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Amount Spent</label>
            <input
              type="text" name="amountSpent" value={formData.amountSpent}
              onChange={handleInputChange} placeholder="e.g., $0.00"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* ── Impressions ───────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Impressions</label>
            <input
              type="text" name="impressions" value={formData.impressions}
              onChange={handleInputChange} placeholder="e.g., —, 1000"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* ── Reach ─────────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Reach</label>
            <input
              type="text" name="reach" value={formData.reach}
              onChange={handleInputChange} placeholder="e.g., —, 500"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* ── Bid Strategy ──────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bid Strategy</label>
            <select
              name="bidStrategy" value={formData.bidStrategy} onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="lowest_cost">Lowest Cost</option>
              <option value="cost_cap">Cost Cap</option>
              <option value="bid_cap">Bid Cap</option>
              <option value="highest_value">Highest Value</option>
            </select>
          </div>

          {/* ── Date Range ────────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input
                type="date" name="startDate" value={formData.startDate} onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input
                type="date" name="endDate" value={formData.endDate} onChange={handleInputChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
              />
            </div>
          </div>

          {/* ── Target Audience ───────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <input
              type="text" name="targetAudience" value={formData.targetAudience}
              onChange={handleInputChange} placeholder="Enter target audience"
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
          </div>

          {/* ── Placement ─────────────────────────────────────────────────── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Ad Placement</label>
            <select
              name="placement" value={formData.placement} onChange={handleInputChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="automatic">Automatic Placements</option>
              <option value="manual">Manual Placements</option>
              <option value="facebook_only">Facebook Only</option>
              <option value="instagram_only">Instagram Only</option>
            </select>
          </div>

          {/* ── Custom Fields ─────────────────────────────────────────────── */}
          {customFields && customFields.length > 0 && (
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Custom Fields</h3>
              <div className="space-y-6">
                {customFields.map((field) => (
                  <div key={field._id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>

                    {field.type === 'text' && (
                      <input type="text"
                        value={(formData.customFieldsData?.[field.name]) || ''}
                        onChange={e => handleCustomFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      />
                    )}
                    {field.type === 'number' && (
                      <input type="number"
                        value={(formData.customFieldsData?.[field.name]) || ''}
                        onChange={e => handleCustomFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      />
                    )}
                    {field.type === 'email' && (
                      <input type="email"
                        value={(formData.customFieldsData?.[field.name]) || ''}
                        onChange={e => handleCustomFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      />
                    )}
                    {field.type === 'date' && (
                      <input type="date"
                        value={(formData.customFieldsData?.[field.name]) || ''}
                        onChange={e => handleCustomFieldChange(field.name, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      />
                    )}
                    {field.type === 'textarea' && (
                      <textarea rows={3}
                        value={(formData.customFieldsData?.[field.name]) || ''}
                        onChange={e => handleCustomFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      />
                    )}
                    {field.type === 'select' && (
                      <select
                        value={(formData.customFieldsData?.[field.name]) || ''}
                        onChange={e => handleCustomFieldChange(field.name, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      >
                        <option value="">Select {field.label.toLowerCase()}</option>
                        {field.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                    )}
                    {field.type === 'checkbox' && (
                      <div className="flex items-center gap-2">
                        <input type="checkbox"
                          checked={(formData.customFieldsData?.[field.name]) || false}
                          onChange={e => handleCustomFieldChange(field.name, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-600">{field.placeholder || field.label}</span>
                      </div>
                    )}
                    {field.description && (
                      <p className="text-xs text-gray-500 mt-1">{field.description}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Action Buttons ─────────────────────────────────────────────── */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onSubmit} disabled={loading}
              className="flex items-center gap-2 text-white px-6 py-2.5 rounded-lg hover:opacity-90 transition font-medium disabled:opacity-50"
              style={{ background: accent }}
            >
              {loading
                ? <Loader2 size={16} className="animate-spin" />
                : <Save size={18} />}
              {loading
                ? (editingCampaign ? 'Updating…' : 'Creating…')
                : (editingCampaign ? 'Update Campaign' : 'Create Campaign')}
            </button>
            <button
              onClick={onCancel}
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 transition font-medium"
            >
              <X size={18} /> Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}