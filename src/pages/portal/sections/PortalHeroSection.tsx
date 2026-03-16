import { useState, useEffect } from 'react';
import { usePortalTheme } from '../../../context/PortalThemeContext';

interface Props {
  portal: { name: string; logo: string; welcome: string; description: string };
  owner: { full_name?: string; business_name?: string; avatar_url?: string };
  color: string;
}

export default function PortalHeroSection({ portal, owner, color }: Props) {
  const { isDark } = usePortalTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!portal.welcome && !portal.description && !owner.business_name) return null;

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] rounded-full blur-[140px] opacity-20"
          style={{ backgroundColor: color }}
        />
        <div
          className="absolute bottom-0 right-0 w-[400px] h-[300px] rounded-full blur-[120px] opacity-10"
          style={{ backgroundColor: color }}
        />
        <div
          className="absolute top-1/4 left-[10%] w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: color, opacity: 0.4 }}
        />
        <div
          className="absolute top-[20%] right-[15%] w-2 h-2 rounded-full animate-bounce"
          style={{ backgroundColor: color, opacity: 0.3, animationDuration: '3s' }}
        />
        <div
          className="absolute bottom-[30%] left-[20%] w-4 h-4 rounded-full animate-ping"
          style={{ backgroundColor: color, opacity: 0.15, animationDuration: '4s' }}
        />
        <div
          className="absolute top-[40%] right-[25%] w-2.5 h-2.5 rounded-full animate-pulse"
          style={{ backgroundColor: color, opacity: 0.25, animationDuration: '2.5s' }}
        />
        <div
          className="absolute bottom-[20%] right-[10%] w-3 h-3 rounded-full animate-bounce"
          style={{ backgroundColor: color, opacity: 0.2, animationDuration: '3.5s' }}
        />
        <div
          className="absolute top-[60%] left-[5%] w-1.5 h-1.5 rounded-full animate-ping"
          style={{ backgroundColor: color, opacity: 0.2, animationDuration: '5s' }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center relative">
        {portal.logo && (
          <div
            className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ transitionDelay: '0ms' }}
          >
            <img
              src={portal.logo}
              alt={portal.name}
              className="h-16 sm:h-20 object-contain mx-auto mb-8"
            />
          </div>
        )}

        {(portal.welcome || (!portal.welcome && owner.business_name)) && (
          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight transition-all duration-700 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } ${isDark ? 'text-white' : 'text-gray-900'}`}
            style={{ transitionDelay: '100ms' }}
          >
            {portal.welcome || `Welcome to ${owner.business_name}`}
          </h2>
        )}

        {portal.description && (
          <p
            className={`text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed transition-all duration-700 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            style={{ transitionDelay: '200ms' }}
          >
            {portal.description}
          </p>
        )}

        {owner.full_name && (
          <div
            className={`mt-10 inline-flex items-center gap-3 px-5 py-3 rounded-2xl border transition-all duration-700 ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            } ${isDark ? 'bg-gray-800/50 border-white/[0.06]' : 'bg-white border-gray-200'}`}
            style={{ transitionDelay: '300ms' }}
          >
            {owner.avatar_url ? (
              <img
                src={owner.avatar_url}
                alt={owner.full_name}
                className="w-10 h-10 rounded-full object-cover"
                style={{ boxShadow: `0 0 0 2px ${color}40` }}
              />
            ) : (
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ backgroundColor: `${color}20`, color }}
              >
                {owner.full_name
                  .split(' ')
                  .map(w => w[0])
                  .join('')
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
            )}
            <div className="text-left">
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {owner.full_name}
              </p>
              {owner.business_name && (
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {owner.business_name}
                </p>
              )}
            </div>
          </div>
        )}

        <div
          className={`mt-12 flex justify-center transition-all duration-700 ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '400ms' }}
        >
          <div className="h-px w-24 rounded-full" style={{ backgroundColor: `${color}30` }} />
        </div>
      </div>
    </section>
  );
}
