"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import { ArrowLeft, ChevronLeft, ChevronRight, ExternalLink, Facebook, Film, Loader2, X, Youtube } from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function ViewerCampaignContent() {
  const { id: campaignId } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const authFetch = useAuthFetch();
  const redirected = useRef(false);

  const [campaign, setCampaign]   = useState(null);
  const [content, setContent]     = useState(null);
  const [fetching, setFetching]   = useState(true);
  const [lightbox, setLightbox]   = useState(null);
  const [error, setError]         = useState('');

  useEffect(() => {
    if (loading || redirected.current) return;
    if (!user) { redirected.current = true; router.replace("/login"); }
  }, [user, loading]);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      authFetch(`${API}/campaigns/${campaignId}`).then(r => r.json()),
      authFetch(`${API}/campaign-content/${campaignId}`).then(r => r.json()),
    ]).then(([campData, contentData]) => {
      if (campData.success) setCampaign(campData.data);
      else setError('Campaign not found or access denied');
      if (contentData.success) setContent(contentData.data);
    }).catch(() => setError('Failed to load content'))
      .finally(() => setFetching(false));
  }, [user, campaignId]);

  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const images = content?.media?.filter(m => m.type === 'image') || [];
  const videos = content?.media?.filter(m => m.type === 'video') || [];
  const embedUrl = getYoutubeEmbed(content?.youtubeUrl);
  const backUrl = user?.role === 'admin' ? '/dashboard/campaign' : '/viewer';

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  if (error || !campaign) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
      <p className="text-gray-500">{error || 'Campaign not found'}</p>
      <Link href={backUrl} className="text-blue-600 text-sm hover:underline flex items-center gap-1">
        <ArrowLeft size={14} /> Go back
      </Link>
    </div>
  );

  const hasContent = content && (
    content.youtubeUrl || content.facebookUrl || content.description ||
    images.length > 0 || videos.length > 0
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-30">
        <Link href={backUrl} className="p-2 hover:bg-gray-100 rounded-lg transition">
          <ArrowLeft size={20} className="text-gray-600" />
        </Link>
        <div>
          <h1 className="font-semibold text-gray-800 text-lg">{campaign.name}</h1>
          <div className="flex items-center gap-2 mt-0.5">
            <span className={`w-2 h-2 rounded-full ${campaign.active ? 'bg-green-500' : 'bg-gray-400'}`} />
            <p className="text-xs text-gray-500">{campaign.delivery} · {campaign.status}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {!hasContent ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-16 text-center">
            <div className="text-5xl mb-4">📋</div>
            <p className="text-gray-500 font-medium">No content added yet</p>
            <p className="text-gray-400 text-sm mt-1">The administrator hasn&apos;t added content for this campaign.</p>
          </div>
        ) : (
          <>
            {/* Description */}
            {content?.description && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{content.description}</p>
              </div>
            )}

            {/* YouTube */}
            {embedUrl && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Youtube size={18} className="text-red-500" /> YouTube Video
                </h2>
                <div className="aspect-video rounded-xl overflow-hidden bg-gray-900">
                  <iframe src={embedUrl} className="w-full h-full" allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                </div>
                <a href={content.youtubeUrl} target="_blank" rel="noopener noreferrer"
                  className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 hover:text-red-500 transition w-fit">
                  <ExternalLink size={12} /> Open on YouTube
                </a>
              </div>
            )}

            {/* Facebook */}
            {content?.facebookUrl && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Facebook size={18} className="text-blue-600" /> Facebook Post
                </h2>
                <a href={content.facebookUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 hover:bg-blue-100 transition font-medium">
                  <Facebook size={22} className="text-blue-600 flex-shrink-0" />
                  <span className="flex-1 min-w-0 text-sm truncate">{content.facebookUrl}</span>
                  <ExternalLink size={16} className="flex-shrink-0" />
                </a>
              </div>
            )}

            {/* Images */}
            {images.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4">
                  Images <span className="ml-1.5 text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{images.length}</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {images.map((img, idx) => (
                    <div key={img._id} onClick={() => setLightbox({ items: images, index: idx })}
                      className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition bg-gray-100">
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                  <Film size={16} className="text-orange-500" /> Videos
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{videos.length}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.map(vid => (
                    <div key={vid._id} className="rounded-xl overflow-hidden bg-gray-900">
                      <video src={vid.url} controls className="w-full aspect-video object-contain" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {lightbox && (
        <Lightbox items={lightbox.items} startIndex={lightbox.index} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

function Lightbox({ items, startIndex, onClose }) {
  const [idx, setIdx] = useState(startIndex);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setIdx(i => Math.min(i + 1, items.length - 1));
      if (e.key === 'ArrowLeft')  setIdx(i => Math.max(i - 1, 0));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [items.length, onClose]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/70 hover:text-white">
        <X size={26} />
      </button>
      {idx > 0 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => i - 1); }}
          className="absolute left-4 p-3 text-white bg-white/10 hover:bg-white/20 rounded-full transition">
          <ChevronLeft size={22} />
        </button>
      )}
      <img src={items[idx].url} alt="" className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain"
        onClick={e => e.stopPropagation()} />
      {idx < items.length - 1 && (
        <button onClick={e => { e.stopPropagation(); setIdx(i => i + 1); }}
          className="absolute right-4 p-3 text-white bg-white/10 hover:bg-white/20 rounded-full transition">
          <ChevronRight size={22} />
        </button>
      )}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/50 text-sm">
        {idx + 1} / {items.length}
      </p>
    </div>
  );
}