import { useEffect, useState } from 'react';
import {
  Loader2, Image, Video, Music, Mic, Wand2, Trash2, Download,
  Search, Filter, Clapperboard, X, Info, Calendar, Cpu,
  Tag, HardDrive, Maximize2, Play,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { deleteMediaFromStorage } from '../../../lib/mediaDB';

interface MediaAsset {
  id: string;
  type: string;
  title: string;
  prompt: string;
  provider: string;
  status: string;
  result_url: string;
  storage_path: string | null;
  file_size: number;
  metadata: Record<string, unknown>;
  created_at: string;
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  image: Image,
  video: Video,
  music: Music,
  voice: Mic,
  edited: Wand2,
};

const TYPE_FILTERS = ['all', 'image', 'video', 'music', 'voice', 'edited'];

const PROVIDER_LABELS: Record<string, string> = {
  kie_ai: 'KIE.AI',
  nano_banana_pro: 'Nano Banana Pro',
  kling: 'Kling 3.0',
  'kling-3.0/video': 'Kling 3.0',
  'nano-banana-pro': 'Nano Banana Pro',
  gemini: 'Gemini',
  openai: 'OpenAI',
};

const SECTION_FROM_METADATA: Record<string, string> = {
  ugc_image: 'UGC Creator',
  ugc_video: 'UGC Creator',
  carousel_image: 'Ad Carousel',
  carousel_video: 'Ad Carousel',
  cinematic: 'Cinematic Studio',
  image_editing: 'Image Editing',
  text_to_image: 'Text to Image',
  image_to_image: 'Image to Image',
  video_generation: 'Video Generator',
  voice: 'Voice Studio',
  music: 'Music Generator',
};

function getAspectClass(asset: MediaAsset): string {
  const meta = asset.metadata || {};
  const ratio = (meta.aspect_ratio as string) || (meta.aspectRatio as string) || '';
  if (ratio === '9:16') return 'aspect-[9/16]';
  if (ratio === '1:1') return 'aspect-square';
  if (ratio === '4:5') return 'aspect-[4/5]';
  if (ratio === '16:9') return 'aspect-video';
  if (asset.type === 'video') return 'aspect-video';
  return 'aspect-square';
}

function formatFileSize(bytes: number): string {
  if (!bytes || bytes === 0) return '';
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)}KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

interface AssetDetailModalProps {
  asset: MediaAsset;
  onClose: () => void;
  onDelete: (id: string) => void;
  onSelectForUGC?: (imageUrl: string, title: string) => void;
}

