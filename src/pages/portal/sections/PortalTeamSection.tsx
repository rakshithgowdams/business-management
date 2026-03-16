import { useRef, useEffect, useState } from 'react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import type { PortalTeamMember } from '../../../lib/portal/types';

interface Props {
  items: PortalTeamMember[];
  color: string;
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  return `${parseInt(h.substring(0, 2), 16)},${parseInt(h.substring(2, 4), 16)},${parseInt(h.substring(4, 6), 16)}`;
}

function useInView(threshold = 0.15) {
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

export default function PortalTeamSection({ items, color }: Props) {
  const { isDark } = usePortalTheme();
  const { ref, inView } = useInView();

  const uniqueMembers = items.filter(
    (item, index, self) => index === self.findIndex(t => t.name === item.name && t.title === item.title)
  );

  if (uniqueMembers.length === 0) {
    return (
      <p className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        No team members listed yet.
      </p>
    );
  }

  const rgb = hexToRgb(color);

  return (
    <div ref={ref} className="space-y-8">
      <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Our Team</h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>The talented people behind our work</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {uniqueMembers.map((item, index) => (
          <div
            key={item.id}
            className={`rounded-2xl border p-6 text-center transition-all duration-700 ease-out group ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            } ${isDark
              ? 'bg-gray-800/50 border-white/[0.06] hover:border-white/10'
              : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
            style={{
              transitionDelay: inView ? `${(index + 1) * 80}ms` : '0ms',
            }}
          >
            <div className="relative mx-auto mb-4 w-20 h-20">
              {item.avatar_url ? (
                <img
                  src={item.avatar_url}
                  alt={item.name}
                  className="w-20 h-20 rounded-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ boxShadow: `0 0 0 3px ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}` }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-xl transition-transform duration-500 group-hover:scale-105"
                  style={{
                    backgroundColor: `rgba(${rgb},0.12)`,
                    color,
                    boxShadow: `0 0 0 3px ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)'}`,
                  }}
                >
                  {item.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
                </div>
              )}
              <div
                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ boxShadow: `0 0 20px rgba(${rgb},0.3)` }}
              />
            </div>

            <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.name}</h4>
            {item.title && <p className="text-sm mt-0.5 font-medium" style={{ color }}>{item.title}</p>}
            {item.bio && (
              <p className={`text-xs mt-2 line-clamp-3 leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{item.bio}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
