import { useState, useEffect } from 'react';
import { Calendar, DollarSign, CheckCircle } from 'lucide-react';
import { usePortalTheme } from '../../../context/PortalThemeContext';
import type { PortalSharedProject } from '../../../lib/portal/types';

interface Props {
  items: PortalSharedProject[];
  color: string;
}

const STATUS_STYLES: Record<string, string> = {
  'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Completed': 'bg-green-500/10 text-green-400 border-green-500/20',
  'On Hold': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Planning': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

export default function PortalProjectsSection({ items, color }: Props) {
  const { isDark } = usePortalTheme();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (items.length === 0) {
    return (
      <p className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        No project updates available yet.
      </p>
    );
  }

  return (
    <div className="space-y-8">
      <div
        className={`transition-all duration-700 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
      >
        <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
          Project Progress
        </h2>
        <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
          Track the status and progress of your projects
        </p>
      </div>

      <div className="space-y-5">
        {items.map((item, index) => {
          const project = item.projects;
          if (!project) return null;

          const startDate = project.start_date ? new Date(project.start_date) : null;
          const endDate = project.end_date ? new Date(project.end_date) : null;
          let progressPercent = 0;
          if (startDate && endDate) {
            const total = endDate.getTime() - startDate.getTime();
            const elapsed = Date.now() - startDate.getTime();
            progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)));
          }
          if (project.status === 'Completed') progressPercent = 100;

          return (
            <div
              key={item.id}
              className={`rounded-2xl border p-6 transition-all duration-700 hover:shadow-lg ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
              } ${isDark
                ? 'bg-gray-800/50 border-white/[0.06] hover:border-white/10'
                : 'bg-white border-gray-200 hover:border-gray-300'
              }`}
              style={{ transitionDelay: `${(index + 1) * 100}ms` }}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className={`text-sm mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {project.description}
                    </p>
                  )}
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-lg border shrink-0 ${
                    STATUS_STYLES[project.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                  }`}
                >
                  {project.status}
                </span>
              </div>

              {item.show_progress && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>Progress</span>
                    <span className="font-medium" style={{ color }}>
                      {progressPercent}%
                    </span>
                  </div>
                  <div
                    className={`h-2.5 rounded-full overflow-hidden ${
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}
                  >
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{
                        width: visible ? `${progressPercent}%` : '0%',
                        backgroundColor: color,
                        transitionDelay: `${(index + 1) * 100 + 300}ms`,
                      }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                {item.show_timeline && startDate && (
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <Calendar className="w-4 h-4" style={{ color }} />
                    <span>
                      {startDate.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })}
                      {endDate &&
                        ` - ${endDate.toLocaleDateString('en-US', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}`}
                    </span>
                  </div>
                )}
                {item.show_budget && project.budget > 0 && (
                  <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <DollarSign className="w-4 h-4" style={{ color }} />
                    <span>Budget: ${project.budget.toLocaleString('en-US')}</span>
                  </div>
                )}
                {item.show_deliverables && project.status === 'Completed' && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <CheckCircle className="w-4 h-4" />
                    <span>All deliverables completed</span>
                  </div>
                )}
              </div>

              {item.custom_note && (
                <div
                  className={`mt-4 p-3 rounded-xl text-sm ${
                    isDark ? 'bg-gray-700/50 text-gray-300' : 'bg-gray-50 text-gray-600'
                  }`}
                >
                  {item.custom_note}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
