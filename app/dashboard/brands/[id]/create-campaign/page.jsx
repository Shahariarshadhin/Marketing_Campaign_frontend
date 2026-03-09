"use client";
// This page is a thin wrapper — it uses the shared CreateCampaign component
// but pre-fills the motherBrand so the dropdown is hidden.
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { Loader2 } from "lucide-react";
import CreateCampaign from "@/components/DashboardManagement/CampaignManagement/CreateCampaign";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CreateCampaignUnderBrand() {
  const { id: brandId } = useParams();
  const router    = useRouter();
  const { user, loading } = useAuth();
  const authFetch = useAuthFetch();
  const redirected = useRef(false);

  const [brand, setBrand]         = useState(null);
  const [customFields, setCF]     = useState([]);
  const [saving, setSaving]       = useState(false);

  const [formData, setFormData] = useState({
    motherBrand: brandId,  // pre-filled — hidden in UI
    name: '', objective: 'awareness', status: 'draft',
    delivery: 'In draft', actions: '', results: '',
    costPerResult: '', bidStrategy: 'lowest_cost',
    budgetType: 'daily', dailyBudget: '', lifetimeBudget: '',
    budget: '', amountSpent: '', impressions: '', reach: '',
    startDate: '', endDate: '', targetAudience: '',
    placement: 'automatic', active: false, customFieldsData: {}
  });

  useEffect(() => {
    if (loading || redirected.current) return;
    if (!user)               { redirected.current = true; router.replace('/login'); return; }
    if (user.role !== 'admin') { redirected.current = true; router.replace(`/dashboard/brands/${brandId}`); }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      authFetch(`${API}/mother-brands/${brandId}`).then(r => r.json()),
      authFetch(`${API}/custom-fields`).then(r => r.json()),
    ]).then(([b, cf]) => {
      if (b.success) setBrand(b.data);
      if (cf.success) setCF(cf.data || []);
    });
  }, [user, brandId]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) { alert('Campaign name is required'); return; }
    setSaving(true);
    try {
      const budget = formData.budgetType === 'daily'
        ? `$${formData.dailyBudget}/day`
        : `$${formData.lifetimeBudget} lifetime`;

      const payload = {
        motherBrand:   brandId,
        name:          formData.name,
        objective:     formData.objective,
        status:        formData.status,
        delivery:      formData.delivery || (formData.status === 'active' ? 'Active' : 'In draft'),
        actions:       formData.actions,
        results:       formData.results    || '—',
        costPerResult: formData.costPerResult || '—',
        bidStrategy:   formData.bidStrategy,
        dailyBudget:   formData.dailyBudget,
        lifetimeBudget:formData.lifetimeBudget,
        budget:        formData.budget     || budget,
        amountSpent:   formData.amountSpent|| '$0.00',
        impressions:   formData.impressions|| '—',
        reach:         formData.reach      || '—',
        startDate:     formData.startDate,
        endDate:       formData.endDate    || 'Ongoing',
        targetAudience:formData.targetAudience,
        placement:     formData.placement,
        active:        formData.active,
        customFields:  formData.customFieldsData,
      };

      const res  = await authFetch(`${API}/campaigns`, { method: 'POST', body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.success) router.push(`/dashboard/brands/${brandId}`);
      else alert(data.message);
    } catch { alert('Failed to create campaign'); }
    finally { setSaving(false); }
  };

  if (loading || !brand) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="animate-spin text-blue-600" size={28} />
    </div>
  );

  return (
    <CreateCampaign
      formData={formData}
      setFormData={setFormData}
      customFields={customFields}
      editingCampaign={null}
      onSubmit={handleSubmit}
      onCancel={() => router.push(`/dashboard/brands/${brandId}`)}
      loading={saving}
      preselectedBrand={brand}   // ← hides the brand dropdown, shows breadcrumb
    />
  );
}