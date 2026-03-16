import { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import type { PortalFAQ } from '../../../lib/portal/types';

interface Props {
  items: PortalFAQ[];
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

export default function PortalFAQSection({ items, color }: Props) {
  const { isDark } = usePortalTheme();
  const { ref, inView } = useInView();
  const [openId, setOpenId] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No FAQs available yet.</p>;
  }

  const toggleItem = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <div ref={ref} className="space-y-8">
      <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Frequently Asked Questions</h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Find answers to common questions</p>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-2xl border overflow-hidden transition-all duration-700 ease-out ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              } ${isDark ? 'bg-gray-800/50 border-white/[0.06]' : 'bg-white border-gray-200'} ${
                isOpen ? (isDark ? 'border-white/10 shadow-lg' : 'border-gray-300 shadow-md') : ''
              }`}
              style={{ transitionDelay: inView ? `${(index + 1) * 80}ms` : '0ms' }}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className={`w-full flex items-center gap-3 sm:gap-4 p-4 sm:p-5 text-left transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'}`}
              >
                <span
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold shrink-0 transition-transform duration-300"
                  style={{
                    backgroundColor: `${color}15`,
                    color,
                    transform: isOpen ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  {index + 1}
                </span>
                <span className={`flex-1 font-medium text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.question}</span>
                <ChevronDown
                  className={`w-5 h-5 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'rotate-180' : ''} ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                />
              </button>

              <div
                className="overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ maxHeight: isOpen ? '500px' : '0px', opacity: isOpen ? 1 : 0 }}
              >
                <div className={`px-4 pb-4 sm:px-5 sm:pb-5 pl-[3.5rem] sm:pl-[4.25rem] text-sm leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {item.answer}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
