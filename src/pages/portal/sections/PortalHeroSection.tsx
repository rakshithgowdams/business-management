import { useState, useEffect, useRef } from 'react';
import { usePortalTheme } from '../../../context/PortalThemeContext';

interface Props {
  portal: { name: string; logo: string; welcome: string; description: string };
  owner: { full_name?: string; business_name?: string; avatar_url?: string };
  color: string;
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `${r},${g},${b}`;
}

export default function PortalHeroSection({ portal, owner, color }: Props) {
  const { isDark } = usePortalTheme();
  const [visible, setVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!sectionRef.current) return;
    const rect = sectionRef.current.getBoundingClientRect();
    setMousePos({
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    });
  };

  if (!portal.welcome && !portal.description && !owner.business_name) return null;

  const rgb = hexToRgb(color);

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative overflow-hidden"
    >
      <style>{`
        @keyframes portalFloat1 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(30px,-20px) scale(1.1); } }
        @keyframes portalFloat2 { 0%,100% { transform: translate(0,0) scale(1); } 50% { transform: translate(-20px,30px) scale(0.9); } }
        @keyframes portalFloat3 { 0%,100% { transform: translate(0,0); } 33% { transform: translate(15px,15px); } 66% { transform: translate(-10px,5px); } }
        @keyframes portalShimmer { 0% { background-position: 200% center; } 100% { background-position: -200% center; } }
        @keyframes portalLineSlide { 0% { transform: translateX(-100%); opacity: 0; } 50% { opacity: 1; } 100% { transform: translateX(100%); opacity: 0; } }
        @keyframes portalGlowPulse { 0%,100% { opacity: 0.4; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.2); } }
        .portal-text-shimmer {
          background: linear-gradient(90deg, ${isDark ? '#fff' : '#111'} 0%, rgb(${rgb}) 50%, ${isDark ? '#fff' : '#111'} 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          animation: portalShimmer 4s linear infinite;
        }
      `}</style>

      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute w-[500px] h-[500px] rounded-full blur-[160px] opacity-15"
          style={{
            backgroundColor: color,
            left: `${mousePos.x * 100}%`,
            top: `${mousePos.y * 100}%`,
            transform: 'translate(-50%, -50%)',
            transition: 'left 0.3s ease-out, top 0.3s ease-out',
          }}
        />

        <div
          className="absolute top-[10%] left-[15%] w-3 h-3 rounded-full"
          style={{ backgroundColor: color, opacity: 0.3, animation: 'portalFloat1 6s ease-in-out infinite' }}
        />
        <div
          className="absolute top-[25%] right-[20%] w-2 h-2 rounded-full"
          style={{ backgroundColor: color, opacity: 0.25, animation: 'portalFloat2 8s ease-in-out infinite' }}
        />
        <div
          className="absolute bottom-[30%] left-[25%] w-4 h-4 rounded-full"
          style={{ backgroundColor: color, opacity: 0.15, animation: 'portalFloat3 10s ease-in-out infinite' }}
        />
        <div
          className="absolute top-[60%] right-[10%] w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: color, opacity: 0.2, animation: 'portalFloat1 7s ease-in-out infinite 1s' }}
        />
        <div
          className="absolute bottom-[15%] left-[10%] w-1.5 h-1.5 rounded-full"
          style={{ backgroundColor: color, opacity: 0.3, animation: 'portalFloat2 9s ease-in-out infinite 0.5s' }}
        />
        <div
          className="absolute top-[45%] left-[60%] w-2 h-2 rounded-full"
          style={{ backgroundColor: color, opacity: 0.2, animation: 'portalFloat3 11s ease-in-out infinite 2s' }}
        />

        <div className="absolute top-[30%] left-0 right-0 h-px overflow-hidden opacity-20">
          <div className="h-full w-1/3" style={{ backgroundColor: color, animation: 'portalLineSlide 5s linear infinite' }} />
        </div>
        <div className="absolute top-[70%] left-0 right-0 h-px overflow-hidden opacity-10">
          <div className="h-full w-1/4" style={{ backgroundColor: color, animation: 'portalLineSlide 7s linear infinite 2s' }} />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 lg:py-28 text-center relative">
        {(portal.welcome || owner.business_name) && (
          <h2
            className={`text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight transition-all duration-1000 ease-out portal-text-shimmer ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`}
          >
            {portal.welcome || `Welcome to ${owner.business_name}`}
          </h2>
        )}

        {portal.description && (
          <p
            className={`text-base sm:text-lg lg:text-xl max-w-2xl mx-auto leading-relaxed transition-all duration-1000 ease-out ${
              visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            } ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
            style={{ transitionDelay: '200ms' }}
          >
            {portal.description}
          </p>
        )}

        <div
          className={`mt-12 flex items-center justify-center gap-3 transition-all duration-1000 ease-out ${
            visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
          style={{ transitionDelay: '400ms' }}
        >
          <div className="h-px w-16 sm:w-24 rounded-full" style={{ backgroundColor: `${color}30` }} />
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color, animation: 'portalGlowPulse 2s ease-in-out infinite' }}
          />
          <div className="h-px w-16 sm:w-24 rounded-full" style={{ backgroundColor: `${color}30` }} />
        </div>
      </div>
    </section>
  );
}
