import { useState } from 'react';
import { X, ZoomIn } from 'lucide-react';
import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';

interface Props { section: WebsiteSection; project: WebsiteProject | null; primary: string; }

export default function PublicGallery({ section, project, primary }: Props) {
  const c = section.config as Record<string, unknown>;
  const font = project?.font_family || 'Inter';
  const images = (c.images as { url: string; alt: string; caption: string }[]) || [];
  const [lightbox, setLightbox] = useState<number | null>(null);

  return (
    <section style={{ fontFamily: `'${font}', sans-serif`, backgroundColor: '#080a0f' }} className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          {c.heading && <h2 className="text-3xl font-black text-white mb-3">{c.heading as string}</h2>}
          {c.subheading && <p className="text-base text-gray-400">{c.subheading as string}</p>}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((img, i) => (
            <div
              key={i}
              className="relative rounded-2xl overflow-hidden group cursor-pointer"
              onClick={() => setLightbox(i)}
            >
              <img src={img.url} alt={img.alt} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {img.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-xs text-white">{img.caption}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {lightbox !== null && (
        <div className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <button className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors">
            <X className="w-5 h-5" />
          </button>
          <img src={images[lightbox]?.url} alt={images[lightbox]?.alt} className="max-w-full max-h-full rounded-xl shadow-2xl" onClick={e => e.stopPropagation()} />
        </div>
      )}
    </section>
  );
}
