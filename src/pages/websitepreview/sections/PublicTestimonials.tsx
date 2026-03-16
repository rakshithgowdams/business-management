import { Star, Quote } from 'lucide-react';
import type { WebsiteSection, WebsiteProject } from '../../../lib/websiteBuilder/types';

interface Props { section: WebsiteSection; project: WebsiteProject | null; primary: string; }

export default function PublicTestimonials({ section, project, primary }: Props) {
  const c = section.config as Record<string, unknown>;
  const font = project?.font_family || 'Inter';
  const items = (c.items as { name: string; role: string; company: string; text: string; rating: number; avatar: string }[]) || [];

  return (
    <section style={{ fontFamily: `'${font}', sans-serif`, backgroundColor: '#0d1117' }} className="px-6 py-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-14">
          {c.heading && <h2 className="text-3xl font-black text-white mb-3">{c.heading as string}</h2>}
          {c.subheading && <p className="text-base text-gray-400">{c.subheading as string}</p>}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {items.map((item, i) => (
            <div key={i} className="p-6 rounded-2xl border border-white/[0.07] bg-white/[0.02] flex flex-col">
              <Quote className="w-6 h-6 mb-4 opacity-30" style={{ color: primary }} />
              {c.show_rating && (
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star key={j} className={`w-3.5 h-3.5 ${j < (item.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-gray-700'}`} />
                  ))}
                </div>
              )}
              <p className="text-sm text-gray-400 leading-relaxed flex-1 mb-5">"{item.text}"</p>
              <div className="flex items-center gap-3">
                <div style={{ background: `linear-gradient(135deg, ${primary}40, ${primary}10)` }} className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black text-white">
                  {item.name?.[0] || '?'}
                </div>
                <div>
                  <div className="text-sm font-bold text-white">{item.name}</div>
                  <div className="text-xs text-gray-500">{item.role}{item.company ? `, ${item.company}` : ''}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
