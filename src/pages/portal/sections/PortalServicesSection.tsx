import { useState, useEffect, useRef } from 'react';
import { Check } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import type { PortalService } from '../../../lib/portal/types';

interface Props {
  items: PortalService[];
  color: string;
}

function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  return `${parseInt(h.substring(0, 2), 16)},${parseInt(h.substring(2, 4), 16)},${parseInt(h.substring(4, 6), 16)}`;
}

function formatPriceWithRupee(raw: string): string {
  const cleaned = raw.replace(/[^\d.\-–,to ]/gi, '').trim();
  const numbers = raw.match(/[\d,]+(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) return raw;

  let result = raw;
  for (const numStr of numbers) {
    const num = parseFloat(numStr.replace(/,/g, ''));
    if (isNaN(num)) continue;
    const formatted = num.toLocaleString('en-IN');
    result = result.replace(numStr, formatted);
  }

  if (!/\u20B9|Rs\.?|INR/i.test(result)) {
    result = '\u20B9' + result;
  }

  return result;
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

export default function PortalServicesSection({ items, color }: Props) {
  const { isDark } = usePortalTheme();
  const { ref, inView } = useInView();
  const rgb = hexToRgb(color);

  if (items.length === 0) {
    return <p className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No services listed yet.</p>;
  }

  return (
    <div ref={ref} className="space-y-8">
      <div className={`transition-all duration-700 ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'}`}>
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Our Services</h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Comprehensive solutions tailored to your business needs</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`relative rounded-2xl border p-5 sm:p-6 transition-all duration-700 ease-out group hover:shadow-xl hover:-translate-y-1 ${
              inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            } ${isDark
              ? 'bg-gray-800/50 border-white/[0.06] hover:border-white/10'
              : 'bg-white border-gray-200 hover:border-gray-300'
            }`}
            style={{ transitionDelay: inView ? `${(index + 1) * 80}ms` : '0ms' }}
          >
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition-all duration-500 group-hover:scale-110 group-hover:rotate-3"
              style={{ backgroundColor: `${color}15` }}
            >
              <div className="w-6 h-6 rounded-md" style={{ backgroundColor: color, opacity: 0.8 }} />
            </div>

            <h3 className={`font-semibold text-base mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.service_name}</h3>
            {item.description && <p className={`text-sm mb-4 leading-relaxed ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{item.description}</p>}

            {item.features.length > 0 && (
              <ul className="space-y-2 mb-4">
                {item.features.map((f, i) => (
                  <li key={i} className={`flex items-start gap-2 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <Check className="w-4 h-4 shrink-0 mt-0.5" style={{ color }} />
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {item.price_range && (
              <p className={`text-sm font-semibold mt-auto pt-4 border-t ${isDark ? 'border-white/[0.06]' : 'border-gray-100'}`} style={{ color }}>
                {formatPriceWithRupee(item.price_range)}
              </p>
            )}

            <div
              className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
              style={{ boxShadow: `0 0 40px rgba(${rgb},0.08), 0 0 80px rgba(${rgb},0.04)` }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
