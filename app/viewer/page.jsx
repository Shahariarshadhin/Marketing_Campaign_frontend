"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { useRouter } from "next/navigation";
import { LogOut, Megaphone, ExternalLink } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

const BUILTIN_LABELS = {
  name: "Campaign", delivery: "Delivery", status: "Status", actions: "Actions",
  results: "Results", costPerResult: "Cost/Result", budget: "Budget",
  amountSpent: "Spent", impressions: "Impressions", reach: "Reach",
  endDate: "Ends", active: "Active",
};

export default function ViewerDashboard() {
  const { user, loading, logout } = useAuth();
  const authFetch = useAuthFetch();
  const router = useRouter();
  const redirected = useRef(false);

  const [campaigns, setCampaigns]     = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [contentMap, setContentMap]   = useState({}); // campaignId -> has content?
  const [fetching, setFetching]       = useState(true);
  const [error, setError]             = useState("");

  useEffect(() => {
    if (loading || redirected.current) return;
    if (!user) { redirected.current = true; router.replace("/login"); }
    else if (user.role === "admin") { redirected.current = true; router.replace("/dashboard"); }
  }, [user, loading]);

  useEffect(() => {
    if (!user || user.role !== "viewer") return;
    Promise.all([
      authFetch(`${API}/campaigns`).then(r => r.json()),
      authFetch(`${API}/custom-fields`).then(r => r.json()),
    ])
      .then(([campData, cfData]) => {
        if (campData.success) {
          setCampaigns(campData.data);
          // Check which campaigns have content
          Promise.all(
            campData.data.map(c =>
              authFetch(`${API}/campaign-content/${c._id}`)
                .then(r => r.json())
                .then(d => ({ id: c._id, hasContent: !!(d.success && d.data) }))
                .catch(() => ({ id: c._id, hasContent: false }))
            )
          ).then(results => {
            const map = {};
            results.forEach(r => { map[r.id] = r.hasContent; });
            setContentMap(map);
          });
        } else {
          setError("Failed to load campaigns");
        }
        if (cfData.success) setCustomFields(cfData.data);
      })
      .catch(err => setError(err.message))
      .finally(() => setFetching(false));
  }, [user]);

  if (loading || !user) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>;
  }

  const allowedKeys = user.visibleFields?.length
    ? user.visibleFields
    : Object.keys(BUILTIN_LABELS);

  // Build column renderers
  const columns = allowedKeys.map(key => {
    if (key === 'name') {
      return {
        key,
        label: 'Campaign',
        render: (c) => (
          <Link
            href={`/viewer/campaign/${c._id}`}
            className="group flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition"
          >
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${c.active ? "bg-green-500" : "bg-gray-400"}`} />
            <span className="group-hover:underline">{c.name}</span>
            {/* {contentMap[c._id] && (
              <ExternalLink size={12} className="opacity-0 group-hover:opacity-60 flex-shrink-0 transition" />
            )} */}
          </Link>
        )
      };
    }
    if (key.startsWith("custom_")) {
      const fieldName = key.replace("custom_", "");
      const cf = customFields.find(f => f.name === fieldName);
      return {
        key,
        label: cf?.label || fieldName,
        render: (c) => {
          const val = c.customFields?.[fieldName];
          if (val === undefined || val === null || val === "") return "—";
          if (typeof val === "boolean") return val ? "Yes" : "No";
          return String(val);
        }
      };
    }
    // Builtin renderers
    const renderers = {
      delivery:      (c) => c.delivery || "—",
      status:        (c) => (
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          c.status === "active" ? "bg-green-100 text-green-700" :
          c.status === "draft"  ? "bg-gray-100 text-gray-600" :
                                  "bg-yellow-100 text-yellow-700"
        }`}>{c.status}</span>
      ),
      actions:       (c) => c.actions || "—",
      results:       (c) => c.results || "—",
      costPerResult: (c) => c.costPerResult || "—",
      budget:        (c) => <span className="font-medium">{c.budget || "—"}</span>,
      amountSpent:   (c) => c.amountSpent || "—",
      impressions:   (c) => c.impressions || "—",
      reach:         (c) => c.reach || "—",
      endDate:       (c) => c.endDate || "—",
      active:        (c) => (
        <span className={`text-xs px-2 py-0.5 rounded-full ${c.active ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
          {c.active ? "On" : "Off"}
        </span>
      ),
    };
    return {
      key,
      label: BUILTIN_LABELS[key] || key,
      render: renderers[key] || ((c) => c[key] || "—"),
    };
  }).filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center">
            <Megaphone size={20} className="text-white" />
          </div>
          <div>
            <h1 className="font-semibold text-gray-800">Campaign Dashboard</h1>
            <p className="text-xs text-gray-500">Click a campaign name to view its content</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">{user.name}</p>
            <p className="text-xs text-gray-500">Viewer</p>
          </div>
          <button onClick={logout}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-red-600 transition px-3 py-1.5 rounded-lg hover:bg-gray-100">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold text-gray-800">Your Campaigns</h2>
            <span className="text-sm text-gray-500">{campaigns.length} campaign(s)</span>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">{error}</div>
          )}

          {fetching ? (
            <div className="text-center py-16">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
              <p className="mt-3 text-gray-500">Loading...</p>
            </div>
          ) : campaigns.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-16 text-center">
              <Megaphone size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 font-medium">No campaigns assigned yet</p>
              <p className="text-gray-400 text-sm mt-1">Contact your administrator to get access.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {columns.map(col => (
                        <th key={col.key} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wide whitespace-nowrap">
                          {col.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {campaigns.map(campaign => (
                      <tr key={campaign._id} className="hover:bg-gray-50 transition">
                        {columns.map(col => (
                          <td key={col.key} className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                            {col.render(campaign)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
                {campaigns.length} result(s) · {columns.length} column(s) visible · Click a campaign name to view media content
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}