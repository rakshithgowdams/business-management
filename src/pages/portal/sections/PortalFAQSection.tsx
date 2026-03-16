import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import type { PortalFAQ } from '../../../lib/portal/types';

interface Props {
  items: PortalFAQ[];
  color: string;
}

export default function PortalFAQSection({ items, color }: Props) {
  const { isDark } = usePortalTheme();
  const [visible, setVisible] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (items.length === 0) {
    return (
      <p className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        No FAQs available yet.
      </p>
    );
  }

  const toggleItem = (id: string) => {
    setOpenId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-8">
      <div
        className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Frequently Asked Questions
        </h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Find answers to common questions
        </p>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => {
          const isOpen = openId === item.id;
          return (
            <div
              key={item.id}
              className={`rounded-2xl border overflow-hidden transition-all duration-700 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } ${isDark
                ? 'bg-gray-800/50 border-white/[0.06]'
                : 'bg-white border-gray-200'
              } ${isOpen
                ? isDark
                  ? 'border-white/10'
                  : 'border-gray-300'
                : ''
              }`}
              style={{ transitionDelay: `${(index + 1) * 100}ms` }}
            >
              <button
                onClick={() => toggleItem(item.id)}
                className={`w-full flex items-center gap-4 p-5 text-left transition-colors ${
                  isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-gray-50'
                }`}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold shrink-0"
                  style={{ backgroundColor: `${color}15`, color }}
                >
                  {index + 1}
                </span>

                <span className={`flex-1 font-medium text-sm sm:text-base ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {item.question}
                </span>

                <ChevronDown
                  className={`w-5 h-5 shrink-0 transition-transform duration-300 ${
                    isOpen ? 'rotate-180' : ''
                  } ${isDark ? 'text-gray-400' : 'text-gray-500'}`}
                />
              </button>

              <div
                className="overflow-hidden transition-all duration-300 ease-in-out"
                style={{
                  maxHeight: isOpen ? '500px' : '0px',
                  opacity: isOpen ? 1 : 0,
                }}
              >
                <div
                  className={`px-5 pb-5 pl-[4.25rem] text-sm leading-relaxed ${
                    isDark ? 'text-gray-400' : 'text-gray-600'
                  }`}
                >
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
