import { Star, Quote } from 'lucide-react';
import type { PortalTestimonial } from '../../../lib/portal/types';

interface Props { items: PortalTestimonial[]; color: string; }

export default function PortalTestimonialsSection({ items, color }: Props) {
  if (items.length === 0) {
    return <p className="text-center text-gray-500 py-12">No testimonials available yet.</p>;
  }

  const featured = items.filter(i => i.is_featured);
  const rest = items.filter(i => !i.is_featured);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Client Testimonials</h2>
        <p className="text-gray-400">What our clients say about working with us</p>
      </div>

      {featured.length > 0 && (
        <div className="space-y-5">
          {featured.map(item => (
            <div key={item.id} className="relative bg-dark-800 border border-white/[0.06] rounded-2xl p-6 sm:p-8">
              <Quote className="absolute top-6 right-6 w-10 h-10 opacity-10" style={{ color }} />
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-700'}`} />
                ))}
              </div>
              <p className="text-lg text-gray-200 italic leading-relaxed mb-5">"{item.quote}"</p>
              <div className="flex items-center gap-3">
                {item.author_avatar_url ? (
                  <img src={item.author_avatar_url} alt={item.author_name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: `${color}30`, color }}>
                    {item.author_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
                <div>
                  <p className="font-semibold">{item.author_name}</p>
                  <p className="text-sm text-gray-400">{[item.author_title, item.author_company].filter(Boolean).join(' at ')}</p>
                </div>
              </div>
              {item.project_name && (
                <p className="text-xs mt-3 px-3 py-1 rounded-lg inline-block" style={{ backgroundColor: `${color}10`, color }}>
                  Project: {item.project_name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-5">
        {rest.map(item => (
          <div key={item.id} className="bg-dark-800 border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < item.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-700'}`} />
              ))}
            </div>
            <p className="text-sm text-gray-300 italic mb-4 leading-relaxed">"{item.quote}"</p>
            <div className="flex items-center gap-3">
              {item.author_avatar_url ? (
                <img src={item.author_avatar_url} alt={item.author_name} className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: `${color}20`, color }}>
                  {item.author_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              )}
              <div>
                <p className="text-sm font-medium">{item.author_name}</p>
                <p className="text-xs text-gray-500">{[item.author_title, item.author_company].filter(Boolean).join(' at ')}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
