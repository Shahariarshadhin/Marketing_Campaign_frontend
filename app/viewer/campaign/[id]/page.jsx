// "use client";
// import { useEffect, useRef, useState } from "react";
// import { useParams, useRouter } from "next/navigation";
// import { useAuth } from "@/context/AuthContext";
// import { useAuthFetch } from "@/hooks/useAuthFetch";
// import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Facebook, Film, Loader2, X, Youtube } from "lucide-react";
// import Link from "next/link";

// const API = process.env.NEXT_PUBLIC_API_URL;

// export default function ViewerCampaignContent() {
//   const { id: campaignId } = useParams();
//   const router = useRouter();
//   const { user, loading } = useAuth();
//   const authFetch = useAuthFetch();
//   const redirected = useRef(false);

//   const [campaign, setCampaign]   = useState(null);
//   const [content, setContent]     = useState(null);
//   const [fetching, setFetching]   = useState(true);
//   const [lightbox, setLightbox]   = useState(null);
//   const [error, setError]         = useState('');

//   useEffect(() => {
//     if (loading || redirected.current) return;
//     if (!user) { redirected.current = true; router.replace("/login"); }
//   }, [user, loading]);

//   useEffect(() => {
//     if (!user) return;
//     Promise.all([
//       authFetch(`${API}/campaigns/${campaignId}`).then(r => r.json()),
//       authFetch(`${API}/campaign-content/${campaignId}`).then(r => r.json()),
//     ]).then(([campData, contentData]) => {
//       if (campData.success) setCampaign(campData.data);
//       else setError('Campaign not found or access denied');
//       if (contentData.success) setContent(contentData.data);
//     }).catch(() => setError('Failed to load content'))
//       .finally(() => setFetching(false));
//   }, [user, campaignId]);

//   const getYoutubeEmbed = (url) => {
//     if (!url) return null;
//     const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
//     return match ? `https://www.youtube.com/embed/${match[1]}` : null;
//   };

//   const images = content?.media?.filter(m => m.type === 'image') || [];
//   const videos = content?.media?.filter(m => m.type === 'video') || [];
//   const embedUrl = getYoutubeEmbed(content?.youtubeUrl);
//   const backUrl = user?.role === 'admin' ? '/dashboard/campaign' : '/viewer';

//   if (loading || fetching) return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50">
//       <Loader2 className="animate-spin text-blue-600" size={32} />
//     </div>
//   );

//   if (error || !campaign) return (
//     <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
//       <p className="text-gray-500">{error || 'Campaign not found'}</p>
//       <Link href={backUrl} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
//         <ArrowLeft size={14} /> Go back
//       </Link>
//     </div>
//   );

//   const hasContent = content && (
//     content.youtubeUrl || content.facebookUrl || content.description ||
//     images.length > 0 || videos.length > 0
//   );

//   return (
//     <div className="min-h-screen bg-gray-50">
//       {/* Header */}
//       <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
//         <Link href={backUrl} className="p-2 hover:bg-gray-100 rounded-lg transition">
//           <ArrowLeft size={20} className="text-gray-600" />
//         </Link>
//         <div>
//           <h1 className="font-semibold text-gray-800 text-lg">{campaign.name}</h1>
//           <div className="flex items-center gap-2 mt-0.5">
//             <span className={`w-2 h-2 rounded-full ${campaign.active ? 'bg-green-500' : 'bg-gray-400'}`} />
//             <p className="text-xs text-gray-500">{campaign.delivery} · {campaign.status}</p>
//           </div>
//         </div>
//       </div>

//       <div className="max-w-4xl mx-auto p-6 space-y-6">
//         {!hasContent ? (
//           <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
//             <div className="text-5xl mb-4">📋</div>
//             <p className="text-gray-500 font-medium">No content added yet</p>
//             <p className="text-gray-400 text-sm mt-1">The administrator hasn&apos;t added content for this campaign.</p>
//           </div>
//         ) : (
//           <>
//             {/* Description */}
//             {content?.description && (
//               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
//                 <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content.description}</p>
//               </div>
//             )}

