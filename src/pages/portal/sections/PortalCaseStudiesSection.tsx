import { useState, useEffect, useRef } from 'react';
import { ArrowRight, Star, X, TrendingUp } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import type { PortalCaseStudy, PortalMetric } from '../../../lib/portal/types';

interface Props {
  items: PortalCaseStudy[];
  color: string;
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

export default function PortalCaseStudiesSection({ items, color }: Props) {
  const { isDark } = usePortalTheme();
  const { ref, inView } = useInView();
  const [selected, setSelected] = useState<PortalCaseStudy | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = 'hidden';
      requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)));
    } else {
      document.body.style.overflow = '';
      setModalVisible(false);
    }
    return () => { document.body.style.overflow = ''; };
  }, [selected]);

  const closeModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelected(null), 300);
  };

  if (items.length === 0) {
    return <p className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No case studies available yet.</p>;
  }

  return (
    <div ref={ref} className="space-y-8">
      <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Case Studies</h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Real results from real projects -- see the impact of our work</p>
      </div>

      <div className="space-y-6">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`rounded-2xl border overflow-hidden cursor-pointer transition-all duration-700 ease-out group hover:shadow-lg ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            } ${isDark ? 'bg-gray-800/50 border-white/[0.06] hover:border-white/10' : 'bg-white border-gray-200 hover:border-gray-300'}`}
            style={{ transitionDelay: inView ? `${(index + 1) * 100}ms` : '0ms' }}
            onClick={() => setSelected(item)}
          >
            <div className="p-4 sm:p-6 md:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-6">
                {(item.before_image_url || item.after_image_url) && (
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] items-center gap-2 sm:gap-3 shrink-0 w-full lg:w-auto lg:max-w-[320px]">
                    {item.before_image_url && (
                      <div className="relative">
                        <img src={item.before_image_url} alt="Before" className="w-full h-36 sm:h-24 md:h-28 rounded-xl object-cover" />
                        <span className="absolute top-2 left-2 sm:bottom-1 sm:top-auto sm:left-1 text-[10px] font-bold bg-red-500/90 text-white px-2 py-0.5 rounded-md">BEFORE</span>
                      </div>
                    )}
                    {item.before_image_url && item.after_image_url && (
                      <ArrowRight className={`w-5 h-5 shrink-0 mx-auto rotate-90 sm:rotate-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                    )}
                    {item.after_image_url && (
                      <div className="relative">
                        <img src={item.after_image_url} alt="After" className="w-full h-36 sm:h-24 md:h-28 rounded-xl object-cover" />
                        <span className="absolute top-2 left-2 sm:bottom-1 sm:top-auto sm:left-1 text-[10px] font-bold bg-green-500/90 text-white px-2 py-0.5 rounded-md">AFTER</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {item.is_featured && <Star className="w-4 h-4" style={{ color, fill: color }} />}
                    <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.client_name && <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.client_name}</span>}
                    {item.industry && <span className="px-2 py-0.5 text-xs rounded-md" style={{ backgroundColor: `${color}10`, color }}>{item.industry}</span>}
                  </div>
                  {item.challenge && <p className={`text-sm line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.challenge}</p>}
                </div>
              </div>

              {(item.before_metrics as PortalMetric[]).length > 0 && (item.after_metrics as PortalMetric[]).length > 0 && (
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(item.after_metrics as PortalMetric[]).slice(0, 4).map((m, i) => {
                    const before = (item.before_metrics as PortalMetric[])[i];
                    return (
                      <div key={i} className={`rounded-xl p-3 text-center ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                        <p className="text-lg font-bold" style={{ color }}>{m.value}</p>
                        <p className={`text-[11px] mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{m.label}</p>
                        {before && <p className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>was {before.value}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              {item.testimonial_quote && (
                <div className="mt-5 p-3 sm:p-4 rounded-xl border-l-2" style={{ borderColor: color, backgroundColor: `${color}05` }}>
                  <p className={`text-sm italic ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>&ldquo;{item.testimonial_quote}&rdquo;</p>
                  {item.testimonial_author && <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>-- {item.testimonial_author}</p>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div
          className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-6 transition-opacity duration-300 ${modalVisible ? 'opacity-100' : 'opacity-0'}`}
          onClick={closeModal}
        >
          <div
            className={`rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden border flex flex-col transition-all duration-300 ${
              modalVisible ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'
            } ${isDark ? 'bg-gray-900 border-white/10' : 'bg-white border-gray-200'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${isDark ? 'bg-gray-900 border-white/[0.06]' : 'bg-white border-gray-100'}`}>
              <div className="flex items-center gap-2 min-w-0">
                {selected.is_featured && <Star className="w-3.5 h-3.5 shrink-0" style={{ color, fill: color }} />}
                <h3 className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{selected.title}</h3>
              </div>
              <button onClick={closeModal} className={`p-1.5 rounded-lg transition-colors shrink-0 ml-2 ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="overflow-y-auto overscroll-contain flex-1">
              <div className="p-4 space-y-4">
                {selected.client_name && (
                  <div className="flex flex-wrap items-center gap-2">
                    {selected.client_name && <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selected.client_name}</span>}
                    {selected.industry && <span className="px-2 py-0.5 text-[10px] rounded-md font-medium" style={{ backgroundColor: `${color}15`, color }}>{selected.industry}</span>}
                  </div>
                )}

                {(selected.before_image_url || selected.after_image_url) && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {selected.before_image_url && (
                      <div className="relative">
                        <img src={selected.before_image_url} alt="Before" className="rounded-lg w-full h-32 sm:h-36 object-cover" />
                        <span className="absolute top-2 left-2 text-[10px] font-bold bg-red-500/90 text-white px-2 py-0.5 rounded-md">BEFORE</span>
                      </div>
                    )}
                    {selected.after_image_url && (
                      <div className="relative">
                        <img src={selected.after_image_url} alt="After" className="rounded-lg w-full h-32 sm:h-36 object-cover" />
                        <span className="absolute top-2 left-2 text-[10px] font-bold bg-green-500/90 text-white px-2 py-0.5 rounded-md">AFTER</span>
                      </div>
                    )}
                  </div>
                )}

                {(selected.challenge || selected.solution || selected.results) && (
                  <div className="space-y-3">
                    {selected.challenge && (
                      <div>
                        <h4 className={`text-xs font-semibold mb-1 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" /> Challenge
                        </h4>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{selected.challenge}</p>
                      </div>
                    )}
                    {selected.solution && (
                      <div>
                        <h4 className={`text-xs font-semibold mb-1 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} /> Solution
                        </h4>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{selected.solution}</p>
                      </div>
                    )}
                    {selected.results && (
                      <div>
                        <h4 className={`text-xs font-semibold mb-1 flex items-center gap-1.5 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <TrendingUp className="w-3 h-3 text-green-400" /> Results
                        </h4>
                        <p className={`text-xs leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{selected.results}</p>
                      </div>
                    )}
                  </div>
                )}

                {(selected.after_metrics as PortalMetric[]).length > 0 && (
                  <div className="grid grid-cols-3 gap-2">
                    {(selected.after_metrics as PortalMetric[]).slice(0, 6).map((m, i) => {
                      const before = (selected.before_metrics as PortalMetric[])[i];
                      return (
                        <div key={i} className={`rounded-lg p-2.5 text-center ${isDark ? 'bg-gray-800/80' : 'bg-gray-50'}`}>
                          <p className="text-sm font-bold" style={{ color }}>{m.value}</p>
                          <p className={`text-[10px] mt-0.5 leading-tight ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{m.label}</p>
                          {before && <p className={`text-[9px] mt-0.5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>was {before.value}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}

                {selected.testimonial_quote && (
                  <div className="px-3 py-2.5 rounded-lg border-l-2" style={{ borderColor: color, backgroundColor: `${color}06` }}>
                    <p className={`text-xs italic leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>&ldquo;{selected.testimonial_quote}&rdquo;</p>
                    {selected.testimonial_author && <p className={`text-[10px] mt-1.5 font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>-- {selected.testimonial_author}</p>}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
