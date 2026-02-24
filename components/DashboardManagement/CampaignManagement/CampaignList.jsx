
import { Copy, Edit, Plus, Settings, Trash2, X } from 'lucide-react';

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
  onDelete
}) {
  
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="w-full mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm mb-4 p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-semibold text-gray-800">Campaigns</h1>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowColumnManager(!showColumnManager)}
                className="flex items-center gap-2 bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition"
              >
                <Settings size={18} />
                Columns
              </button>
              <button 
                onClick={onManageFieldsClick}
                className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition"
              >
                <Plus size={18} />
                Manage Fields
              </button>
              <button 
                onClick={onCreateClick}
                className="flex items-center gap-2 bg-green-700 text-white px-4 py-2 rounded-md hover:bg-green-800 transition"
              >
                <Plus size={18} />
                Create Campaign
              </button>
            </div>
          </div>

          {/* Column Manager Dropdown */}
          {showColumnManager && (
            <div className="mb-4 bg-white border border-gray-200 rounded-lg p-4 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">Manage Table Columns</h3>
                <div className="flex gap-2">
                  <button
                    onClick={showAllColumns}
                    className="text-xs px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition"
                  >
                    Show All
                  </button>
                  <button
                    onClick={hideAllColumns}
                    className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition"
                  >
                    Hide All
                  </button>
                  <button
                    onClick={() => setShowColumnManager(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.checkbox}
                    onChange={() => toggleColumn('checkbox')}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Checkbox</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.toggle}
                    onChange={() => toggleColumn('toggle')}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">On/Off</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer opacity-50">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Campaign (Always Visible)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.delivery}
                    onChange={() => toggleColumn('delivery')}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Delivery</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.actions}
                    onChange={() => toggleColumn('actions')}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Actions</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.results}
                    onChange={() => toggleColumn('results')}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Results</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.costPerResult}
                    onChange={() => toggleColumn('costPerResult')}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Cost per Result</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.budget}
                    onChange={() => toggleColumn('budget')}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Budget</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.amountSpent}
                    onChange={() => toggleColumn('amountSpent')}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Amount Spent</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.impressions}
                    onChange={() => toggleColumn('impressions')}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Impressions</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.reach}
                    onChange={() => toggleColumn('reach')}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Reach</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={visibleColumns.ends}
                    onChange={() => toggleColumn('ends')}
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Ends</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer opacity-50">
                  <input
                    type="checkbox"
                    checked={true}
                    disabled
                    className="rounded"
                  />
                  <span className="text-sm text-gray-700">Actions (Always Visible)</span>
                </label>
              </div>
              
              {/* Custom Fields Section */}
              {customFields.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Custom Fields</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {customFields.map((field) => (
                      <label key={field._id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={visibleColumns[`custom_${field.name}`] !== false}
                          onChange={() => toggleColumn(`custom_${field.name}`)}
                          className="rounded"
                        />
                        <span className="text-sm text-gray-700">{field.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
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
                    {visibleColumns.checkbox && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                        <input type="checkbox" className="rounded" />
                      </th>
                    )}
                    {visibleColumns.toggle && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">On/Off</th>
                    )}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Campaign</th>
                    {visibleColumns.delivery && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Delivery</th>
                    )}
                    {visibleColumns.actions && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Actions</th>
                    )}
                    {visibleColumns.results && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Results</th>
                    )}
                    {visibleColumns.costPerResult && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Cost per Result</th>
                    )}
                    {visibleColumns.budget && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Budget</th>
                    )}
                    {visibleColumns.amountSpent && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Amount Spent</th>
                    )}
                    {visibleColumns.impressions && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Impressions</th>
                    )}
                    {visibleColumns.reach && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Reach</th>
                    )}
                    {visibleColumns.ends && (
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">Ends</th>
                    )}
                    {customFields.map((field) => (
                      visibleColumns[`custom_${field.name}`] !== false && (
                        <th key={field._id} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">
                          {field.label}
                        </th>
                      )
                    ))}
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase"></th>
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
                    campaigns.map((campaign) => (
                      <tr key={campaign._id} className="hover:bg-gray-50 transition">
                        {visibleColumns.checkbox && (
                          <td className="px-4 py-3">
                            <input type="checkbox" className="rounded" />
                          </td>
                        )}
                        {visibleColumns.toggle && (
                          <td className="px-4 py-3">
                            <button
                              onClick={() => onToggle(campaign._id)}
                              className={`w-10 h-6 rounded-full transition ${
                                campaign.active ? 'bg-blue-600' : 'bg-gray-300'
                              } relative`}
                            >
                              <span
                                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition ${
                                  campaign.active ? 'right-1' : 'left-1'
                                }`}
                              />
                            </button>
                          </td>
                        )}
                        <td className="px-4 py-3">
                          <div className="text-blue-600 hover:underline cursor-pointer font-medium">
                            {campaign.name}
                          </div>
                        </td>
                        {visibleColumns.delivery && (
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${
                                campaign.status === 'active' ? 'bg-green-500' : 
                                campaign.status === 'draft' ? 'bg-gray-400' : 'bg-yellow-500'
                              }`} />
                              <span className="text-sm text-gray-700">{campaign.delivery}</span>
                            </div>
                          </td>
                        )}
                        {visibleColumns.actions && (
                          <td className="px-4 py-3 text-sm text-gray-600">{campaign.actions}</td>
                        )}
                        {visibleColumns.results && (
                          <td className="px-4 py-3 text-sm text-gray-600">{campaign.results}</td>
                        )}
                        {visibleColumns.costPerResult && (
                          <td className="px-4 py-3 text-sm text-gray-600">{campaign.costPerResult}</td>
                        )}
                        {visibleColumns.budget && (
                          <td className="px-4 py-3 text-sm text-gray-700 font-medium">{campaign.budget}</td>
                        )}
                        {visibleColumns.amountSpent && (
                          <td className="px-4 py-3 text-sm text-gray-700 font-medium">{campaign.amountSpent}</td>
                        )}
                        {visibleColumns.impressions && (
                          <td className="px-4 py-3 text-sm text-gray-600">{campaign.impressions}</td>
                        )}
                        {visibleColumns.reach && (
                          <td className="px-4 py-3 text-sm text-gray-600">{campaign.reach}</td>
                        )}
                        {visibleColumns.ends && (
                          <td className="px-4 py-3 text-sm text-gray-600">{campaign.endDate}</td>
                        )}
                        {customFields.map((field) => (
                          visibleColumns[`custom_${field.name}`] !== false && (
                            <td key={field._id} className="px-4 py-3 text-sm text-gray-600">
                              {campaign.customFields && campaign.customFields[field.name] 
                                ? (typeof campaign.customFields[field.name] === 'boolean' 
                                    ? (campaign.customFields[field.name] ? 'Yes' : 'No')
                                    : campaign.customFields[field.name])
                                : '—'}
                            </td>
                          )
                        ))}
                        <td className="px-4 py-3">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => onEdit(campaign)}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Edit"
                            >
                              <Edit size={16} className="text-gray-600" />
                            </button>
                            <button 
                              onClick={() => onDuplicate(campaign._id)}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Duplicate"
                            >
                              <Copy size={16} className="text-gray-600" />
                            </button>
                            <button 
                              onClick={() => onDelete(campaign._id)}
                              className="p-1 hover:bg-gray-200 rounded"
                              title="Delete"
                            >
                              <Trash2 size={16} className="text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 text-sm text-gray-600">
              Results from {campaigns.length} campaigns
            </div>
          </div>
        )}
      </div>
    </div>
  );
}