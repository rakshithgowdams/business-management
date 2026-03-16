import { useState, useEffect } from 'react';
import { Pin, Megaphone } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import type { PortalAnnouncement } from '../../../lib/portal/types';

interface Props {
  items: PortalAnnouncement[];
  color: string;
}

const PRIORITY_BADGE_STYLES: Record<string, string> = {
  low: 'bg-gray-500/10 text-gray-400',
  normal: 'bg-blue-500/10 text-blue-400',
  high: 'bg-amber-500/10 text-amber-400',
  urgent: 'bg-red-500/10 text-red-400',
};

export default function PortalAnnouncementsSection({ items, color }: Props) {
  const { isDark } = usePortalTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (items.length === 0) {
    return (
      <p className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        No announcements yet.
      </p>
    );
  }

  const pinned = items.filter(i => i.is_pinned);
  const unpinned = items.filter(i => !i.is_pinned);
  const sorted = [...pinned, ...unpinned];

  return (
    <div className="space-y-8">
      <div
        className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Announcements
        </h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Stay updated with the latest news and updates
        </p>
      </div>

      <div className="space-y-4">
        {sorted.map((item, index) => {
          const isUrgent = item.priority === 'urgent';
          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-5 sm:p-6 transition-all duration-700 ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } ${isDark
                ? 'bg-gray-800/50 border-white/[0.06]'
                : 'bg-white border-gray-200'
              } ${isUrgent ? 'animate-pulse-border' : ''}`}
              style={{
                transitionDelay: `${(index + 1) * 100}ms`,
                ...(isUrgent
                  ? {
                      borderColor: 'rgba(239, 68, 68, 0.3)',
                      boxShadow: '0 0 15px rgba(239, 68, 68, 0.05)',
                      animation: 'urgentPulse 2s ease-in-out infinite',
                    }
                  : {}),
              }}
            >
              <style>
                {`@keyframes urgentPulse {
                  0%, 100% { border-color: rgba(239, 68, 68, 0.15); box-shadow: 0 0 10px rgba(239, 68, 68, 0.03); }
                  50% { border-color: rgba(239, 68, 68, 0.4); box-shadow: 0 0 20px rgba(239, 68, 68, 0.08); }
                }`}
              </style>

              <div className="flex items-start gap-4">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <Megaphone className="w-5 h-5" style={{ color }} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    {item.is_pinned && (
                      <Pin className="w-3.5 h-3.5 shrink-0" style={{ color }} />
                    )}
                    <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {item.title}
                    </h4>
                    <span
                      className={`px-2 py-0.5 text-[10px] font-medium rounded-full capitalize ${
                        PRIORITY_BADGE_STYLES[item.priority] || PRIORITY_BADGE_STYLES.normal
                      }`}
                    >
                      {item.priority}
                    </span>
                  </div>

                  <p className={`text-sm leading-relaxed mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {item.message}
                  </p>

                  <p className={`text-xs mt-3 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                    {new Date(item.created_at).toLocaleDateString('en-US', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
