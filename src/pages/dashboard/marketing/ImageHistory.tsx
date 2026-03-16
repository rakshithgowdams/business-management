import { useState, useEffect } from 'react';
import { History, Download, ChevronDown, RefreshCw, Trash2, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

interface MediaAsset {
  id: string;
  title: string;
  prompt: string;
  result_url: string;
  created_at: string;
  metadata: {
    model?: string;
    style?: string;
    aspectRatio?: string;
    mode?: string;
    template?: string | null;
  } | null;
  type: string;
}

const MODE_LABELS: Record<string, string> = {
  'image-to-image': 'I2I',
  'image-editing': 'Edit',
};

export default function ImageHistory() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const PAGE_SIZE = 12;

  useEffect(() => {
    if (expanded && user) loadHistory(0);
  }, [expanded, user]);

  const loadHistory = async (p: number) => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from('media_assets')
      .select('id, title, prompt, result_url, created_at, metadata, type')
      .eq('user_id', user.id)
      .in('type', ['image', 'edited'])
      .eq('status', 'completed')
      .not('result_url', 'is', null)
      .order('created_at', { ascending: false })
      .range(p * PAGE_SIZE, p * PAGE_SIZE + PAGE_SIZE - 1);

    const rows = (data || []) as MediaAsset[];
    if (p === 0) setAssets(rows);
    else setAssets((prev) => [...prev, ...rows]);
    setHasMore(rows.length === PAGE_SIZE);
    setPage(p);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from('media_assets').delete().eq('id', id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
    toast.success('Removed from history');
  };

  const handleDownload = (url: string, title: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title || 'ai-image'}-${Date.now()}.png`;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const formatDate = (s: string) => {
    const d = new Date(s);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="glass-card rounded-xl overflow-hidden border border-white/5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-white/2 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B00]/10 flex items-center justify-center">
            <History className="w-4 h-4 text-[#FF6B00]" />
          </div>
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Generated Images History</p>
            <p className="text-[11px] text-gray-500">All images generated across Text-to-Image, Image-to-Image and Editing</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {expanded && (
            <button
              onClick={(e) => { e.stopPropagation(); loadHistory(0); }}
              className="p-1.5 rounded-lg hover:bg-white/5 text-gray-500 hover:text-white transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
          <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {expanded && (
        <div className="border-t border-white/5">
          {loading && assets.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-[#FF6B00] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : assets.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <History className="w-8 h-8 text-gray-600 mb-2" />
              <p className="text-sm text-gray-500">No generated images yet</p>
              <p className="text-[11px] text-gray-600 mt-0.5">Generate images above and they will appear here</p>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {assets.map((asset) => (
                  <div key={asset.id} className="group relative">
                    <div className="relative aspect-square rounded-xl overflow-hidden border border-white/5 bg-dark-800">
                      <img
                        src={asset.result_url}
                        alt={asset.title || 'Generated image'}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                        <button
                          onClick={() => handleDownload(asset.result_url, asset.title)}
                          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-[#FF6B00]/80 text-white text-[10px] font-medium transition-colors"
                        >
                          <Download className="w-3 h-3" /> Download
                        </button>
                        <button
                          onClick={() => window.open(asset.result_url, '_blank')}
                          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[10px] font-medium transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" /> View
                        </button>
                        <button
                          onClick={() => handleDelete(asset.id)}
                          className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-white/10 hover:bg-red-500/60 text-white text-[10px] font-medium transition-colors"
                        >
                          <Trash2 className="w-3 h-3" /> Remove
                        </button>
                      </div>
                      {asset.metadata?.mode && (
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-black/70 text-gray-300 backdrop-blur">
                          {MODE_LABELS[asset.metadata.mode] || asset.metadata.mode}
                        </div>
                      )}
                      {asset.metadata?.template && (
                        <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold bg-[#FF6B00]/80 text-white backdrop-blur">
                          TPL
                        </div>
                      )}
                    </div>
                    <div className="mt-1.5 px-0.5">
                      <p className="text-[10px] text-gray-500 truncate" title={asset.prompt}>{asset.prompt || asset.title || 'No prompt'}</p>
                      <p className="text-[9px] text-gray-600 mt-0.5">{formatDate(asset.created_at)}</p>
                    </div>
                  </div>
                ))}
              </div>

              {hasMore && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => loadHistory(page + 1)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-dark-800 border border-white/10 text-xs text-gray-400 hover:text-white hover:border-white/20 transition-colors disabled:opacity-50"
                  >
                    {loading ? <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin" /> : null}
                    Load more
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