//             {/* YouTube */}
//             {embedUrl && (
//               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
//                 <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                   <Youtube size={18} className="text-red-500" /> YouTube Video
//                 </h2>
//                 <div className="aspect-video rounded-xl overflow-hidden bg-gray-900">
//                   <iframe src={embedUrl} className="w-full h-full" allowFullScreen
//                     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
//                 </div>
//                 <a href={content.youtubeUrl} target="_blank" rel="noopener noreferrer"
//                   className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition w-fit">
//                   <ExternalLink size={12} /> Open on YouTube
//                 </a>
//               </div>
//             )}

//             {/* Facebook */}
//             {content?.facebookUrl && (
//               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
//                 <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                   <Facebook size={18} className="text-blue-600" /> Facebook Post
//                 </h2>
//                 <a href={content.facebookUrl} target="_blank" rel="noopener noreferrer"
//                   className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 hover:bg-blue-100 transition font-medium">
//                   <Facebook size={22} className="text-blue-600 flex-shrink-0" />
//                   <span className="flex-1 min-w-0 text-sm truncate">{content.facebookUrl}</span>
//                   <ExternalLink size={16} className="flex-shrink-0" />
//                 </a>
//               </div>
//             )}

//             {/* Images */}
//             {images.length > 0 && (
//               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
//                 <h2 className="text-sm font-semibold text-gray-700 mb-4">
//                   Images <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{images.length}</span>
//                 </h2>
//                 <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
//                   {images.map((img, idx) => (
//                     <div key={img._id} onClick={() => setLightbox({ items: images, index: idx })}
//                       className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition bg-gray-100">
//                       <img src={img.url} alt="" className="w-full h-full object-cover" />
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}

//             {/* Videos */}
//             {videos.length > 0 && (
//               <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
//                 <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
//                   <Film size={16} className="text-orange-500" /> Videos
//                   <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{videos.length}</span>
//                 </h2>
//                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
//                   {videos.map(vid => (
//                     <div key={vid._id} className="rounded-xl overflow-hidden bg-gray-900">
//                       <video src={vid.url} controls className="w-full aspect-video object-contain" />
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </>
//         )}
//       </div>

//       {lightbox && (
//         <Lightbox items={lightbox.items} startIndex={lightbox.index} onClose={() => setLightbox(null)} />
//       )}
//     </div>
//   );
// }

// function Lightbox({ items, startIndex, onClose }) {
//   const [idx, setIdx] = useState(startIndex);

//   useEffect(() => {
//     const handler = (e) => {
//       if (e.key === 'Escape') onClose();
//       if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, items.length - 1));
//       if (e.key === 'ArrowLeft')  setIdx(i => Math.max(i - 1, 0));
//     };
//     window.addEventListener('keydown', handler);
//     return () => window.removeEventListener('keydown', handler);
//   }, [items.length, onClose]);

//   return (
//     <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
//       <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white">
//         <X size={26} />
//       </button>
//       {idx > 0 && (
//         <button onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }}
//           className="absolute left-4 p-3 text-white bg-white/10 hover:bg-white/20 rounded-full transition">
//           <ChevronLeft size={22} />
//         </button>
//       )}
//       <img src={items[idx].url} alt="" className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
//         onClick={e => e.stopPropagation()} />
//       {idx < items.length - 1 && (
//         <button onClick={e => { e.stopPropagation(); setIdx(i => i + 1); }}
//           className="absolute right-4 p-3 text-white bg-white/10 hover:bg-white/20 rounded-full transition">
//           <ChevronRight size={22} />
//         </button>
//       )}
//       <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
//         {idx + 1} / {items.length}
//       </p>
//     </div>
//   );
// }


"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import {
  ArrowLeft, ChevronLeft, ChevronRight, ExternalLink,
  Facebook, Film, Loader2, X, Youtube, BarChart2,
  TrendingUp, DollarSign, Eye, Users
} from "lucide-react";
import Link from "next/link";
import DateRangePicker from "@/components/DashboardManagement/CampaignManagement/DateRangePicker";


