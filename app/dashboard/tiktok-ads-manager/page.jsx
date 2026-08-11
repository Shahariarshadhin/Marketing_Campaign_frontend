
"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { Music2 } from "lucide-react";
import CreateTiktokCampaign from "@/components/DashboardManagement/Tiktok Ads Manager/CreateTiktokCampaign";
import ManageTiktokCustomFields from "@/components/DashboardManagement/Tiktok Ads Manager/ManageTiktokCustomFields";
import TiktokDailyEntryPanel from "@/components/DashboardManagement/Tiktok Ads Manager/TiktokDailyEntryPanel";
import TiktokCampaignList from "@/components/DashboardManagement/Tiktok Ads Manager/TiktokCampaignList";

const API = process.env.NEXT_PUBLIC_API_URL;
const TT_CAMPAIGNS_URL   = `${API}/tiktok-campaigns`;
const TT_CUSTOM_FIELDS_URL = `${API}/tiktok-custom-fields`;
const TT_METRICS_URL     = `${API}/tiktok-metrics`;

function todayISO() { return new Date().toISOString().split("T")[0]; }

const DEFAULT_FORM = {
  name: "", objective: "traffic", status: "draft", statusNote: "Campaign inactive",
  active: false, budgetType: "none", dailyBudget: "", lifetimeBudget: "", budget: "All",
  totalCost: "0.00 USD", cpc: "0.00 USD", cpm: "0.00 USD", impressions: "0",
  clicks: "0", ctr: "0.00%", conversions: "0", cpa: "0.00 USD",
  bidStrategy: "lowest_cost", placement: "automatic", targetAudience: "",
  startDate: "", endDate: "Ongoing", customFieldsData: {},
};

