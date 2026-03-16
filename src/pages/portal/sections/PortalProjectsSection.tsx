import { Calendar, DollarSign, CheckCircle } from 'lucide-react';
import type { PortalSharedProject } from '../../../lib/portal/types';

interface Props { items: PortalSharedProject[]; color: string; }

const STATUS_STYLES: Record<string, string> = {
  'In Progress': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Completed': 'bg-green-500/10 text-green-400 border-green-500/20',
  'On Hold': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Planning': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
};

export default function PortalProjectsSection({ items, color }: Props) {
  if (items.length === 0) {
    return <p className="text-center text-gray-500 py-12">No project updates available yet.</p>;
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold mb-2">Project Progress</h2>
        <p className="text-gray-400">Track the status and progress of your projects</p>
      </div>

      <div className="space-y-5">
        {items.map(item => {
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
            <div key={item.id} className="bg-dark-800 border border-white/[0.06] rounded-2xl p-6 hover:border-white/10 transition-all">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{project.name}</h3>
                  {project.description && <p className="text-sm text-gray-400 mt-1 line-clamp-2">{project.description}</p>}
                </div>
                <span className={`px-3 py-1 text-xs font-medium rounded-lg border shrink-0 ${STATUS_STYLES[project.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                  {project.status}
                </span>
              </div>

              {item.show_progress && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-400">Progress</span>
                    <span className="font-medium" style={{ color }}>{progressPercent}%</span>
                  </div>
                  <div className="h-2.5 bg-dark-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${progressPercent}%`, backgroundColor: color }}
                    />
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-4">
                {item.show_timeline && startDate && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Calendar className="w-4 h-4" style={{ color }} />
                    <span>
                      {startDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {endDate && ` - ${endDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`}
                    </span>
                  </div>
                )}
                {item.show_budget && project.budget > 0 && (
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <DollarSign className="w-4 h-4" style={{ color }} />
                    <span>Budget: Rs.{project.budget.toLocaleString('en-IN')}</span>
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
                <div className="mt-4 p-3 rounded-xl bg-dark-700 text-sm text-gray-300">
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
