import { useState, useEffect, useRef } from 'react';
import { FileText, Image, Video, Music, Archive, Download } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import { DOCUMENT_TYPE_COLORS } from '../../../lib/portal/constants';
import type { PortalSharedDocument } from '../../../lib/portal/types';

interface Props {
  items: PortalSharedDocument[];
  color: string;
  onDownload?: (id: string) => Promise<string | null>;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function getFileIcon(name: string) {
  const lower = name.toLowerCase();
  if (lower.match(/\.(jpg|jpeg|png|gif|svg|webp|bmp)$/)) return Image;
  if (lower.match(/\.(mp4|mov|avi|wmv|mkv|webm)$/)) return Video;
  if (lower.match(/\.(mp3|wav|ogg|flac|aac)$/)) return Music;
  if (lower.match(/\.(zip|rar|7z|tar|gz)$/)) return Archive;
  return FileText;
}

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, inView };
}

export default function PortalDocumentsSection({ items, color, onDownload }: Props) {
  const { isDark } = usePortalTheme();
  const { ref, inView } = useInView();
  const [downloading, setDownloading] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No documents shared yet.</p>;
  }

  const handleDownload = async (item: PortalSharedDocument) => {
    setDownloading(item.id);
    try {
      if (onDownload) {
        const url = await onDownload(item.id);
        if (url) {
          window.open(url, '_blank');
          return;
        }
      }
      if (item.file_url) window.open(item.file_url, '_blank');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div ref={ref} className="space-y-8">
      <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Shared Documents</h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Proposals, contracts, deliverables, and other important files</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((item, index) => {
          const IconComponent = getFileIcon(item.document_name);
          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-4 sm:p-5 transition-all duration-700 ease-out group hover:shadow-lg ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              } ${isDark
                ? 'bg-gray-800/50 border-white/[0.06] hover:border-white/10'
                : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              style={{ transitionDelay: inView ? `${(index + 1) * 80}ms` : '0ms' }}
            >
              <div className="flex items-start gap-3 sm:gap-4">
                <div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-transform duration-500 group-hover:scale-110"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" style={{ color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className={`font-semibold text-sm truncate mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.document_name}</h4>
                  <span className={`inline-block px-2 py-0.5 text-[10px] rounded border ${DOCUMENT_TYPE_COLORS[item.document_type] || DOCUMENT_TYPE_COLORS.Other}`}>
                    {item.document_type}
                  </span>
                </div>
              </div>

              {item.description && <p className={`text-xs mt-3 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.description}</p>}

              <div className={`flex items-center justify-between mt-4 pt-3 border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`}>
                <div className="flex items-center gap-3">
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatFileSize(item.file_size)}</span>
                  {item.download_count > 0 && (
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {item.download_count} {item.download_count === 1 ? 'download' : 'downloads'}
                    </span>
                  )}
                </div>
                {(item.file_url || item.file_path) && (
                  <button
                    onClick={() => handleDownload(item)}
                    disabled={downloading === item.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    style={{ backgroundColor: `${color}15`, color }}
                  >
                    {downloading === item.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Download className="w-3.5 h-3.5" />
                    )}
                    {downloading === item.id ? 'Loading...' : 'Download'}
                  </button>
                )}
              </div>

              <p className={`text-[11px] mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                Shared on {new Date(item.created_at).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
