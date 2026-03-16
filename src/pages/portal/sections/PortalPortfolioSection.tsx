import { useState } from 'react';
import { ExternalLink, Star, X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { PortalPortfolioItem } from '../../../lib/portal/types';

interface Props { items: PortalPortfolioItem[]; color: string; }

export default function PortalPortfolioSection({ items, color }: Props) {
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<PortalPortfolioItem | null>(null);

  const categories = ['All', ...new Set(items.map(i => i.category).filter(Boolean))];
  const filtered = filter === 'All' ? items : items.filter(i => i.category === filter);
  const featured = items.filter(i => i.is_featured);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Our Portfolio</h2>
        <p className="text-gray-400">A showcase of our best work and recent projects</p>
      </div>

      {featured.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {featured.slice(0, 2).map(item => (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              className="relative rounded-2xl overflow-hidden cursor-pointer group border border-white/[0.06] hover:border-white/10 transition-all"
            >
              {item.thumbnail_url ? (
                <img src={item.thumbnail_url} alt={item.title} className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500" />
              ) : (
                <div className="w-full aspect-[16/10] bg-dark-700 flex items-center justify-center text-gray-600">No Image</div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4" style={{ color, fill: color }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>Featured</span>
                </div>
                <h3 className="text-lg font-bold">{item.title}</h3>
                {item.category && <span className="text-sm text-gray-400">{item.category}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {categories.length > 2 && (
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === cat ? 'text-white' : 'bg-dark-700 text-gray-400 hover:text-white hover:bg-dark-600'
              }`}
              style={filter === cat ? { backgroundColor: `${color}20`, color } : undefined}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.filter(i => !i.is_featured || filter !== 'All').map(item => (
          <div
            key={item.id}
            onClick={() => setSelected(item)}
            className="bg-dark-800 border border-white/[0.06] rounded-xl overflow-hidden cursor-pointer group hover:border-white/10 transition-all"
          >
            {item.thumbnail_url ? (
              <div className="aspect-video overflow-hidden">
                <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              </div>
            ) : (
              <div className="aspect-video bg-dark-700 flex items-center justify-center text-gray-600 text-sm">No Image</div>
            )}
            <div className="p-4">
              <h4 className="font-semibold text-sm mb-1">{item.title}</h4>
              {item.category && <span className="text-xs text-gray-500">{item.category}</span>}
              {item.description && <p className="text-xs text-gray-400 mt-2 line-clamp-2">{item.description}</p>}
              {item.technologies && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {item.technologies.split(',').map(t => t.trim()).filter(Boolean).slice(0, 4).map(t => (
                    <span key={t} className="px-2 py-0.5 text-[10px] bg-dark-700 rounded-md text-gray-400">{t}</span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {items.length === 0 && (
        <p className="text-center text-gray-500 py-12">No portfolio items available yet.</p>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h3 className="font-semibold">{selected.title}</h3>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            {selected.thumbnail_url && (
              <img src={selected.thumbnail_url} alt={selected.title} className="w-full max-h-[400px] object-cover" />
            )}
            <div className="p-6 space-y-4">
              {selected.category && <span className="px-3 py-1 rounded-lg text-xs font-medium" style={{ backgroundColor: `${color}15`, color }}>{selected.category}</span>}
              {selected.description && <p className="text-gray-300 leading-relaxed">{selected.description}</p>}
              {selected.technologies && (
                <div>
                  <h4 className="text-sm font-medium text-gray-400 mb-2">Technologies</h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.technologies.split(',').map(t => t.trim()).filter(Boolean).map(t => (
                      <span key={t} className="px-3 py-1 text-xs bg-dark-700 rounded-lg text-gray-300">{t}</span>
                    ))}
                  </div>
                </div>
              )}
              {selected.completion_date && (
                <p className="text-sm text-gray-500">Completed: {new Date(selected.completion_date).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
              )}
              {selected.project_url && (
                <a href={selected.project_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90" style={{ backgroundColor: color }}>
                  <ExternalLink className="w-4 h-4" /> View Live Project
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
