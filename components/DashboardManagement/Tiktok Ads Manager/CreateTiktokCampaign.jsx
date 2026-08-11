"use client";
import { ArrowLeft, Save, X, Loader2 } from 'lucide-react';

export default function CreateTiktokCampaign({
  formData,
  setFormData,
  customFields,
  editingCampaign,
  onSubmit,
  onCancel,
  loading,
}) {
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleCustomFieldChange = (fieldName, value) => {
    setFormData(prev => ({
      ...prev,
      customFieldsData: { ...(prev.customFieldsData || {}), [fieldName]: value },
    }));
  };

  const inp = "w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-black text-black";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6">
          <div className="flex items-center gap-4">
            <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full transition">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-3 h-3 rounded-full inline-block bg-black" />
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">TikTok Ads Manager</span>
              </div>
              <h1 className="text-2xl font-semibold text-gray-800">
                {editingCampaign ? 'Edit TikTok Campaign' : 'Create New TikTok Campaign'}
              </h1>
            </div>
          </div>
        </div>

        {/* ── Form ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-lg shadow-sm p-6 space-y-6">

          {/* Campaign Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleInputChange}
              placeholder="Enter campaign name" className={inp} />
          </div>

          {/* Objective */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Objective *</label>
            <select name="objective" value={formData.objective} onChange={handleInputChange} className={inp}>
              <option value="reach">Reach</option>
              <option value="traffic">Traffic</option>
              <option value="app_promotion">App Promotion</option>
              <option value="engagement">Engagement</option>
              <option value="video_views">Video Views</option>
              <option value="lead_generation">Lead Generation</option>
              <option value="conversions">Conversions</option>
              <option value="catalog_sales">Catalog Sales</option>
              <option value="community_interaction">Community Interaction</option>
            </select>
          </div>

          {/* Status + On/Off */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Campaign Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange} className={inp}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="paused">Paused</option>
                <option value="scheduled">Scheduled</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">On/Off</label>
              <div className="flex items-center gap-3 mt-2">
                <button type="button"
                  onClick={() => setFormData(prev => ({ ...prev, active: !prev.active }))}
                  className={`w-12 h-6 rounded-full transition relative ${formData.active ? 'bg-black' : 'bg-gray-300'}`}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${formData.active ? 'right-1' : 'left-1'}`} />
                </button>
                <span className="text-sm text-gray-600">{formData.active ? 'On' : 'Off'}</span>
              </div>
            </div>
          </div>

          {/* Status note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status Note</label>
            <input type="text" name="statusNote" value={formData.statusNote} onChange={handleInputChange}
              placeholder="e.g., Campaign inactive, Campaign active" className={inp} />
          </div>

          {/* Budget type + amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget Type</label>
            <div className="flex gap-4 mb-3">
              {['none', 'daily', 'lifetime'].map(t => (
                <label key={t} className="flex items-center">
                  <input type="radio" name="budgetType" value={t} checked={formData.budgetType === t}
                    onChange={handleInputChange} className="mr-2" />
                  <span className="text-sm text-gray-700 capitalize">{t === 'none' ? 'No campaign budget (All)' : `${t} Budget`}</span>
                </label>
              ))}
            </div>
            {formData.budgetType === 'daily' && (
              <input type="number" name="dailyBudget" value={formData.dailyBudget} onChange={handleInputChange}
                placeholder="Enter daily budget amount" className={inp} />
            )}
            {formData.budgetType === 'lifetime' && (
              <input type="number" name="lifetimeBudget" value={formData.lifetimeBudget} onChange={handleInputChange}
                placeholder="Enter lifetime budget amount" className={inp} />
            )}
          </div>

          {/* Budget display value (what shows in the table's Budget column) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Budget (Display)</label>
            <input type="text" name="budget" value={formData.budget} onChange={handleInputChange}
              placeholder='e.g., "All", "$50.00/day"' className={inp} />
          </div>

          {/* Metrics — usually left at defaults and updated via Daily Entry, but editable here too */}
          <div className="pt-4 border-t">
            <h3 className="text-sm font-semibold text-gray-800 mb-4">Performance Metrics (initial values)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Total Cost</label>
                <input type="text" name="totalCost" value={formData.totalCost} onChange={handleInputChange} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">CPC (Destination)</label>
                <input type="text" name="cpc" value={formData.cpc} onChange={handleInputChange} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">CPM</label>
                <input type="text" name="cpm" value={formData.cpm} onChange={handleInputChange} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Impressions</label>
                <input type="text" name="impressions" value={formData.impressions} onChange={handleInputChange} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Clicks (Destination)</label>
                <input type="text" name="clicks" value={formData.clicks} onChange={handleInputChange} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">CTR (Destination)</label>
                <input type="text" name="ctr" value={formData.ctr} onChange={handleInputChange} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Conversions</label>
                <input type="text" name="conversions" value={formData.conversions} onChange={handleInputChange} className={inp} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">CPA</label>
                <input type="text" name="cpa" value={formData.cpa} onChange={handleInputChange} className={inp} />
              </div>
            </div>
          </div>

          {/* Bid Strategy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Bid Strategy</label>
            <select name="bidStrategy" value={formData.bidStrategy} onChange={handleInputChange} className={inp}>
              <option value="lowest_cost">Lowest Cost</option>
              <option value="cost_cap">Cost Cap</option>
              <option value="bid_cap">Bid Cap</option>
            </select>
          </div>

          {/* Placement */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Placement</label>
            <select name="placement" value={formData.placement} onChange={handleInputChange} className={inp}>
              <option value="automatic">Automatic Placements</option>
              <option value="manual">Manual Placements</option>
              <option value="tiktok_only">TikTok Only</option>
              <option value="pangle">Pangle</option>
              <option value="global_app_bundle">Global App Bundle</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleInputChange} className={inp} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className={inp} />
            </div>
          </div>

          {/* Target Audience */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Audience</label>
            <input type="text" name="targetAudience" value={formData.targetAudience} onChange={handleInputChange}
              placeholder="Enter target audience" className={inp} />
          </div>

          {/* Custom Fields */}
          {customFields && customFields.length > 0 && (
            <div className="pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Custom Fields</h3>
              <div className="space-y-6">
                {customFields.map((field) => (
                  <div key={field._id}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {['text', 'number', 'email', 'url'].includes(field.type) && (
                      <input type={field.type === 'url' ? 'text' : field.type}
                        value={(formData.customFieldsData?.[field.name]) || ''}
                        onChange={e => handleCustomFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        className={inp} />
                    )}
                    {field.type === 'date' && (
                      <input type="date"
                        value={(formData.customFieldsData?.[field.name]) || ''}
                        onChange={e => handleCustomFieldChange(field.name, e.target.value)}
                        className={inp} />
                    )}
                    {field.type === 'textarea' && (
                      <textarea rows={3}
                        value={(formData.customFieldsData?.[field.name]) || ''}
                        onChange={e => handleCustomFieldChange(field.name, e.target.value)}
                        placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
                        className={inp} />
                    )}
                    {field.type === 'select' && (
                      <select
                        value={(formData.customFieldsData?.[field.name]) || ''}
                        onChange={e => handleCustomFieldChange(field.name, e.target.value)}
                        className={inp}>
                        <option value="">Select {field.label.toLowerCase()}</option>
                        {field.options?.map((opt, i) => <option key={i} value={opt}>{opt}</option>)}
                      </select>
                    )}
                    {(field.type === 'checkbox' || field.type === 'boolean') && (
                      <div className="flex items-center gap-2">
                        <input type="checkbox"
                          checked={(formData.customFieldsData?.[field.name]) || false}
                          onChange={e => handleCustomFieldChange(field.name, e.target.checked)}
                          className="rounded" />
                        <span className="text-sm text-gray-600">{field.placeholder || field.label}</span>
                      </div>
                    )}
                    {field.description && <p className="text-xs text-gray-500 mt-1">{field.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={onSubmit} disabled={loading}
              className="flex items-center gap-2 bg-black text-white px-6 py-2.5 rounded-lg hover:bg-gray-800 transition font-medium disabled:opacity-50">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={18} />}
              {loading ? (editingCampaign ? 'Updating…' : 'Creating…') : (editingCampaign ? 'Update Campaign' : 'Create Campaign')}
            </button>
            <button onClick={onCancel}
              className="flex items-center gap-2 bg-gray-200 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-300 transition font-medium">
              <X size={18} /> Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
