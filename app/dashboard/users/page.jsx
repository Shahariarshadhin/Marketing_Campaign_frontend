"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, ChevronUp, Copy, Eye, Plus, Trash2, Users, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL;

// Static built-in fields
const BUILTIN_FIELDS = [
  { key: "name",          label: "Campaign Name", locked: true },
  { key: "delivery",      label: "Delivery" },
  { key: "status",        label: "Status" },
  { key: "actions",       label: "Actions" },
  { key: "results",       label: "Results" },
  { key: "costPerResult", label: "Cost per Result" },
  { key: "budget",        label: "Budget" },
  { key: "amountSpent",   label: "Amount Spent" },
  { key: "impressions",   label: "Impressions" },
  { key: "reach",         label: "Reach" },
  { key: "endDate",       label: "End Date" },
  { key: "active",        label: "Active Status" },
];

export default function UserManagement() {
  const { user, loading } = useAuth();
  const authFetch = useAuthFetch();
  const router = useRouter();
  const redirected = useRef(false);

  const [viewers, setViewers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [fetching, setFetching] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(null);
  const [newUser, setNewUser] = useState({ name: "", email: "", password: "" });
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  useEffect(() => {
    if (loading || redirected.current) return;
    if (!user) { redirected.current = true; router.replace("/login"); }
    else if (user.role !== "admin") { redirected.current = true; router.replace("/viewer"); }
  }, [user, loading]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    Promise.all([
      authFetch(`${API}/users`).then(r => r.json()).then(d => { if (d.success) setViewers(d.data); }),
      authFetch(`${API}/campaigns`).then(r => r.json()).then(d => { if (d.success) setCampaigns(d.data); }),
      authFetch(`${API}/custom-fields`).then(r => r.json()).then(d => { if (d.success) setCustomFields(d.data); }),
    ]).finally(() => setFetching(false));
  }, [user]);

  // Merge builtin + custom fields into one list for the UI
  const allFields = [
    ...BUILTIN_FIELDS,
    ...customFields.map(cf => ({
      key: `custom_${cf.name}`,
      label: cf.label,
      isCustom: true,
    }))
  ];

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await authFetch(`${API}/auth/register`, {
        method: "POST",
        body: JSON.stringify({ ...newUser, role: "viewer" }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setShowCreateModal(false);
      setNewUser({ name: "", email: "", password: "" });
      authFetch(`${API}/users`).then(r => r.json()).then(d => { if (d.success) setViewers(d.data); });
    } catch (err) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm("Delete this viewer?")) return;
    await authFetch(`${API}/users/${id}`, { method: "DELETE" });
    setViewers(v => v.filter(u => u._id !== id));
  };

  const handleSaveAssignment = async (userId, campaignIds, viewAll, visibleFields) => {
    const res = await authFetch(`${API}/users/${userId}/campaigns`, {
      method: "PUT",
      body: JSON.stringify({ campaignIds, viewAllCampaigns: viewAll, visibleFields }),
    });
    const data = await res.json();
    if (data.success) setViewers(v => v.map(u => u._id === userId ? data.data : u));
    return data.success;
  };

  const copyShareableLink = async (userId) => {
    const res = await authFetch(`${API}/users/${userId}/shareable-link`);
    const data = await res.json();
    if (data.success) {
      await navigator.clipboard.writeText(data.data.shareableLink);
      setCopiedLink(userId);
      setTimeout(() => setCopiedLink(null), 2000);
    }
  };

  if (loading || fetching) {
    return <div className="flex items-center justify-center py-24">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
    </div>;
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Users size={24} className="text-gray-700" />
          <h1 className="text-2xl font-semibold text-gray-800">Viewer Accounts</h1>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition text-sm font-medium">
          <Plus size={16} /> Add Viewer
        </button>
      </div>

      {/* Viewer list */}
      {viewers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center text-gray-500">
          No viewers yet. Add one to get started.
        </div>
      ) : (
        <div className="space-y-3">
          {viewers.map(v => (
            <ViewerRow
              key={v._id + (v.visibleFields || []).join(',') + (v.allowedCampaigns || []).length}
              viewer={v}
              campaigns={campaigns}
              allFields={allFields}
              copiedLink={copiedLink}
              onDelete={handleDeleteUser}
              onCopyLink={copyShareableLink}
              onSave={handleSaveAssignment}
            />
          ))}
        </div>
      )}

      {/* Create modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Create Viewer Account</h2>
              <button onClick={() => setShowCreateModal(false)}><X size={20} className="text-gray-400" /></button>
            </div>
            {createError && <div className="mb-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg">{createError}</div>}
            <form onSubmit={handleCreateUser} className="space-y-4">
              <input required placeholder="Full Name" value={newUser.name}
                onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input required type="email" placeholder="Email" value={newUser.email}
                onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input required type="password" placeholder="Password (min 6)" minLength={6} value={newUser.password}
                onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={creating}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium">
                  {creating ? "Creating..." : "Create"}
                </button>
                <button type="button" onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Per-viewer expandable row ────────────────────────────────────────────────
// Using key={viewer._id + JSON.stringify(viewer.visibleFields)} on this component
// from the parent forces a full remount when viewer data changes after save,
// so we never need setState-in-effect to sync props -> state.
function ViewerRow({ viewer, campaigns, allFields, copiedLink, onDelete, onCopyLink, onSave }) {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  // Initialize directly from props - no useEffect needed.
  // The parent passes a new key after save which remounts this component fresh.
  const [viewAll, setViewAll] = useState(viewer.viewAllCampaigns || false);
  const [selectedCampaigns, setSelectedCampaigns] = useState(
    (viewer.allowedCampaigns || []).map(c => typeof c === "object" ? c._id : c)
  );
  const defaultVisible = viewer.visibleFields?.length
    ? viewer.visibleFields
    : allFields.map(f => f.key);
  const [visibleFields, setVisibleFields] = useState(defaultVisible);

  const toggleCampaign = id =>
    setSelectedCampaigns(p => p.includes(id) ? p.filter(s => s !== id) : [...p, id]);

  const toggleField = key =>
    setVisibleFields(p => p.includes(key) ? p.filter(k => k !== key) : [...p, key]);

  const selectAllFields = () => setVisibleFields(allFields.map(f => f.key));
  const clearAllFields  = () => setVisibleFields(allFields.filter(f => f.locked).map(f => f.key));

  const handleSave = async () => {
    setSaving(true);
    const ok = await onSave(viewer._id, selectedCampaigns, viewAll, visibleFields);
    setSaving(false);
    if (ok) { setSavedOk(true); setTimeout(() => setSavedOk(false), 2500); }
  };

  // Summary badges
  const campaignBadge = viewAll ? "All campaigns" : `${selectedCampaigns.length} campaign(s)`;
  const fieldBadge    = `${visibleFields.length}/${allFields.length} fields`;

  // Split fields into builtin and custom for display
  const builtinFields = allFields.filter(f => !f.isCustom);
  const customFields  = allFields.filter(f => f.isCustom);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      {/* Row header */}
      <div className="flex items-center justify-between p-4 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-gradient-to-br from-purple-400 to-blue-500 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {viewer.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-gray-800 text-sm truncate">{viewer.name}</p>
            <p className="text-xs text-gray-500 truncate">{viewer.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="hidden sm:block text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full">{campaignBadge}</span>
          <span className="hidden sm:block text-xs bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full">{fieldBadge}</span>

          <button onClick={() => onCopyLink(viewer._id)}
            className="flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition">
            {copiedLink === viewer._id ? <Check size={13} className="text-green-600" /> : <Copy size={13} />}
            {copiedLink === viewer._id ? "Copied!" : "Link"}
          </button>

          <button onClick={() => onDelete(viewer._id)}
            className="p-1.5 hover:bg-red-50 rounded-lg text-red-400 hover:text-red-600 transition">
            <Trash2 size={15} />
          </button>

          <button onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1.5 rounded-lg hover:bg-blue-50 transition">
            <Eye size={14} />
            Configure
            {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
        </div>
      </div>

      {/* Expanded panel */}
      {open && (
        <div className="border-t border-gray-100 bg-gray-50 p-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* ── Campaign Access ── */}
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded text-xs flex items-center justify-center font-bold">C</span>
                Campaign Access
              </h3>

              <label className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-200 mb-3 cursor-pointer hover:border-blue-300 transition">
                <input type="checkbox" checked={viewAll} onChange={e => setViewAll(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-800">All campaigns</p>
                  <p className="text-xs text-gray-500 mt-0.5">Includes future campaigns automatically</p>
                </div>
              </label>

              {!viewAll && (
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {campaigns.length === 0
                    ? <p className="text-sm text-gray-400 text-center py-4">No campaigns yet</p>
                    : campaigns.map(c => (
                      <label key={c._id} className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-gray-200 cursor-pointer hover:border-blue-300 transition">
                        <input type="checkbox" checked={selectedCampaigns.includes(c._id)}
                          onChange={() => toggleCampaign(c._id)} className="w-4 h-4 rounded accent-blue-600" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{c.name}</p>
                          <p className="text-xs text-gray-500">{c.delivery}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {c.active ? "Active" : "Off"}
                        </span>
                      </label>
                    ))
                  }
                </div>
              )}
            </div>

            {/* ── Visible Fields ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <span className="w-5 h-5 bg-purple-100 text-purple-700 rounded text-xs flex items-center justify-center font-bold">F</span>
                  Visible Data Fields
                </h3>
                <div className="flex gap-3 text-xs">
                  <button onClick={selectAllFields} className="text-blue-600 hover:underline">All</button>
                  <span className="text-gray-300">|</span>
                  <button onClick={clearAllFields} className="text-gray-500 hover:underline">None</button>
                </div>
              </div>

              {/* Built-in fields */}
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Standard Fields</p>
              <div className="grid grid-cols-2 gap-1.5 mb-4">
                {builtinFields.map(field => (
                  <FieldToggle key={field.key} field={field}
                    checked={visibleFields.includes(field.key)}
                    onChange={() => !field.locked && toggleField(field.key)} />
                ))}
              </div>

              {/* Custom fields */}
              {customFields.length > 0 && (
                <>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2 mt-3 pt-3 border-t border-gray-200">
                    Custom Fields
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {customFields.map(field => (
                      <FieldToggle key={field.key} field={field}
                        checked={visibleFields.includes(field.key)}
                        onChange={() => toggleField(field.key)} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Save */}
          <div className="flex justify-end mt-5 pt-4 border-t border-gray-200">
            <button onClick={handleSave} disabled={saving}
              className={`flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-sm transition
                ${savedOk ? "bg-green-600 text-white" : "bg-blue-600 text-white hover:bg-blue-700"}
                disabled:opacity-50`}>
              {saving ? "Saving..." : savedOk ? <><Check size={15} /> Saved!</> : "Save Access Settings"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function FieldToggle({ field, checked, onChange }) {
  return (
    <label className={`flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer transition select-none
      ${field.locked ? "opacity-60 cursor-not-allowed bg-gray-50 border-gray-200" :
        checked
          ? "bg-purple-50 border-purple-300 text-purple-800"
          : "bg-white border-gray-200 text-gray-600 hover:border-purple-200 hover:bg-purple-50/40"
      }`}>
      <input type="checkbox" checked={checked} disabled={field.locked}
        onChange={onChange} className="w-3.5 h-3.5 rounded accent-purple-600 flex-shrink-0" />
      <span className="text-xs font-medium truncate">{field.label}</span>
      {field.locked && <span className="ml-auto text-xs text-gray-400 flex-shrink-0">Always</span>}
      {field.isCustom && !field.locked && (
        <span className="ml-auto text-xs text-purple-400 flex-shrink-0">Custom</span>
      )}
    </label>
  );
}