const API = process.env.NEXT_PUBLIC_API_URL;

const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", {
  day: "2-digit", month: "short", year: "numeric"
});

// Summary stat card
function StatCard({ icon, label, value, color }) {
  const colors = {
    blue:   "bg-blue-50 text-blue-600 border-blue-100",
    green:  "bg-green-50 text-green-600 border-green-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
    rose:   "bg-rose-50 text-rose-600 border-rose-100",
    teal:   "bg-teal-50 text-teal-600 border-teal-100",
  };
  return (
    <div className={`rounded-2xl border p-5 ${colors[color] || colors.blue}`}>
      <div className="flex items-center gap-2 mb-2 opacity-70">
        {icon}
        <span className="text-xs font-semibold uppercase tracking-wide">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value || "—"}</p>
    </div>
  );
}

export default function ViewerCampaignPage() {
  const { id: campaignId } = useParams();
  const router  = useRouter();
  const { user, loading } = useAuth();
  const authFetch = useAuthFetch();
  const redirected = useRef(false);

  const [campaign, setCampaign]   = useState(null);
  const [content, setContent]     = useState(null);
  const [summary, setSummary]     = useState(null);
  const [daily, setDaily]         = useState([]);
  const [customFields, setCustomFields] = useState([]);
  const [fetching, setFetching]   = useState(true);
  const [filtering, setFiltering] = useState(false);
  const [lightbox, setLightbox]   = useState(null);
  const [error, setError]         = useState("");
  const [activeTab, setActiveTab] = useState("metrics"); // metrics | media

  // Date range state
  const [rangeStart, setRangeStart] = useState("");
  const [rangeEnd, setRangeEnd]     = useState("");
  const [hasFilter, setHasFilter]   = useState(false);

  useEffect(() => {
    if (loading || redirected.current) return;
    if (!user) { redirected.current = true; router.replace("/login"); }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    loadAll("", "");
  }, [user, campaignId]);

  const buildQuery = (start, end) => {
    const p = [];
    if (start) p.push(`startDate=${start}`);
    if (end)   p.push(`endDate=${end}`);
    return p.length ? `?${p.join("&")}` : "";
  };

  const loadAll = async (start, end) => {
    setFetching(true);
    try {
      const [campRes, contentRes, summaryRes, cfRes] = await Promise.all([
        authFetch(`${API}/campaigns/${campaignId}`).then(r => r.json()),
        authFetch(`${API}/campaign-content/${campaignId}`).then(r => r.json()),
        authFetch(`${API}/metrics/${campaignId}/summary${buildQuery(start, end)}`).then(r => r.json()),
        authFetch(`${API}/custom-fields`).then(r => r.json()),
      ]);
      if (campRes.success) setCampaign(campRes.data);
      else setError("Campaign not found or access denied");
      if (contentRes.success) setContent(contentRes.data);
      if (summaryRes.success) {
        setSummary(summaryRes.data);
        setDaily(summaryRes.data?.daily || []);
      }
      if (cfRes.success) setCustomFields(cfRes.data || []);
    } catch { setError("Failed to load data"); }
    finally { setFetching(false); }
  };

  const handleDateFilter = async (start, end) => {
    setFiltering(true);
    setRangeStart(start);
    setRangeEnd(end);
    setHasFilter(!!(start || end));
    try {
      const res = await authFetch(`${API}/metrics/${campaignId}/summary${buildQuery(start, end)}`);
      const data = await res.json();
      if (data.success) {
        setSummary(data.data);
        setDaily(data.data?.daily || []);
      }
    } finally { setFiltering(false); }
  };

  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    const m = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
    return m ? `https://www.youtube.com/embed/${m[1]}` : null;
  };

  const images  = content?.media?.filter(m => m.type === "image") || [];
  const videos  = content?.media?.filter(m => m.type === "video") || [];
  const embedUrl = getYoutubeEmbed(content?.youtubeUrl);
  const hasMedia = content && (embedUrl || content.facebookUrl || content.description || images.length || videos.length);
  const backUrl  = user?.role === "admin" ? "/dashboard/campaign" : "/viewer";

  // Visible fields for this viewer (for daily table columns)
  const allowedKeys = user?.visibleFields?.length
    ? user.visibleFields.filter(k => !k.startsWith("custom_"))
    : ["results", "costPerResult", "budget", "amountSpent", "impressions", "reach", "actions", "delivery"];

  const LABELS = {
    results: "Results", costPerResult: "Cost/Result", budget: "Budget",
    amountSpent: "Spent", impressions: "Impressions", reach: "Reach",
    actions: "Actions", delivery: "Delivery",
  };

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  if (error || !campaign) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
      <p className="text-gray-500">{error || "Campaign not found"}</p>
      <Link href={backUrl} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
        <ArrowLeft size={14} /> Go back
      </Link>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href={backUrl} className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="font-semibold text-gray-800 text-lg">{campaign.name}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${campaign.active ? "bg-green-500" : "bg-gray-400"}`} />
              <p className="text-xs text-gray-500">{campaign.status}</p>
            </div>
          </div>
        </div>
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 gap-1">
          <button onClick={() => setActiveTab("metrics")}
            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition
              ${activeTab === "metrics" ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
            📊 Metrics
          </button>
          {hasMedia && (
            <button onClick={() => setActiveTab("media")}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition
                ${activeTab === "media" ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}>
              🎬 Media
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-6">

        {/* ── METRICS TAB ── */}
        {activeTab === "metrics" && (
          <>
            {/* Date range picker */}
            <DateRangePicker
              onApply={handleDateFilter}
              loading={filtering}
              resultCount={hasFilter ? daily.length : null}
            />

            {/* No data */}
            {!summary && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
                <BarChart2 size={40} className="text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400 font-medium">No metrics data yet</p>
                <p className="text-gray-400 text-sm mt-1">
                  {hasFilter ? "No records in this date range." : "Data will appear once the admin adds daily records."}
                </p>
              </div>
            )}

            {summary && (
              <>
                {/* Range info */}
                <div className="flex items-center gap-3 text-sm text-gray-500">
                  <BarChart2 size={15} className="text-blue-500" />
                  <span>
                    Showing data for{" "}
                    <strong className="text-gray-700">{fmtDate(summary.dateRange.from)}</strong>
                    {" "}→{" "}
                    <strong className="text-gray-700">{fmtDate(summary.dateRange.to)}</strong>
                    {" "}({summary.dateRange.days} day{summary.dateRange.days !== 1 ? "s" : ""})
                  </span>
                </div>

                {/* Summary stat cards — only show allowed fields */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {allowedKeys.includes("results") && (
                    <StatCard icon={<TrendingUp size={15} />} label="Results" value={summary.results} color="blue" />
                  )}
                  {allowedKeys.includes("amountSpent") && (
                    <StatCard icon={<DollarSign size={15} />} label="Amount Spent" value={summary.amountSpent} color="rose" />
                  )}
                  {allowedKeys.includes("impressions") && (
                    <StatCard icon={<Eye size={15} />} label="Impressions" value={summary.impressions} color="purple" />
                  )}
                  {allowedKeys.includes("reach") && (
                    <StatCard icon={<Users size={15} />} label="Reach" value={summary.reach} color="teal" />
                  )}
                  {allowedKeys.includes("costPerResult") && (
                    <StatCard icon={<DollarSign size={15} />} label="Cost/Result" value={summary.costPerResult} color="orange" />
                  )}
                  {allowedKeys.includes("budget") && (
                    <StatCard icon={<DollarSign size={15} />} label="Budget" value={summary.budget} color="green" />
                  )}
                  {allowedKeys.includes("actions") && (
                    <StatCard icon={<TrendingUp size={15} />} label="Actions" value={summary.actions} color="blue" />
                  )}
                  {/* Custom field summary cards */}
                  {customFields.filter(cf =>
                    !user?.visibleFields?.length || user.visibleFields.includes(`custom_${cf.name}`)
                  ).map(cf => (
                    <StatCard key={cf._id} icon={<BarChart2 size={15} />}
                      label={cf.label}
                      value={daily[daily.length - 1]?.customFields?.[cf.name] || "—"}
                      color="purple" />
                  ))}
                </div>

                {/* Daily breakdown table */}
                {daily.length > 0 && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h3 className="text-sm font-semibold text-gray-700">Daily Breakdown</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 border-b border-gray-100">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap sticky left-0 bg-gray-50">
                              Date
                            </th>
                            {allowedKeys.map(k => (
                              <th key={k} className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wide whitespace-nowrap">
                                {LABELS[k] || k}
                              </th>
                            ))}
                            {customFields.filter(cf =>
                              !user?.visibleFields?.length || user.visibleFields.includes(`custom_${cf.name}`)
                            ).map(cf => (
                              <th key={cf._id} className="px-4 py-3 text-left text-xs font-semibold text-purple-500 uppercase tracking-wide whitespace-nowrap">
                                {cf.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {daily.map((row, idx) => (
                            <tr key={idx} className="hover:bg-gray-50 transition">
                              <td className="px-4 py-3 font-medium text-gray-700 whitespace-nowrap sticky left-0 bg-inherit">
                                {fmtDate(row.date)}
                              </td>
                              {allowedKeys.map(k => (
                                <td key={k} className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                  {row[k] || "—"}
                                </td>
                              ))}
                              {customFields.filter(cf =>
                                !user?.visibleFields?.length || user.visibleFields.includes(`custom_${cf.name}`)
                              ).map(cf => (
                                <td key={cf._id} className="px-4 py-3 text-gray-600 whitespace-nowrap">
                                  {row.customFields?.[cf.name] || "—"}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {/* ── MEDIA TAB ── */}
        {activeTab === "media" && hasMedia && (
          <div className="space-y-6">
            {content?.description && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content.description}</p>
              </div>
            )}
            {embedUrl && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Youtube size={18} className="text-red-500" /> YouTube Video
                </h3>
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-900">
                  <iframe src={embedUrl} className="w-full h-full" allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
              </div>
            )}
            {content?.facebookUrl && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Facebook size={18} className="text-blue-600" /> Facebook Post
                </h3>
                <a href={content.facebookUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 hover:bg-blue-100 transition font-medium">
                  <Facebook size={20} />
                  <span className="flex-1 text-sm truncate">{content.facebookUrl}</span>
                  <ExternalLink size={14} />
                </a>
              </div>
            )}
            {images.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Images ({images.length})</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div key={img._id} onClick={() => setLightbox({ items: images, index: idx })}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 bg-gray-100">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {videos.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Film size={16} className="text-orange-500" /> Videos ({videos.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.map(vid => (
                    <div key={vid._id} className="rounded-xl overflow-hidden bg-gray-900">
                      <video src={vid.url} controls className="w-full aspect-video" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {lightbox && <Lightbox items={lightbox.items} startIndex={lightbox.index} onClose={() => setLightbox(null)} />}
    </div>
  );
}

function Lightbox({ items, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);
  useEffect(() => {
    const h = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") setIdx(i => Math.min(i + 1, items.length - 1));
      if (e.key === "ArrowLeft")  setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [items.length, onClose]);
  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white"><X size={26} /></button>
      {idx > 0 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }}
          className="absolute left-4 p-3 text-white bg-white/10 hover:bg-white/20 rounded-full transition">
          <ChevronLeft size={22} />
        </button>
      )}
      <img src={items[idx].url} alt="" className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain" onClick={e => e.stopPropagation()} />
      {idx < items.length - 1 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => i + 1); }}
          className="absolute right-4 p-3 text-white bg-white/10 hover:bg-white/20 rounded-full transition">
          <ChevronRight size={22} />
        </button>
      )}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">{idx + 1} / {items.length}</p>
    </div>
  );
}