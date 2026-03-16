import { useState, useEffect } from 'react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import type { PortalTeamMember } from '../../../lib/portal/types';

interface Props {
  items: PortalTeamMember[];
  color: string;
}

export default function PortalTeamSection({ items, color }: Props) {
  const { isDark } = usePortalTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (items.length === 0) {
    return (
      <p className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        No team members listed yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div
        className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Our Team
        </h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          The talented people behind our work
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`rounded-2xl border p-6 text-center transition-all duration-700 group hover:shadow-lg ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } ${isDark
              ? 'bg-gray-800/50 border-white/[0.06] hover:border-white/10'
              : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
            style={{ transitionDelay: `${(index + 1) * 100}ms` }}
          >
            {item.avatar_url ? (
              <img
                src={item.avatar_url}
                alt={item.name}
                className="w-20 h-20 rounded-full object-cover mx-auto mb-4 ring-2 transition-all group-hover:ring-4"
                style={{
                  boxShadow: `0 0 0 2px ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center font-bold text-xl mx-auto mb-4 ring-2 transition-all group-hover:ring-4"
                style={{
                  backgroundColor: `${color}20`,
                  color,
                  boxShadow: `0 0 0 2px ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'}`,
                }}
              >
                {item.name
                  .split(' ')
                  .map(w => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}

            <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {item.name}
            </h4>

            {item.title && (
              <p className="text-sm mt-0.5 font-medium" style={{ color }}>
                {item.title}
              </p>
            )}

            {item.bio && (
              <p className={`text-xs mt-2 line-clamp-3 leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {item.bio}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
