import { useNavigate } from 'react-router-dom';
import { FolderKanban, Users, ArrowRight } from 'lucide-react';
import { formatINR } from '../../../lib/format';

interface ProjectData {
  id: string;
  name: string;
  status: string;
  budget: number;
  revenue: number;
}

interface ClientData {
  id: string;
  name: string;
  company: string;
  totalRevenue: number;
  invoiceCount: number;
}

const statusColor: Record<string, string> = {
  active: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  planning: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  completed: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  'on-hold': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
};

export default function ProjectsClientsWidget({
  projects,
  clients,
}: {
  projects: ProjectData[];
  clients: ClientData[];
}) {
  const nav = useNavigate();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-cyan-400" />
            <h3 className="text-sm font-semibold text-white">Active Projects</h3>
          </div>
          <button
            onClick={() => nav('/dashboard/projects')}
            className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {projects.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">No projects yet</p>
        ) : (
          <div className="space-y-3">
            {projects.slice(0, 5).map((p) => {
              const progress = p.budget > 0 ? Math.min((p.revenue / p.budget) * 100, 100) : 0;
              return (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer"
                  onClick={() => nav(`/dashboard/projects/${p.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-white truncate">{p.name}</span>
                      <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${statusColor[p.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                        {p.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 tabular-nums">{progress.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-semibold text-white">{formatINR(p.revenue)}</p>
                    <p className="text-[10px] text-gray-500">of {formatINR(p.budget)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Top Clients</h3>
          </div>
          <button
            onClick={() => nav('/dashboard/clients')}
            className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {clients.length === 0 ? (
          <p className="text-gray-500 text-sm py-6 text-center">No clients yet</p>
        ) : (
          <div className="space-y-3">
            {clients.slice(0, 5).map((c, i) => (
              <div
                key={c.id}
                className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer"
                onClick={() => nav(`/dashboard/clients/${c.id}`)}
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600/20 to-blue-400/10 flex items-center justify-center text-blue-400 text-xs font-bold border border-blue-500/20">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{c.name}</p>
                  <p className="text-[10px] text-gray-500 truncate">{c.company || `${c.invoiceCount} invoices`}</p>
                </div>
                <p className="text-xs font-semibold text-blue-400 flex-shrink-0">{formatINR(c.totalRevenue)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
