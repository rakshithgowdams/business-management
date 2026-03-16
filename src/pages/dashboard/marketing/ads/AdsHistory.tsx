import { useState, useEffect, useRef } from 'react';
import {
  Loader2, Trash2, Download, Video, Image as ImageIcon, Target,
  LayoutGrid, User, Search, Filter, ChevronDown, X, Play,
  Info, Calendar, Cpu, Tag, List, Maximize2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../../context/AuthContext';
import { supabase } from '../../../../lib/supabase';
import ConfirmDialog from '../../../../components/ConfirmDialog';

interface HistoryItem {
  id: string;
  type: string;
  title: string;
  brief: string;
  platform: string;
  objective: string;
  style: string;
  strategy_content: Record<string, unknown> | null;
  result_urls: string[];
  slide_count: number;
  duration: number;
  aspect_ratio: string;
  model_used: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

const TYPE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  carousel_image: { label: 'Ad Carousel (Image)', icon: <LayoutGrid className="w-3.5 h-3.5" />, color: 'text-[#F1C40F] bg-[#F1C40F]/10 border-[#F1C40F]/20' },
  carousel_video: { label: 'Ad Carousel (Video)', icon: <Video className="w-3.5 h-3.5" />, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
  ugc_image: { label: 'UGC (Image)', icon: <User className="w-3.5 h-3.5" />, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  ugc_video: { label: 'UGC (Video)', icon: <Video className="w-3.5 h-3.5" />, color: 'text-teal-400 bg-teal-500/10 border-teal-500/20' },
  content_strategy: { label: 'Content Strategy', icon: <Target className="w-3.5 h-3.5" />, color: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
};

function getAspectClass(aspectRatio: string, type: string): string {
  if (aspectRatio === '9:16') return 'aspect-[9/16]';
  if (aspectRatio === '1:1') return 'aspect-square';
  if (aspectRatio === '4:5') return 'aspect-[4/5]';
  if (aspectRatio === '16:9') return 'aspect-video';
  if (type.includes('video')) return 'aspect-video';
  return 'aspect-square';
}

function StrategyViewer({ content }: { content: Record<string, unknown> }) {
  const sections = (content?.sections as Array<{ title: string; content: string }>) || [];
  const [expanded, setExpanded] = useState<Record<number, boolean>>({ 0: true });

  if (sections.length === 0) {
    return <pre className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap font-sans">{String(content?.raw || '')}</pre>;
  }

  return (
    <div className="space-y-2">
      {sections.map((s, i) => (
        <div key={i} className="rounded-lg overflow-hidden border border-white/5">
          <button onClick={() => setExpanded((p) => ({ ...p, [i]: !p[i] }))}
            className="w-full flex items-center justify-between px-3 py-2.5 bg-dark-800/50 text-left hover:bg-white/2 transition-colors">
            <span className="text-xs font-semibold text-white">{s.title}</span>
            <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${expanded[i] ? 'rotate-180' : ''}`} />
          </button>
          {expanded[i] && (
            <div className="px-3 py-3 bg-dark-900/30">
              <pre className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap font-sans">{s.content}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AssetThumbnail({ url, isVideo, aspectClass, onClick }: { url: string; isVideo: boolean; aspectClass: string; onClick?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  return (
    <div
      className={`relative rounded-xl overflow-hidden border border-white/10 bg-dark-800 cursor-pointer group ${aspectClass}`}
      onClick={onClick}
    >
      {isVideo ? (
        <video
          ref={videoRef}
          src={url}
          controls
          muted
          loop
          playsInline
          className="w-full h-full object-contain bg-black"
          onClick={(e) => e.stopPropagation()}
        />
      ) : (
        <img src={url} alt="Asset" className="w-full h-full object-contain" />
      )}
      {onClick && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="p-1.5 rounded-lg bg-black/60 backdrop-blur text-white">
            <Maximize2 className="w-3.5 h-3.5" />
          </div>
        </div>
      )}
    </div>
  );
}

interface AssetDetailModalProps {
  item: HistoryItem;
  assetIndex: number;
  onClose: () => void;
}

function AssetDetailModal({ item, assetIndex, onClose }: AssetDetailModalProps) {
  const [currentIdx, setCurrentIdx] = useState(assetIndex);
  const url = item.result_urls[currentIdx];
  const isVideo = url?.includes('.mp4') || item.type.includes('video');
  const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.carousel_image;
  const meta = item.metadata || {};

  const sectionLabel: Record<string, string> = {
    carousel_image: 'Ad Carousel (Image)',
    carousel_video: 'Ad Carousel (Video)',
    ugc_image: 'UGC Creator',
    ugc_video: 'UGC Creator',
    content_strategy: 'Content Strategy',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl max-h-[90vh] flex flex-col bg-dark-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border flex-shrink-0 ${cfg.color}`}>
              {cfg.icon} {cfg.label}
            </span>
            <h3 className="text-sm font-bold text-white truncate">{item.title}</h3>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0">
          <div className="lg:w-[55%] bg-black flex items-center justify-center p-4 min-h-[300px]">
            {url ? (
              isVideo ? (
                <video
                  src={url}
                  controls
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="max-w-full max-h-full rounded-xl object-contain"
                  style={{ maxHeight: '70vh' }}
                />
              ) : (
                <img
                  src={url}
                  alt={`Asset ${currentIdx + 1}`}
                  className="max-w-full max-h-full rounded-xl object-contain"
                  style={{ maxHeight: '70vh' }}
                />
              )
            ) : (
              <div className="text-gray-600 text-sm">No preview</div>
            )}
          </div>

          <div className="lg:w-[45%] flex flex-col overflow-y-auto border-t lg:border-t-0 lg:border-l border-white/5">
            {item.result_urls.length > 1 && (
              <div className="flex gap-1.5 p-3 border-b border-white/5 overflow-x-auto">
                {item.result_urls.map((u, i) => {
                  const iv = u.includes('.mp4') || item.type.includes('video');
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentIdx(i)}
                      className={`relative flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${currentIdx === i ? 'border-white/60' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                    >
                      {iv
                        ? <div className="w-full h-full bg-dark-800 flex items-center justify-center"><Play className="w-4 h-4 text-gray-400" /></div>
                        : <img src={u} alt="" className="w-full h-full object-cover" />
                      }
                      <span className="absolute bottom-0.5 right-0.5 text-[8px] text-white/70 bg-black/50 px-1 rounded">{i + 1}</span>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="p-4 space-y-4 flex-1">
              <div>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info className="w-3 h-3" /> Details
                </p>
                <div className="space-y-2">
                  {item.brief && (
                    <div>
                      <p className="text-[10px] text-gray-600 mb-0.5">Brief / Prompt</p>
                      <p className="text-xs text-gray-300 leading-relaxed">{item.brief}</p>
                    </div>
                  )}
                  {item.platform && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600">Platform</span>
                      <span className="text-xs text-white">{item.platform}</span>
                    </div>
                  )}
                  {item.objective && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600">Objective</span>
                      <span className="text-xs text-white">{item.objective}</span>
                    </div>
                  )}
                  {item.style && item.style !== 'content_strategy' && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600">Style</span>
                      <span className="text-xs text-white capitalize">{item.style.replace(/_/g, ' ')}</span>
                    </div>
                  )}
                  {item.aspect_ratio && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600">Aspect Ratio</span>
                      <span className="text-xs text-white">{item.aspect_ratio}</span>
                    </div>
                  )}
                  {item.duration > 0 && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-gray-600">Duration</span>
                      <span className="text-xs text-white">{item.duration}s</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="px-3 py-2 rounded-xl bg-dark-800 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Tag className="w-3 h-3 text-gray-500" />
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider">Section</span>
                  </div>
                  <p className="text-xs text-white font-medium">{sectionLabel[item.type] || item.type}</p>
                </div>
                <div className="px-3 py-2 rounded-xl bg-dark-800 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Cpu className="w-3 h-3 text-gray-500" />
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider">Model</span>
                  </div>
                  <p className="text-xs text-white font-medium truncate">{item.model_used || '—'}</p>
                </div>
                <div className="px-3 py-2 rounded-xl bg-dark-800 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <List className="w-3 h-3 text-gray-500" />
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider">Assets</span>
                  </div>
                  <p className="text-xs text-white font-medium">{item.result_urls.length} file{item.result_urls.length !== 1 ? 's' : ''}</p>
                </div>
                <div className="px-3 py-2 rounded-xl bg-dark-800 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Calendar className="w-3 h-3 text-gray-500" />
                    <span className="text-[9px] text-gray-500 uppercase tracking-wider">Date</span>
                  </div>
                  <p className="text-xs text-white font-medium">{new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                </div>
              </div>

              {Object.keys(meta).length > 0 && (
                <div>
                  <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">Metadata</p>
                  <div className="space-y-1">
                    {Object.entries(meta).map(([k, v]) => (
                      v !== undefined && v !== null && v !== '' && (
                        <div key={k} className="flex items-start gap-2">
                          <span className="text-[10px] text-gray-600 capitalize min-w-16 flex-shrink-0">{k.replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-gray-400 break-all">{Array.isArray(v) ? v.join(', ') : String(v)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}
            </div>

            {url && (
              <div className="p-3 border-t border-white/5">
                <a
                  href={url}
                  download={`asset-${currentIdx + 1}.${isVideo ? 'mp4' : 'png'}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-white font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Download Asset {item.result_urls.length > 1 ? `${currentIdx + 1} of ${item.result_urls.length}` : ''}
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdsHistory() {
  const { user } = useAuth();

  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [modalItem, setModalItem] = useState<{ item: HistoryItem; index: number } | null>(null);

  useEffect(() => {
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ads_generator_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      setItems(data || []);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase.from('ads_generator_history').delete().eq('id', id);
      if (error) throw error;
      setItems((prev) => prev.filter((item) => item.id !== id));
      if (modalItem?.item.id === id) setModalItem(null);
      toast.success('Deleted from history');
    } catch {
      toast.error('Failed to delete');
    }
    setDeleteId(null);
  };

  const filtered = items.filter((item) => {
    const matchSearch = !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.brief.toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === 'all' || item.type === typeFilter;
    return matchSearch && matchType;
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search history..."
            className="w-full pl-9 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-white/30 placeholder-gray-600" />
        </div>
        <div className="flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-gray-500" />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-dark-800 border border-white/10 rounded-xl text-xs text-white px-3 py-2.5 focus:outline-none">
            <option value="all">All Types</option>
            {Object.entries(TYPE_CONFIG).map(([key, val]) => (
              <option key={key} value={key}>{val.label}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 text-gray-500 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card rounded-xl p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-dark-800 flex items-center justify-center mx-auto mb-4">
            <LayoutGrid className="w-7 h-7 text-gray-700" />
          </div>
          <p className="text-gray-500 text-sm font-medium">No history found</p>
          <p className="text-xs text-gray-600 mt-1">Generated ads and strategies will appear here</p>
        </div>
      ) : (
        <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-4">
          {filtered.map((item) => {
            const cfg = TYPE_CONFIG[item.type] || TYPE_CONFIG.carousel_image;
            const isStrategy = item.type === 'content_strategy';

            if (isStrategy) {
              return (
                <div key={item.id} className="break-inside-avoid glass-card rounded-xl overflow-hidden border border-white/5 hover:border-white/15 transition-all">
                  <div className="p-3.5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border ${cfg.color}`}>
                        {cfg.icon} {cfg.label}
                      </span>
                      <button onClick={() => setDeleteId(item.id)}
                        className="p-1 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors flex-shrink-0">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs font-semibold text-white">{item.title}</p>
                    {item.brief && <p className="text-[10px] text-gray-500 mt-1 line-clamp-2">{item.brief}</p>}
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-[9px] text-gray-600">{formatDate(item.created_at)}</span>
                      <button
                        onClick={() => setModalItem({ item, index: 0 })}
                        className="text-[9px] text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        View Strategy
                      </button>
                    </div>
                  </div>
                </div>
              );
            }

            return (
              <div key={item.id} className="break-inside-avoid glass-card rounded-xl overflow-hidden border border-white/5 hover:border-white/15 transition-all">
                {item.result_urls.length > 0 ? (
                  <div className="relative group">
                    {(() => {
                      const firstUrl = item.result_urls[0];
                      const iv = firstUrl?.includes('.mp4') || item.type.includes('video');
                      const aspectClass = getAspectClass(item.aspect_ratio, item.type);
                      return (
                        <div
                          className={`relative w-full bg-black overflow-hidden cursor-pointer ${aspectClass}`}
                          onClick={() => setModalItem({ item, index: 0 })}
                        >
                          {iv ? (
                            <>
                              <video
                                src={firstUrl}
                                muted
                                loop
                                playsInline
                                autoPlay
                                className="w-full h-full object-contain pointer-events-none"
                              />
                              <div className="absolute inset-0 cursor-pointer" onClick={() => setModalItem({ item, index: 0 })} />
                            </>
                          ) : (
                            <img src={firstUrl} alt={item.title} className="w-full h-full object-contain" />
                          )}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                            <div className="p-2.5 rounded-full bg-white/10 backdrop-blur">
                              <Maximize2 className="w-5 h-5 text-white" />
                            </div>
                          </div>
                          {item.result_urls.length > 1 && (
                            <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/60 backdrop-blur text-[9px] text-white font-bold">
                              +{item.result_urls.length - 1}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                ) : (
                  <div className="aspect-square bg-dark-800 flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-gray-700" />
                  </div>
                )}

                <div className="p-3">
                  <div className="flex items-start justify-between gap-1.5 mb-1.5">
                    <span className={`flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold border flex-shrink-0 ${cfg.color}`}>
                      {cfg.icon}
                    </span>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <a
                        href={item.result_urls[0]}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="p-1 rounded-lg hover:bg-white/10 text-gray-600 hover:text-white transition-colors"
                      >
                        <Download className="w-3 h-3" />
                      </a>
                      <button onClick={() => setDeleteId(item.id)}
                        className="p-1 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] font-semibold text-white truncate">{item.title}</p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[9px] text-gray-600">{formatDate(item.created_at)}</span>
                    {item.model_used && (
                      <span className="text-[9px] text-gray-600 truncate max-w-[80px]">{item.model_used.split('/').pop()}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modalItem && (
        modalItem.item.type === 'content_strategy' && modalItem.item.strategy_content ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setModalItem(null)}>
            <div className="relative w-full max-w-2xl max-h-[85vh] flex flex-col bg-dark-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 flex-shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold border flex-shrink-0 ${TYPE_CONFIG.content_strategy.color}`}>
                    {TYPE_CONFIG.content_strategy.icon} Content Strategy
                  </span>
                  <h3 className="text-sm font-bold text-white truncate">{modalItem.item.title}</h3>
                </div>
                <button onClick={() => setModalItem(null)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors flex-shrink-0 ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 overflow-y-auto flex-1">
                <div className="mb-4 grid grid-cols-2 gap-2">
                  <div className="px-3 py-2 rounded-xl bg-dark-800 border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">Model</p>
                    <p className="text-xs text-white">{modalItem.item.model_used || '—'}</p>
                  </div>
                  <div className="px-3 py-2 rounded-xl bg-dark-800 border border-white/5">
                    <p className="text-[9px] text-gray-500 uppercase tracking-wider mb-0.5">Date</p>
                    <p className="text-xs text-white">{new Date(modalItem.item.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <StrategyViewer content={modalItem.item.strategy_content} />
              </div>
            </div>
          </div>
        ) : (
          <AssetDetailModal
            item={modalItem.item}
            assetIndex={modalItem.index}
            onClose={() => setModalItem(null)}
          />
        )
      )}

      <ConfirmDialog
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={() => deleteId && handleDelete(deleteId)}
        title="Delete from history"
        message="This will permanently remove this item from your ads history."
        confirmLabel="Delete"
        isDangerous
      />
    </div>
  );
}
