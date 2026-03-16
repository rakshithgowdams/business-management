import { useState, useEffect, useRef } from 'react';
import { Star, Quote } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import type { PortalTestimonial } from '../../../lib/portal/types';

interface Props {
  items: PortalTestimonial[];
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

export default function PortalTestimonialsSection({ items, color }: Props) {
  const { isDark } = usePortalTheme();
  const { ref, inView } = useInView();

  if (items.length === 0) {
    return <p className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No testimonials available yet.</p>;
  }

  const featured = items.filter(i => i.is_featured);
  const rest = items.filter(i => !i.is_featured);

  const renderStars = (rating: number, size: string) => (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${size} transition-all duration-500 ${
            i < rating ? 'fill-amber-400 text-amber-400' : isDark ? 'text-gray-700' : 'text-gray-300'
          }`}
          style={inView ? { transitionDelay: `${i * 100}ms` } : undefined}
        />
      ))}
    </div>
  );

  const renderAvatar = (item: PortalTestimonial, size: string, textSize: string) => {
    if (item.author_avatar_url) {
      return <img src={item.author_avatar_url} alt={item.author_name} className={`${size} rounded-full object-cover`} />;
    }
    return (
      <div
        className={`${size} rounded-full flex items-center justify-center ${textSize} font-bold`}
        style={{ backgroundColor: `${color}25`, color }}
      >
        {item.author_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
      </div>
    );
  };

  return (
    <div ref={ref} className="space-y-8">
      <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Client Testimonials</h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>What our clients say about working with us</p>
      </div>

      {featured.length > 0 && (
        <div className="space-y-5">
          {featured.map((item, index) => (
            <div
              key={item.id}
              className={`relative rounded-2xl border p-5 sm:p-6 md:p-8 transition-all duration-700 ease-out ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              } ${isDark ? 'bg-gray-800/50 border-white/[0.06]' : 'bg-white border-gray-200'}`}
              style={{ transitionDelay: inView ? `${(index + 1) * 100}ms` : '0ms' }}
            >
              <Quote className="absolute top-5 right-5 sm:top-6 sm:right-6 w-10 h-10 sm:w-12 sm:h-12 opacity-10" style={{ color }} />
              <div className="mb-4">{renderStars(item.rating, 'w-4 h-4 sm:w-5 sm:h-5')}</div>
              <p className={`text-base sm:text-lg lg:text-xl italic leading-relaxed mb-6 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                &ldquo;{item.quote}&rdquo;
              </p>
              <div className="flex items-center gap-3 sm:gap-4">
                {renderAvatar(item, 'w-12 h-12 sm:w-14 sm:h-14', 'text-base')}
                <div>
                  <p className={`font-semibold text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.author_name}</p>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {[item.author_title, item.author_company].filter(Boolean).join(' at ')}
                  </p>
                </div>
              </div>
              {item.project_name && (
                <p className="text-xs mt-4 px-3 py-1.5 rounded-lg inline-block font-medium" style={{ backgroundColor: `${color}10`, color }}>
                  Project: {item.project_name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {rest.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-5">
          {rest.map((item, index) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4 sm:p-5 transition-all duration-700 ease-out hover:shadow-md hover:-translate-y-0.5 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              } ${isDark ? 'bg-gray-800/50 border-white/[0.06] hover:border-white/10' : 'bg-white border-gray-200 hover:border-gray-300'}`}
              style={{ transitionDelay: inView ? `${(featured.length + index + 1) * 100}ms` : '0ms' }}
            >
              <div className="mb-3">{renderStars(item.rating, 'w-3.5 h-3.5 sm:w-4 sm:h-4')}</div>
              <p className={`text-sm italic mb-4 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>&ldquo;{item.quote}&rdquo;</p>
              <div className="flex items-center gap-3">
                {renderAvatar(item, 'w-9 h-9 sm:w-10 sm:h-10', 'text-sm')}
                <div>
                  <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.author_name}</p>
                  <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {[item.author_title, item.author_company].filter(Boolean).join(' at ')}
                  </p>
                </div>
              </div>
              {item.project_name && (
                <p className="text-xs mt-3 px-2.5 py-1 rounded-md inline-block" style={{ backgroundColor: `${color}10`, color }}>{item.project_name}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
