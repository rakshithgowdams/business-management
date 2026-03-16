import { useState, useEffect } from 'react';
import { ExternalLink, Star, X } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import type { PortalPortfolioItem } from '../../../lib/portal/types';

interface Props {
  items: PortalPortfolioItem[];
  color: string;
}

export default function PortalPortfolioSection({ items, color }: Props) {
  const { isDark } = usePortalTheme();
  const [visible, setVisible] = useState(false);
  const [filter, setFilter] = useState('All');
  const [selected, setSelected] = useState<PortalPortfolioItem | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (items.length === 0) {
    return (
      <p className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        No portfolio items available yet.
      </p>
    );
  }

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category).filter(Boolean)))];
  const filtered = filter === 'All' ? items : items.filter(i => i.category === filter);
  const featured = items.filter(i => i.is_featured);

  return (
    <div className="space-y-8">
      <div
        className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Our Portfolio
        </h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          A showcase of our best work and recent projects
        </p>
      </div>

      {featured.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {featured.slice(0, 2).map((item, index) => (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              className={`relative rounded-2xl overflow-hidden cursor-pointer group border transition-all duration-700 hover:shadow-xl ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } ${isDark
                ? 'border-white/[0.06] hover:border-white/10'
                : 'border-gray-200 hover:border-gray-300'
              }`}
              style={{ transitionDelay: `${(index + 1) * 100}ms` }}
            >
              {item.thumbnail_url ? (
                <img
                  src={item.thumbnail_url}
                  alt={item.title}
                  className="w-full aspect-[16/10] object-cover group-hover:scale-105 transition-transform duration-500"
                />
              ) : (
                <div
                  className={`w-full aspect-[16/10] flex items-center justify-center ${
                    isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  No Image
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4" style={{ color, fill: color }} />
                  <span className="text-xs font-bold uppercase tracking-wider" style={{ color }}>
                    Featured
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white">{item.title}</h3>
                {item.category && <span className="text-sm text-gray-300">{item.category}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {categories.length > 2 && (
        <div
          className={`flex gap-2 flex-wrap transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '200ms' }}
        >
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                filter === cat
                  ? 'text-white shadow-lg'
                  : isDark
                    ? 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-500 hover:text-gray-900 hover:bg-gray-200'
              }`}
              style={filter === cat ? { backgroundColor: `${color}25`, color } : undefined}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered
          .filter(i => !i.is_featured || filter !== 'All')
          .map((item, index) => (
            <div
              key={item.id}
              onClick={() => setSelected(item)}
              className={`rounded-xl overflow-hidden cursor-pointer group border transition-all duration-700 hover:shadow-lg hover:-translate-y-1 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } ${isDark
                ? 'bg-gray-800/50 border-white/[0.06] hover:border-white/10'
                : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              style={{ transitionDelay: `${(index + 3) * 100}ms` }}
            >
              {item.thumbnail_url ? (
                <div className="aspect-video overflow-hidden">
                  <img
                    src={item.thumbnail_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                </div>
              ) : (
                <div
                  className={`aspect-video flex items-center justify-center text-sm ${
                    isDark ? 'bg-gray-800 text-gray-600' : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  No Image
                </div>
              )}
              <div className="p-4">
                <h4 className={`font-semibold text-sm mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.title}
                </h4>
                {item.category && (
                  <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {item.category}
                  </span>
                )}
                {item.description && (
                  <p className={`text-xs mt-2 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {item.description}
                  </p>
                )}
                {item.technologies && (
                  <div className="flex flex-wrap gap-1 mt-3">
                    {item.technologies
                      .split(',')
                      .map(t => t.trim())
                      .filter(Boolean)
                      .slice(0, 4)
                      .map(t => (
                        <span
                          key={t}
                          className={`px-2 py-0.5 text-[10px] rounded-md ${
                            isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            </div>
          ))}
      </div>

      {selected && (
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className={`rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border ${
              isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'
            }`}
            onClick={e => e.stopPropagation()}
          >
            <div
              className={`flex items-center justify-between p-5 border-b ${
                isDark ? 'border-white/[0.06]' : 'border-gray-200'
              }`}
            >
              <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {selected.title}
              </h3>
              <button
                onClick={() => setSelected(null)}
                className={`p-2 rounded-lg transition-colors ${
                  isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                }`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selected.thumbnail_url && (
              <img
                src={selected.thumbnail_url}
                alt={selected.title}
                className="w-full max-h-[400px] object-cover"
              />
            )}

            <div className="p-6 space-y-4">
              {selected.category && (
                <span
                  className="px-3 py-1 rounded-lg text-xs font-medium"
                  style={{ backgroundColor: `${color}15`, color }}
                >
                  {selected.category}
                </span>
              )}

              {selected.description && (
                <p className={`leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                  {selected.description}
                </p>
              )}

              {selected.technologies && (
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Technologies
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.technologies
                      .split(',')
                      .map(t => t.trim())
                      .filter(Boolean)
                      .map(t => (
                        <span
                          key={t}
                          className={`px-3 py-1 text-xs rounded-lg ${
                            isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {t}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {selected.completion_date && (
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  Completed:{' '}
                  {new Date(selected.completion_date).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              )}

              {selected.project_url && (
                <a
                  href={selected.project_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: color }}
                >
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