function AssetDetailModal({ asset, onClose, onDelete, onSelectForUGC }: AssetDetailModalProps) {
  const isVideo = asset.type === 'video';
  const isAudio = asset.type === 'music' || asset.type === 'voice';
  const hasMedia = asset.result_url && asset.result_url !== 'local';
  const meta = asset.metadata || {};

  const providerLabel = PROVIDER_LABELS[asset.provider] || asset.provider;
  const sectionKey = (meta.source as string) || (meta.section as string) || '';
  const sectionLabel = SECTION_FROM_METADATA[sectionKey] || sectionKey || '—';
  const modelUsed = (meta.model as string) || (meta.model_id as string) || asset.provider || '—';
  const aspectRatio = (meta.aspect_ratio as string) || (meta.aspectRatio as string) || '—';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-dark-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-white/10 text-gray-300 border border-white/10 capitalize flex-shrink-0">
              {asset.type}
            </span>
            <h3 className="text-sm font-bold text-white truncate">{asset.title || 'Untitled'}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          <div className="lg:w-[55%] bg-black flex items-center justify-center p-4 min-h-[280px]">
            {!hasMedia ? (
              <div className="flex flex-col items-center gap-3 text-gray-600">
                {isAudio
                  ? <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B00]/20 to-[#FF9A00]/20 flex items-center justify-center">
                      {isAudio && asset.type === 'music' ? <Music className="w-8 h-8 text-[#FF6B00]" /> : <Mic className="w-8 h-8 text-[#FF6B00]" />}
                    </div>
                  : <Image className="w-12 h-12" />
                }
                <p className="text-sm">No preview available</p>
              </div>
            ) : isVideo ? (
              <video
                src={asset.result_url}
                controls
                autoPlay
                loop
                muted
                playsInline
                className="max-w-full max-h-full rounded-xl object-contain"
                style={{ maxHeight: '65vh' }}
              />
            ) : isAudio ? (
              <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#FF6B00]/20 to-[#FF9A00]/20 flex items-center justify-center">
                  {asset.type === 'music' ? <Music className="w-10 h-10 text-[#FF6B00]" /> : <Mic className="w-10 h-10 text-[#FF6B00]" />}
                </div>
                <audio src={asset.result_url} controls className="w-full" />
              </div>
            ) : (
              <img
                src={asset.result_url}
                alt={asset.title}
                className="max-w-full max-h-full rounded-xl object-contain"
                style={{ maxHeight: '65vh' }}
              />
            )}
          </div>

          <div className="lg:w-[45%] flex flex-col overflow-y-auto border-t lg:border-t-0 lg:border-l border-white/5">
            <div className="p-4 space-y-4 flex-1">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Asset Details
                </p>
                {asset.prompt && (
                  <div className="mb-3">
                    <p className="text-[10px] text-gray-600 mb-1">Prompt</p>
                    <p className="text-xs text-gray-300 leading-relaxed">{asset.prompt}</p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="px-3 py-2 rounded-xl bg-dark-800 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Tag className="w-3 h-3 text-gray-500" />
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider">Section</span>
                  </div>
                  <p className="text-xs text-white font-medium">{sectionLabel}</p>
                </div>
                <div className="px-3 py-2 rounded-xl bg-dark-800 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Cpu className="w-3 h-3 text-gray-500" />
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider">Model</span>
                  </div>
                  <p className="text-xs text-white font-medium truncate">{modelUsed}</p>
                </div>
                <div className="px-3 py-2 rounded-xl bg-dark-800 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Image className="w-3 h-3 text-gray-500" />
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider">Provider</span>
                  </div>
                  <p className="text-xs text-white font-medium">{providerLabel || '—'}</p>
                </div>
                {aspectRatio !== '—' && (
                  <div className="px-3 py-2 rounded-xl bg-dark-800 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Play className="w-3 h-3 text-gray-500" />
                      <span className="text-[9px] text-gray-500 uppercase tracking-wider">Ratio</span>
                    </div>
                    <p className="text-xs text-white font-medium">{aspectRatio}</p>
                  </div>
                )}
                <div className="px-3 py-2 rounded-xl bg-dark-800 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider">Date</span>
                  </div>
                  <p className="text-xs text-white font-medium">{new Date(asset.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
                {asset.file_size > 0 && (
                  <div className="px-3 py-2 rounded-xl bg-dark-800 border border-white/5">
                    <div className="flex items-center gap-1.5 mb-1">
                      <HardDrive className="w-3 h-3 text-gray-500" />
                      <span className="text-[9px] text-gray-500 uppercase tracking-wider">Size</span>
                    </div>
                    <p className="text-xs text-white font-medium">{formatFileSize(asset.file_size)}</p>
                  </div>
                )}
              </div>

              {Object.keys(meta).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Metadata</p>
                  <div className="space-y-1">
                    {Object.entries(meta).map(([k, v]) => (
                      v !== undefined && v !== null && v !== '' && k !== 'source' && k !== 'section' && (
                        <div key={k} className="flex items-start gap-2">
                          <span className="text-[10px] text-gray-600 capitalize min-w-20 flex-shrink-0">{k.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-gray-400 break-all">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 border-t border-white/5 space-y-2">
              {onSelectForUGC && (asset.type === 'image' || asset.type === 'edited') && hasMedia && (
                <button
                  onClick={() => { onSelectForUGC(asset.result_url, asset.title || 'Gallery Image'); onClose(); }}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-sm text-emerald-400 font-medium transition-colors"
                >
                  <Clapperboard className="w-4 h-4" />
                  Use for UGC Video
                </button>
              )}
              <div className="flex gap-2">
                {hasMedia && (
                  <a
                    href={asset.result_url}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white font-medium transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </a>
                )}
                <button
                  onClick={() => { onDelete(asset.id); onClose(); }}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-sm text-red-400 font-medium transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MediaGalleryProps {
  onSelectForUGC?: (imageUrl: string, title: string) => void;
}

export default function MediaGallery({ onSelectForUGC }: MediaGalleryProps = {}) {
  const { user } = useAuth();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<MediaAsset | null>(null);

  useEffect(() => {
    if (user) loadAssets();
  }, [user]);

  const loadAssets = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('media_assets')
      .select('*')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });
    setAssets(data || []);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const asset = assets.find((a) => a.id === id);
    if (asset?.storage_path) {
      await deleteMediaFromStorage(asset.storage_path);
    }
    await supabase.from('media_assets').delete().eq('id', id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    toast.success('Deleted');
  };

  const filtered = assets.filter((a) => {
    if (filter !== 'all' && a.type !== filter) return false;
    if (search && !a.title.toLowerCase().includes(search.toLowerCase()) && !a.prompt.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search media..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]"
          />
        </div>
        <div className="flex gap-1 p-1 bg-dark-800 rounded-xl border border-white/5">
          {TYPE_FILTERS.map((t) => (
            <button
              key={t}
              onClick={() => setFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all ${
                filter === t ? 'gradient-orange text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <Filter className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400">No media assets found</p>
          <p className="text-xs text-gray-600 mt-1">Generate images, videos, or audio to see them here</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filtered.map((asset) => {
            const Icon = TYPE_ICONS[asset.type] || Image;
            const isVideo = asset.type === 'video';
            const isAudio = asset.type === 'music' || asset.type === 'voice';
            const hasMedia = asset.result_url && asset.result_url !== 'local';
            const aspectClass = getAspectClass(asset);

            return (
              <div
                key={asset.id}
                className="break-inside-avoid glass-card rounded-xl overflow-hidden group cursor-pointer hover:border-white/20 border border-white/5 transition-all"
                onClick={() => setSelectedAsset(asset)}
              >
                <div className={`relative bg-dark-800 overflow-hidden ${isAudio ? 'aspect-video' : aspectClass}`}>
                  {isAudio ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-dark-800 to-dark-900">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#FF6B00]/20 to-[#FF9A00]/20 flex items-center justify-center">
                        <Icon className="w-7 h-7 text-[#FF6B00]" />
                      </div>
                      {hasMedia && (
                        <audio src={asset.result_url} controls className="w-full px-3" onClick={(e) => e.stopPropagation()} />
                      )}
                    </div>
                  ) : isVideo ? (
                    hasMedia ? (
                      <>
                        <video
                          src={asset.result_url}
                          muted
                          loop
                          playsInline
                          autoPlay
                          className="w-full h-full object-contain bg-black pointer-events-none"
                        />
                        <div className="absolute inset-0 cursor-pointer" onClick={() => setSelectedAsset(asset)} />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Icon className="w-12 h-12 text-gray-700" />
                      </div>
                    )
                  ) : hasMedia ? (
                    <img src={asset.result_url} alt={asset.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Icon className="w-12 h-12 text-gray-700" />
                    </div>
                  )}

                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                    <div className="p-2.5 rounded-full bg-white/10 backdrop-blur">
                      <Maximize2 className="w-5 h-5 text-white" />
                    </div>
                  </div>

                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-black/60 text-gray-300 backdrop-blur">
                    {asset.type}
                  </span>

                  {onSelectForUGC && (asset.type === 'image' || asset.type === 'edited') && hasMedia && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSelectForUGC(asset.result_url, asset.title || 'Gallery Image'); }}
                      className="absolute bottom-2 left-2 right-2 flex items-center gap-1 justify-center px-2 py-1.5 rounded-lg bg-emerald-500/80 backdrop-blur text-white text-[10px] font-semibold hover:bg-emerald-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Clapperboard className="w-3 h-3" />
                      Use for UGC Video
                    </button>
                  )}
                </div>

                <div className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-white truncate">{asset.title || 'Untitled'}</p>
                    <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      {hasMedia && (
                        <a
                          href={asset.result_url}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-600 hover:text-white transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => handleDelete(asset.id)}
                        className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-[10px] text-gray-500">{PROVIDER_LABELS[asset.provider] || asset.provider}</p>
                    <div className="flex items-center gap-2">
                      {asset.file_size > 0 && (
                        <p className="text-[10px] text-gray-600">{formatFileSize(asset.file_size)}</p>
                      )}
                      <p className="text-[10px] text-gray-600">{new Date(asset.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedAsset && (
        <AssetDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
          onDelete={handleDelete}
          onSelectForUGC={onSelectForUGC}
        />
      )}
    </div>
  );
}
