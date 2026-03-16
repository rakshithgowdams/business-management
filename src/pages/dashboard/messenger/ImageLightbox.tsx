import { useEffect, useCallback } from 'react';
import { X, Download, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';

interface Props {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function ImageLightbox({ src, alt, onClose }: Props) {
  const [zoom, setZoom] = useState(1);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose();
    if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 3));
    if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.5));
  }, [onClose]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [handleKeyDown]);

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = src;
    a.download = alt || 'image';
    a.target = '_blank';
    a.click();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center">
      <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-white text-sm font-medium min-w-[50px] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleDownload}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <Download className="w-5 h-5" />
        </button>
        <button
          onClick={onClose}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="fixed inset-0" onClick={onClose} />

      <img
        src={src}
        alt={alt || 'Image'}
        className="relative z-[1] max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl transition-transform duration-200 select-none"
        style={{ transform: `scale(${zoom})` }}
        draggable={false}
      />
    </div>
  );
}
