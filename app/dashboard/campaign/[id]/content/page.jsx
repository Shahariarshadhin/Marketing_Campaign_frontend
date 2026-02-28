"use client";
import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useAuthFetch } from "@/hooks/useAuthFetch";
import {
  ArrowLeft, Eye, Facebook, Film, ImageIcon, Link2,
  Loader2, Plus, Save, Trash2, Upload, Youtube, X, ExternalLink,
  ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL;

export default function CampaignContentEditor() {
  const { id: campaignId } = useParams();
  const router = useRouter();
  const { user, loading } = useAuth();
  const authFetch = useAuthFetch();
  const redirected = useRef(false);
  const fileInputRef = useRef(null);

  const [campaign, setCampaign]   = useState(null);
  const [content, setContent]     = useState(null);
  const [fetching, setFetching]   = useState(true);
  const [saving, setSaving]       = useState(false);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(false);
  const [lightbox, setLightbox]   = useState(null);
  const [dragOver, setDragOver]   = useState(false);
  const [toast, setToast]         = useState(null);

  const [youtubeUrl,  setYoutubeUrl]  = useState('');
  const [facebookUrl, setFacebookUrl] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (loading || redirected.current) return;
    if (!user) { redirected.current = true; router.replace("/login"); }
    else if (user.role !== "admin") { redirected.current = true; router.replace("/viewer"); }
  }, [user, loading]);

  useEffect(() => {
    if (!user || user.role !== "admin") return;
    Promise.all([
      authFetch(`${API}/campaigns/${campaignId}`).then(r => r.json()),
      authFetch(`${API}/campaign-content/${campaignId}`).then(r => r.json()),
    ]).then(([campData, contentData]) => {
      if (campData.success) setCampaign(campData.data);
      if (contentData.success && contentData.data) {
        const c = contentData.data;
        setContent(c);
        setYoutubeUrl(c.youtubeUrl || '');
        setFacebookUrl(c.facebookUrl || '');
        setDescription(c.description || '');
      }
    }).finally(() => setFetching(false));
  }, [user, campaignId]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSaveLinks = async () => {
    setSaving(true);
    try {
      const res = await authFetch(`${API}/campaign-content/${campaignId}/links`, {
        method: 'PUT',
        body: JSON.stringify({ youtubeUrl, facebookUrl, description }),
      });
      const data = await res.json();
      if (data.success) { setContent(data.data); showToast('Saved!'); }
      else showToast(data.message, 'error');
    } catch { showToast('Failed to save', 'error'); }
    finally { setSaving(false); }
  };

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach(f => formData.append('media', f));
    formData.append('youtubeUrl', youtubeUrl);
    formData.append('facebookUrl', facebookUrl);
    formData.append('description', description);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
      const res = await fetch(`${API}/campaign-content/${campaignId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.success) { setContent(data.data); showToast(`${files.length} file(s) uploaded!`); }
      else showToast(data.message, 'error');
    } catch { showToast('Upload failed', 'error'); }
    finally { setUploading(false); }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (!confirm('Delete this media?')) return;
    try {
      const res = await authFetch(`${API}/campaign-content/${campaignId}/media/${mediaId}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) { setContent(data.data); showToast('Deleted'); }
    } catch { showToast('Delete failed', 'error'); }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const images = content?.media?.filter(m => m.type === 'image') || [];
  const videos = content?.media?.filter(m => m.type === 'video') || [];

  if (loading || fetching) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen flex items-center justify-center text-gray-500">Campaign not found</div>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium
          ${toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/campaign" className="p-2 hover:bg-gray-100 rounded-lg transition">
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <div>
            <h1 className="font-semibold text-gray-800 text-lg">{campaign.name}</h1>
            <p className="text-xs text-gray-500">Content Editor</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setPreview(!preview)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
              ${preview ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
            <Eye size={16} /> {preview ? 'Edit Mode' : 'Preview'}
          </button>
          <Link href={`/viewer/campaign/${campaignId}`} target="_blank"
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition">
            <ExternalLink size={16} /> Viewer View
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-6 space-y-6">
        {preview ? (
          <ContentPreview
            youtubeUrl={youtubeUrl} facebookUrl={facebookUrl}
            description={description} images={images} videos={videos}
            onLightbox={(items, idx) => setLightbox({ items, index: idx })}
          />
        ) : (
          <>
            {/* Links */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <Link2 size={18} className="text-blue-500" /> Links & Description
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <Youtube size={16} className="text-red-500" /> YouTube Video URL
                  </label>
                  <input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <Facebook size={16} className="text-blue-600" /> Facebook Post URL
                  </label>
                  <input value={facebookUrl} onChange={e => setFacebookUrl(e.target.value)}
                    placeholder="https://facebook.com/..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description / Notes</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)}
                    rows={3} placeholder="Add campaign notes visible to the viewer..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>
                <div className="flex justify-end">
                  <button onClick={handleSaveLinks} disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition">
                    {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                    {saving ? 'Saving...' : 'Save Links'}
                  </button>
                </div>
              </div>
            </div>

            {/* Upload */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-base font-semibold text-gray-800 mb-5 flex items-center gap-2">
                <Upload size={18} className="text-purple-500" /> Media Upload
              </h2>
              <div
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={onDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition
                  ${dragOver ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'}`}>
                {uploading ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 size={32} className="animate-spin text-blue-500" />
                    <p className="text-sm text-gray-600 font-medium">Uploading to Cloudinary...</p>
                    <p className="text-xs text-gray-400">Large videos may take a moment</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl flex items-center justify-center">
                      <Upload size={26} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-700">Drop files here or click to browse</p>
                      <p className="text-xs text-gray-400 mt-1">Images & Videos · Max 100MB each · Multiple files supported</p>
                    </div>
                  </div>
                )}
              </div>
              <input ref={fileInputRef} type="file" multiple accept="image/*,video/*"
                className="hidden" onChange={e => handleFileUpload(e.target.files)} />
            </div>

            {/* Images grid */}
            {images.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-green-500">🖼</span> Images
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{images.length}</span>
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {images.map((img, idx) => (
                    <div key={img._id} className="group relative aspect-square rounded-xl overflow-hidden bg-gray-100 cursor-pointer"
                      onClick={() => setLightbox({ items: images, index: idx })}>
                      <img src={img.url} alt={img.originalName} className="w-full h-full object-cover transition group-hover:scale-105" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition flex items-center justify-center">
                        <button onClick={e => { e.stopPropagation(); handleDeleteMedia(img._id); }}
                          className="opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-full transition">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span className="text-orange-500">🎬</span> Videos
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{videos.length}</span>
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {videos.map(vid => (
                    <div key={vid._id} className="group relative rounded-xl overflow-hidden bg-gray-900">
                      <video src={vid.url} controls className="w-full aspect-video object-contain" />
                      <button onClick={() => handleDeleteMedia(vid._id)}
                        className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition">
                        <Trash2 size={14} />
                      </button>
                      <p className="text-xs text-gray-400 truncate px-3 py-2 bg-gray-900">{vid.originalName}</p>
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

function ContentPreview({ youtubeUrl, facebookUrl, description, images, videos, onLightbox }) {
  const getYoutubeEmbed = (url) => {
    if (!url) return null;
    const match = url.match(/(?:v=|youtu\.be\/)([^&\s]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };
  const embedUrl = getYoutubeEmbed(youtubeUrl);

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-sm text-amber-700 flex items-center gap-2">
        <Eye size={15} /> Preview — this is what viewers will see
      </div>
      {description && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{description}</p>
        </div>
      )}
      {embedUrl && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Youtube size={16} className="text-red-500" /> YouTube Video
          </h3>
          <div className="aspect-video rounded-xl overflow-hidden bg-gray-900">
            <iframe src={embedUrl} className="w-full h-full" allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
          </div>
        </div>
      )}
      {facebookUrl && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Facebook size={16} className="text-blue-600" /> Facebook Post
          </h3>
          <a href={facebookUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 hover:bg-blue-100 transition text-sm font-medium">
            <Facebook size={20} /> View Facebook Post <ExternalLink size={14} className="ml-auto" />
          </a>
        </div>
      )}
      {images.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Images ({images.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {images.map((img, idx) => (
              <div key={img._id} onClick={() => onLightbox(images, idx)}
                className="aspect-square rounded-xl overflow-hidden cursor-pointer hover:opacity-90 transition">
                <img src={img.url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}
      {videos.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Videos ({videos.length})</h3>
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