export default function TiktokAdsManagerPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const authFetch = useAuthFetch();

  const [campaigns, setCampaigns]   = useState([]);
  const [customFields, setCF]       = useState([]);
  const [fetching, setFetching]     = useState(true);
  const [toast, setToast]           = useState(null);

  const [view, setView] = useState("list"); // "list" | "create" | "fields"
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [formData, setFormData]     = useState(DEFAULT_FORM);
  const [saving, setSaving]         = useState(false);

  const [visibleColumns, setVisibleColumns] = useState({
    status: true, budget: true, totalCost: true, cpc: true, cpm: true,
    impressions: true, clicks: true, ctr: true, conversions: true, cpa: true,
  });

  const [tableDate, setTableDate]       = useState(() => todayISO());
  const [tableEndDate, setTableEndDate] = useState(() => todayISO());
  const [dailyDataMap, setDailyDataMap] = useState({});
  const [loadingDaily, setLoadingDaily] = useState(false);
  const [entryPanelCampaign, setEntryPanelCampaign] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setFetching(true);
    try {
      const [campRes, cfRes] = await Promise.all([
        authFetch(TT_CAMPAIGNS_URL).then(r => r.json()),
        authFetch(TT_CUSTOM_FIELDS_URL).then(r => r.json()),
      ]);
      if (campRes.success) setCampaigns(campRes.data);
      if (cfRes.success) setCF(cfRes.data || []);
    } finally { setFetching(false); }
  };

  const fetchDailyData = async (start, end, campList) => {
    if (!start || !campList.length) { setDailyDataMap({}); return; }
    setLoadingDaily(true);
    const ids = campList.map(c => c._id);
    try {
      const isSingleDay = !end || start === end;
      const url = isSingleDay ? `${TT_METRICS_URL}/bulk-by-date` : `${TT_METRICS_URL}/bulk-by-range`;
      const payload = isSingleDay ? { campaignIds: ids, date: start } : { campaignIds: ids, startDate: start, endDate: end };
      const res  = await authFetch(url, { method: "POST", body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) setDailyDataMap(data.data); else setDailyDataMap({});
    } catch { setDailyDataMap({}); }
    finally { setLoadingDaily(false); }
  };

  useEffect(() => {
    if (!user || !campaigns.length) return;
    fetchDailyData(tableDate || todayISO(), tableEndDate || tableDate || todayISO(), campaigns);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableDate, tableEndDate, campaigns.length]);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000);
  };

  const toggleColumn = (key) => setVisibleColumns(prev => ({ ...prev, [key]: !prev[key] }));

  // ── Custom fields ──────────────────────────────────────────────────────
  const addCustomField = async (fieldData) => {
    try {
      const res  = await authFetch(TT_CUSTOM_FIELDS_URL, { method: "POST", body: JSON.stringify(fieldData) });
      const data = await res.json();
      if (data.success) setCF(prev => [...prev, data.data]);
      else showToast(data.message || "Failed to add field", "error");
    } catch { showToast("Failed to add custom field", "error"); }
  };

  const deleteCustomField = async (id) => {
    if (!confirm("Delete this custom field?")) return;
    try {
      const res = await authFetch(`${TT_CUSTOM_FIELDS_URL}/${id}`, { method: "DELETE" });
      if (res.ok) setCF(prev => prev.filter(f => f._id !== id));
    } catch { showToast("Failed to delete custom field", "error"); }
  };

  // ── Campaign CRUD ────────────────────────────────────────────────────
  const toggleCampaign = async (id) => {
    const res  = await authFetch(`${TT_CAMPAIGNS_URL}/${id}/toggle`, { method: "PATCH" });
    const data = await res.json();
    if (data.success) setCampaigns(cs => cs.map(c => c._id === id ? data.data : c));
  };

  const deleteCampaign = async (id) => {
    if (!confirm("Delete this TikTok campaign?")) return;
    const res  = await authFetch(`${TT_CAMPAIGNS_URL}/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.success) { setCampaigns(cs => cs.filter(c => c._id !== id)); showToast("Campaign deleted"); }
  };

  const duplicateCampaign = async (id) => {
    const res  = await authFetch(`${TT_CAMPAIGNS_URL}/${id}/duplicate`, { method: "POST" });
    const data = await res.json();
    if (data.success) { setCampaigns(cs => [...cs, data.data]); showToast("Campaign duplicated!"); }
  };

  const openEdit = (campaign) => {
    setEditingCampaign(campaign);
    setFormData({
      name: campaign.name, objective: campaign.objective, status: campaign.status,
      statusNote: campaign.statusNote, active: campaign.active,
      budgetType: campaign.budgetType, dailyBudget: campaign.dailyBudget, lifetimeBudget: campaign.lifetimeBudget,
      budget: campaign.budget, totalCost: campaign.totalCost, cpc: campaign.cpc, cpm: campaign.cpm,
      impressions: campaign.impressions, clicks: campaign.clicks, ctr: campaign.ctr,
      conversions: campaign.conversions, cpa: campaign.cpa, bidStrategy: campaign.bidStrategy,
      placement: campaign.placement, targetAudience: campaign.targetAudience,
      startDate: campaign.startDate, endDate: campaign.endDate,
      customFieldsData: campaign.customFields || {},
    });
    setView("create");
  };

  const openCreate = () => {
    setEditingCampaign(null);
    setFormData(DEFAULT_FORM);
    setView("create");
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) { alert("Campaign name is required"); return; }
    setSaving(true);
    try {
      const payload = { ...formData, customFields: formData.customFieldsData };
      delete payload.customFieldsData;

      const url    = editingCampaign ? `${TT_CAMPAIGNS_URL}/${editingCampaign._id}` : TT_CAMPAIGNS_URL;
      const method = editingCampaign ? "PUT" : "POST";
      const res    = await authFetch(url, { method, body: JSON.stringify(payload) });
      const data   = await res.json();

      if (data.success) {
        showToast(editingCampaign ? "Campaign updated!" : "Campaign created!");
        setView("list");
        setEditingCampaign(null);
        loadData();
      } else alert(data.message);
    } catch { alert("Failed to save campaign"); }
    finally { setSaving(false); }
  };

  if (loading || fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-black" />
      </div>
    );
  }

  if (view === "create") {
    return (
      <CreateTiktokCampaign
        formData={formData}
        setFormData={setFormData}
        customFields={customFields}
        editingCampaign={editingCampaign}
        onSubmit={handleSubmit}
        onCancel={() => { setView("list"); setEditingCampaign(null); }}
        loading={saving}
      />
    );
  }

  if (view === "fields") {
    return (
      <div className="min-h-screen bg-gray-50">
        <ManageTiktokCustomFields
          customFields={customFields}
          onAddField={addCustomField}
          onDeleteField={deleteCustomField}
          onBack={() => setView("list")}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-2xl shadow-lg text-sm font-medium
          ${toast.type === "error" ? "bg-red-600 text-white" : "bg-black text-white"}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black flex items-center justify-center text-white flex-shrink-0">
            <Music2 size={20} />
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900">TikTok Ads Manager</h1>
            <p className="text-xs text-gray-400">Manage and track your TikTok campaigns</p>
          </div>
        </div>
      </div>

      {entryPanelCampaign && (
        <TiktokDailyEntryPanel
          campaign={entryPanelCampaign}
          customFields={customFields}
          onClose={() => setEntryPanelCampaign(null)}
          onSaved={() => {
            const effectiveEnd = tableEndDate || tableDate || todayISO();
            fetchDailyData(tableDate || todayISO(), effectiveEnd, campaigns);
          }}
        />
      )}

      <div className="px-6 py-4">
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <TiktokCampaignList
            campaigns={campaigns}
            customFields={customFields}
            loading={false}
            visibleColumns={visibleColumns}
            toggleColumn={toggleColumn}
            onCreateClick={openCreate}
            onManageFieldsClick={() => setView("fields")}
            onEdit={openEdit}
            onToggle={toggleCampaign}
            onDuplicate={duplicateCampaign}
            onDelete={deleteCampaign}
            userRole={user?.role}
            tableDate={tableDate}
            onTableDateChange={setTableDate}
            tableEndDate={tableEndDate}
            onTableEndDateChange={setTableEndDate}
            dailyDataMap={dailyDataMap}
            loadingDaily={loadingDaily}
            onOpenDailyEntry={setEntryPanelCampaign}
          />
        </div>
      </div>
    </div>
  );
}
