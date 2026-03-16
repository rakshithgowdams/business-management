import { useState } from 'react';
import { ArrowRight, Star, X, TrendingUp } from 'lucide-react';
import type { PortalCaseStudy, PortalMetric } from '../../../lib/portal/types';

interface Props { items: PortalCaseStudy[]; color: string; }

export default function PortalCaseStudiesSection({ items, color }: Props) {
  const [selected, setSelected] = useState<PortalCaseStudy | null>(null);

  if (items.length === 0) {
    return <p className="text-center text-gray-500 py-12">No case studies available yet.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Case Studies</h2>
        <p className="text-gray-400">Real results from real projects -- see the impact of our work</p>
      </div>

      <div className="space-y-6">
        {items.map(item => (
          <div
            key={item.id}
            className="bg-dark-800 border border-white/[0.06] rounded-2xl overflow-hidden hover:border-white/10 transition-all cursor-pointer"
            onClick={() => setSelected(item)}
          >
            <div className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                {(item.before_image_url || item.after_image_url) && (
                  <div className="flex items-center gap-3 shrink-0">
                    {item.before_image_url && (
                      <div className="relative">
                        <img src={item.before_image_url} alt="Before" className="w-32 h-24 sm:w-40 sm:h-28 rounded-xl object-cover" />
                        <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-red-500/90 text-white px-2 py-0.5 rounded-md">BEFORE</span>
                      </div>
                    )}
                    {item.before_image_url && item.after_image_url && (
                      <ArrowRight className="w-5 h-5 text-gray-500 shrink-0" />
                    )}
                    {item.after_image_url && (
                      <div className="relative">
                        <img src={item.after_image_url} alt="After" className="w-32 h-24 sm:w-40 sm:h-28 rounded-xl object-cover" />
                        <span className="absolute bottom-1 left-1 text-[10px] font-bold bg-green-500/90 text-white px-2 py-0.5 rounded-md">AFTER</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    {item.is_featured && <Star className="w-4 h-4" style={{ color, fill: color }} />}
                    <h3 className="text-lg font-bold">{item.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {item.client_name && <span className="text-sm text-gray-400">{item.client_name}</span>}
                    {item.industry && <span className="px-2 py-0.5 text-xs rounded-md text-gray-400" style={{ backgroundColor: `${color}10` }}>{item.industry}</span>}
                  </div>
                  {item.challenge && <p className="text-sm text-gray-400 line-clamp-2">{item.challenge}</p>}
                </div>
              </div>

              {(item.before_metrics as PortalMetric[]).length > 0 && (item.after_metrics as PortalMetric[]).length > 0 && (
                <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {(item.after_metrics as PortalMetric[]).slice(0, 4).map((m, i) => {
                    const before = (item.before_metrics as PortalMetric[])[i];
                    return (
                      <div key={i} className="bg-dark-700 rounded-xl p-3 text-center">
                        <p className="text-lg font-bold" style={{ color }}>{m.value}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{m.label}</p>
                        {before && <p className="text-[10px] text-gray-600 mt-0.5">was {before.value}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              {item.testimonial_quote && (
                <div className="mt-5 p-4 rounded-xl border-l-2" style={{ borderColor: color, backgroundColor: `${color}05` }}>
                  <p className="text-sm text-gray-300 italic">"{item.testimonial_quote}"</p>
                  {item.testimonial_author && <p className="text-xs text-gray-500 mt-1.5">-- {item.testimonial_author}</p>}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h3 className="font-semibold">{selected.title}</h3>
              <button onClick={() => setSelected(null)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              {(selected.before_image_url || selected.after_image_url) && (
                <div className="flex items-center gap-4 justify-center flex-wrap">
                  {selected.before_image_url && (
                    <div className="relative">
                      <img src={selected.before_image_url} alt="Before" className="rounded-xl max-h-60 object-cover" />
                      <span className="absolute bottom-2 left-2 text-xs font-bold bg-red-500/90 text-white px-2.5 py-1 rounded-lg">BEFORE</span>
                    </div>
                  )}
                  {selected.before_image_url && selected.after_image_url && <ArrowRight className="w-6 h-6 text-gray-500" />}
                  {selected.after_image_url && (
                    <div className="relative">
                      <img src={selected.after_image_url} alt="After" className="rounded-xl max-h-60 object-cover" />
                      <span className="absolute bottom-2 left-2 text-xs font-bold bg-green-500/90 text-white px-2.5 py-1 rounded-lg">AFTER</span>
                    </div>
                  )}
                </div>
              )}

              {selected.challenge && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-red-400" /> The Challenge</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{selected.challenge}</p>
                </div>
              )}
              {selected.solution && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} /> Our Solution</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{selected.solution}</p>
                </div>
              )}
              {selected.results && (
                <div>
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-400" /> Results</h4>
                  <p className="text-gray-300 text-sm leading-relaxed">{selected.results}</p>
                </div>
              )}

              {(selected.after_metrics as PortalMetric[]).length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(selected.after_metrics as PortalMetric[]).map((m, i) => {
                    const before = (selected.before_metrics as PortalMetric[])[i];
                    return (
                      <div key={i} className="bg-dark-700 rounded-xl p-4 text-center">
                        <p className="text-xl font-bold" style={{ color }}>{m.value}</p>
                        <p className="text-xs text-gray-500 mt-1">{m.label}</p>
                        {before && <p className="text-[11px] text-gray-600 mt-0.5">Previously: {before.value}</p>}
                      </div>
                    );
                  })}
                </div>
              )}

              {selected.testimonial_quote && (
                <div className="p-4 rounded-xl border-l-2" style={{ borderColor: color, backgroundColor: `${color}05` }}>
                  <p className="text-sm text-gray-300 italic">"{selected.testimonial_quote}"</p>
                  {selected.testimonial_author && <p className="text-xs text-gray-500 mt-2">-- {selected.testimonial_author}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
