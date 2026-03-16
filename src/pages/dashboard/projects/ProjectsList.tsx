import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, AlertTriangle, Eye, Pencil, Trash2, Receipt } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatINR, formatDate } from '../../../lib/format';
import {
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  CATEGORY_COLORS,
  STATUS_COLORS,
} from '../../../lib/projects/constants';
import type { Project, ProjectWithTotals } from '../../../lib/projects/types';
import ConfirmDialog from '../../../components/ConfirmDialog';
import EmptyState from '../../../components/EmptyState';

type SortKey = 'budget' | 'spent' | 'profit' | 'created_at';

export default function ProjectsList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectWithTotals[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('created_at');

  useEffect(() => {
    if (user) loadProjects(false);
  }, [user]);

  const loadProjects = async (_force = false) => {
    setLoading(true);

    const projectsData = await supabase.from('projects').select('*').eq('user_id', user!.id).order('created_at', { ascending: false }).then(r => r.data ?? []) as Project[];

    if (!projectsData || projectsData.length === 0) {
      setProjects([]);
      setLoading(false);
      return;
    }

    const ids = projectsData.map((p) => p.id);

    const [expRes, teamRes, toolRes, timeRes] = await Promise.all([
      supabase.from('project_expenses').select('project_id, amount').in('project_id', ids).then(r => r.data ?? []) as Promise<{project_id: string; amount: number}[]>,
      supabase.from('project_team').select('project_id, total_cost').in('project_id', ids).then(r => r.data ?? []) as Promise<{project_id: string; total_cost: number}[]>,
      supabase.from('project_tools').select('project_id, total_cost').in('project_id', ids).then(r => r.data ?? []) as Promise<{project_id: string; total_cost: number}[]>,
      supabase.from('project_time_entries').select('project_id, hours').in('project_id', ids).then(r => r.data ?? []) as Promise<{project_id: string; hours: number}[]>,
    ]);

    const spentMap = new Map<string, number>();
    const hoursMap = new Map<string, number>();

    for (const e of expRes) {
      spentMap.set(e.project_id, (spentMap.get(e.project_id) || 0) + Number(e.amount));
    }
    for (const t of teamRes) {
      spentMap.set(t.project_id, (spentMap.get(t.project_id) || 0) + Number(t.total_cost));
    }
    for (const t of toolRes) {
      spentMap.set(t.project_id, (spentMap.get(t.project_id) || 0) + Number(t.total_cost));
    }
    for (const t of timeRes) {
      hoursMap.set(t.project_id, (hoursMap.get(t.project_id) || 0) + Number(t.hours));
    }

    const enriched: ProjectWithTotals[] = projectsData.map((p: Project) => ({
      ...p,
      budget: Number(p.budget),
      revenue: Number(p.revenue),
      total_spent: spentMap.get(p.id) || 0,
      total_hours: hoursMap.get(p.id) || 0,
    }));

    setProjects(enriched);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('projects').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Project deleted');
    loadProjects(true);
  };

  const filtered = useMemo(() => {
    let result = projects;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name.toLowerCase().includes(q) || p.client_name.toLowerCase().includes(q)
      );
    }
    if (filterCategory) result = result.filter((p) => p.category === filterCategory);
    if (filterStatus) result = result.filter((p) => p.status === filterStatus);

    result = [...result].sort((a, b) => {
      if (sortBy === 'budget') return b.budget - a.budget;
      if (sortBy === 'spent') return b.total_spent - a.total_spent;
      if (sortBy === 'profit') return (b.revenue - b.total_spent) - (a.revenue - a.total_spent);
      return b.created_at.localeCompare(a.created_at);
    });
    return result;
  }, [projects, search, filterCategory, filterStatus, sortBy]);

  const overbudgetCount = projects.filter((p) => p.total_spent > p.budget).length;

  const getProgressColor = (pct: number) => {
    if (pct > 90) return 'bg-red-500';
    if (pct > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Projects</h1>
        <button
          onClick={() => navigate('/dashboard/projects/new')}
          className="px-4 py-2 text-sm font-semibold rounded-lg gradient-orange text-white flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      {overbudgetCount > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{overbudgetCount} project{overbudgetCount > 1 ? 's are' : ' is'} overbudget. Review now.</span>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects or clients..."
            className="w-full pl-10 pr-4 py-2 bg-dark-700 border border-white/10 rounded-lg text-sm text-white focus:outline-none focus:border-brand-500"
          />
        </div>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="px-3 py-2 bg-dark-700 border border-white/10 rounded-lg text-sm text-white">
          <option value="">All Categories</option>
          {PROJECT_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="px-3 py-2 bg-dark-700 border border-white/10 rounded-lg text-sm text-white">
          <option value="">All Statuses</option>
          {PROJECT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as SortKey)} className="px-3 py-2 bg-dark-700 border border-white/10 rounded-lg text-sm text-white">
          <option value="created_at">Newest First</option>
          <option value="budget">Budget</option>
          <option value="spent">Spent</option>
          <option value="profit">Profit</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Create your first project to start tracking budgets, expenses, and team costs."
          action={
            <button
              onClick={() => navigate('/dashboard/projects/new')}
              className="px-4 py-2 text-sm font-semibold rounded-lg gradient-orange text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> New Project
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((p) => {
            const remaining = p.budget - p.total_spent;
            const profit = p.revenue - p.total_spent;
            const margin = p.revenue > 0 ? (profit / p.revenue) * 100 : 0;
            const pct = p.budget > 0 ? (p.total_spent / p.budget) * 100 : 0;

            return (
              <div key={p.id} className="glass-card glass-card-hover rounded-xl p-5 flex flex-col">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-white truncate">{p.name}</h3>
                    <p className="text-sm text-gray-500 truncate">{p.client_name}</p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <span className={`px-2 py-0.5 text-xs rounded-md border ${CATEGORY_COLORS[p.category] || CATEGORY_COLORS['Other']}`}>
                      {p.category}
                    </span>
                  </div>
                </div>

                <div className="mb-3">
                  <span className={`px-2 py-0.5 text-xs rounded-md border ${STATUS_COLORS[p.status] || STATUS_COLORS['Active']}`}>
                    {p.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
                  <div>
                    <p className="text-gray-500 text-xs">Budget</p>
                    <p className="font-medium">{formatINR(p.budget)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Spent</p>
                    <p className="font-medium text-orange-400">{formatINR(p.total_spent)}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Remaining</p>
                    <p className={`font-medium ${remaining < 0 ? 'text-red-400' : 'text-green-400'}`}>
                      {formatINR(Math.abs(remaining))}{remaining < 0 ? ' over' : ''}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Profit / Loss</p>
                    <p className={`font-medium ${profit >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {profit >= 0 ? '+' : '-'}{formatINR(Math.abs(profit))}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Margin</p>
                    <p className={`font-medium ${margin >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {margin.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500 text-xs">Hours</p>
                    <p className="font-medium">{p.total_hours.toFixed(1)}h</p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{Math.min(pct, 100).toFixed(0)}% used</span>
                    <span>{formatINR(p.total_spent)} / {formatINR(p.budget)}</span>
                  </div>
                  <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getProgressColor(pct)}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-4">
                  {p.start_date ? formatDate(p.start_date) : 'N/A'} — {p.end_date ? formatDate(p.end_date) : 'N/A'}
                </p>

                <div className="flex gap-2 mt-auto pt-3 border-t border-white/5">
                  <button
                    onClick={() => navigate(`/dashboard/projects/${p.id}`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-brand-400 rounded-lg hover:bg-brand-500/10 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" /> View
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/projects/${p.id}?tab=expenses&add=1`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-green-400 rounded-lg hover:bg-green-500/10 transition-colors"
                  >
                    <Receipt className="w-3.5 h-3.5" /> Expense
                  </button>
                  <button
                    onClick={() => navigate(`/dashboard/projects/${p.id}/edit`)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-gray-400 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                  <button
                    onClick={() => setDeleteId(p.id)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-red-400 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Project"
        message="This will permanently delete the project and all its expenses, team entries, tools, and time logs. This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
