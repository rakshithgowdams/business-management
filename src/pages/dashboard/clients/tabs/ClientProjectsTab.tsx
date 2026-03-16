import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderKanban } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatINR } from '../../../../lib/format';
import type { Client } from '../../../../lib/clients/types';

interface ProjectRow {
  id: string;
  name: string;
  category: string;
  status: string;
  budget: number;
  revenue: number;
}

interface Props {
  client: Client;
}

export default function ClientProjectsTab({ client }: Props) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('projects')
      .select('id, name, category, status, budget, revenue')
      .eq('user_id', user.id)
      .then(({ data }) => {
        const matched = (data || []).filter((p) => {
          const cn = (p as any).client_name?.toLowerCase().trim();
          return cn === client.full_name.toLowerCase().trim() ||
            (client.company_name && cn === client.company_name.toLowerCase().trim());
        });
        setProjects(matched.map((p) => ({ ...p, budget: Number(p.budget), revenue: Number(p.revenue) })));
        setLoading(false);
      });
  }, [user, client]);

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  const totalRevenue = projects.reduce((s, p) => s + p.revenue, 0);
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Projects ({projects.length})</h3>
        <button onClick={() => navigate('/dashboard/projects/new')} className="px-3 py-1.5 text-xs font-semibold rounded-lg gradient-orange text-white flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> New Project
        </button>
      </div>

      {projects.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total Revenue</p>
            <p className="text-lg font-bold text-green-400">{formatINR(totalRevenue)}</p>
          </div>
          <div className="glass-card rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">Total Budget</p>
            <p className="text-lg font-bold">{formatINR(totalBudget)}</p>
          </div>
        </div>
      )}

      {projects.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-gray-500 text-sm">
          No projects linked to this client yet.
        </div>
      ) : (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} onClick={() => navigate(`/dashboard/projects/${p.id}`)} className="glass-card glass-card-hover rounded-xl p-4 cursor-pointer flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                <FolderKanban className="w-5 h-5 text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-white truncate">{p.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span>{p.category}</span>
                  <span>|</span>
                  <span>{p.status}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-medium text-green-400">{formatINR(p.revenue)}</p>
                <p className="text-xs text-gray-500">Revenue</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
