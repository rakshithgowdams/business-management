import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Pencil, AlertTriangle, Clock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatINR } from '../../../lib/format';
import type { Project, ProjectExpense, ProjectTeamEntry, ProjectTool, ProjectTimeEntry, ProjectAgreement } from '../../../lib/projects/types';
import { CATEGORY_COLORS, STATUS_COLORS } from '../../../lib/projects/constants';
import OverviewTab from './tabs/OverviewTab';
import ExpensesTab from './tabs/ExpensesTab';
import TeamToolsTab from './tabs/TeamToolsTab';
import TimeTrackerTab from './tabs/TimeTrackerTab';

const TABS = ['Overview', 'Expenses', 'Team & Tools', 'Time Tracker'] as const;
type TabType = typeof TABS[number];

export default function ProjectDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [project, setProject] = useState<Project | null>(null);
  const [expenses, setExpenses] = useState<ProjectExpense[]>([]);
  const [team, setTeam] = useState<ProjectTeamEntry[]>([]);
  const [tools, setTools] = useState<ProjectTool[]>([]);
  const [timeEntries, setTimeEntries] = useState<ProjectTimeEntry[]>([]);
  const [agreements, setAgreements] = useState<ProjectAgreement[]>([]);
  const [loading, setLoading] = useState(true);

  const tabParam = searchParams.get('tab');
  const autoAdd = searchParams.get('add') === '1';
  const initialTab: TabType = tabParam === 'expenses' ? 'Expenses' : tabParam === 'team' ? 'Team & Tools' : tabParam === 'time' ? 'Time Tracker' : 'Overview';
  const [activeTab, setActiveTab] = useState<TabType>(initialTab);

  const loadAll = useCallback(async () => {
    if (!user || !id) return;
    const [pRes, eRes, tRes, toRes, tiRes, aRes] = await Promise.all([
      supabase.from('projects').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
      supabase.from('project_expenses').select('*').eq('project_id', id).order('date', { ascending: false }),
      supabase.from('project_team').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('project_tools').select('*').eq('project_id', id).order('created_at', { ascending: false }),
      supabase.from('project_time_entries').select('*').eq('project_id', id).order('date', { ascending: false }),
      supabase.from('project_agreements').select('*').eq('project_id', id).order('created_at', { ascending: false }),
    ]);

    if (!pRes.data) {
      navigate('/dashboard/projects');
      return;
    }

    setProject({ ...pRes.data, budget: Number(pRes.data.budget), revenue: Number(pRes.data.revenue) });
    setExpenses((eRes.data || []).map((e) => ({ ...e, amount: Number(e.amount) })));
    setTeam((tRes.data || []).map((t) => ({ ...t, hours_worked: Number(t.hours_worked), rate_per_hour: Number(t.rate_per_hour), total_cost: Number(t.total_cost) })));
    setTools((toRes.data || []).map((t) => ({ ...t, cost_per_month: Number(t.cost_per_month), months_used: Number(t.months_used), total_cost: Number(t.total_cost) })));
    setTimeEntries((tiRes.data || []).map((t) => ({ ...t, hours: Number(t.hours) })));
    setAgreements((aRes.data || []).map((a) => ({ ...a, file_size: Number(a.file_size) })));
    setLoading(false);
  }, [user, id, navigate]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  if (loading || !project) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalTeamCost = team.reduce((s, t) => s + t.total_cost, 0);
  const totalToolCost = tools.reduce((s, t) => s + t.total_cost, 0);
  const totalSpent = totalExpenses + totalTeamCost + totalToolCost;
  const remaining = project.budget - totalSpent;
  const profit = project.revenue - totalSpent;
  const margin = project.revenue > 0 ? (profit / project.revenue) * 100 : 0;
  const pct = project.budget > 0 ? (totalSpent / project.budget) * 100 : 0;
  const totalHours = timeEntries.reduce((s, t) => s + t.hours, 0);

  const getProgressColor = (p: number) => {
    if (p > 90) return 'bg-red-500';
    if (p > 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const endDatePassed = project.end_date && new Date(project.end_date) < new Date() && project.status === 'Active';

  const summaryCards = [
    { label: 'Budget', value: formatINR(project.budget), color: 'text-white' },
    { label: 'Total Spent', value: formatINR(totalSpent), color: 'text-orange-400' },
    { label: 'Remaining', value: formatINR(Math.abs(remaining)), color: remaining < 0 ? 'text-red-400' : 'text-green-400', suffix: remaining < 0 ? ' over' : '' },
    { label: 'Revenue', value: formatINR(project.revenue), color: 'text-blue-400' },
    { label: 'Profit / Loss', value: `${profit >= 0 ? '+' : '-'}${formatINR(Math.abs(profit))}`, color: profit >= 0 ? 'text-green-400' : 'text-red-400' },
    { label: 'Margin', value: `${margin.toFixed(1)}%`, color: margin >= 0 ? 'text-green-400' : 'text-red-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => navigate('/dashboard/projects')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors shrink-0">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold truncate">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-sm text-gray-400">{project.client_name}</span>
              <span className={`px-2 py-0.5 text-xs rounded-md border ${CATEGORY_COLORS[project.category] || CATEGORY_COLORS['Other']}`}>
                {project.category}
              </span>
              <span className={`px-2 py-0.5 text-xs rounded-md border ${STATUS_COLORS[project.status] || STATUS_COLORS['Active']}`}>
                {project.status}
              </span>
            </div>
          </div>
        </div>
        <button onClick={() => navigate(`/dashboard/projects/${id}/edit`)} className="px-4 py-2 text-sm font-medium rounded-lg border border-white/10 hover:bg-white/5 transition-colors flex items-center gap-2 shrink-0">
          <Pencil className="w-4 h-4" /> Edit
        </button>
      </div>

      {pct > 80 && pct <= 100 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" /> Budget {Math.round(pct)}% used
        </div>
      )}
      {pct > 100 && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertTriangle className="w-5 h-5 shrink-0" /> Project is OVERBUDGET by {formatINR(Math.abs(remaining))}
        </div>
      )}
      {endDatePassed && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
          <Clock className="w-5 h-5 shrink-0" /> Deadline passed -- update status
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        {summaryCards.map((c) => (
          <div key={c.label} className="glass-card rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-1">{c.label}</p>
            <p className={`text-lg font-bold ${c.color}`}>{c.value}{c.suffix || ''}</p>
          </div>
        ))}
      </div>

      <div className="glass-card rounded-xl p-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-400">{formatINR(totalSpent)} spent of {formatINR(project.budget)} budget ({Math.min(pct, 999).toFixed(0)}%)</span>
          <span className="text-gray-400">{totalHours.toFixed(1)}h logged</span>
        </div>
        <div className="h-3 bg-dark-600 rounded-full overflow-hidden">
          <div className={`h-full rounded-full transition-all ${getProgressColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-white/5 -mx-1 px-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && <OverviewTab expenses={expenses} team={team} tools={tools} />}
      {activeTab === 'Expenses' && <ExpensesTab projectId={project.id} expenses={expenses} onRefresh={loadAll} autoOpenAdd={autoAdd} />}
      {activeTab === 'Team & Tools' && <TeamToolsTab projectId={project.id} team={team} tools={tools} agreements={agreements} onRefresh={loadAll} />}
      {activeTab === 'Time Tracker' && <TimeTrackerTab projectId={project.id} timeEntries={timeEntries} totalSpent={totalSpent} onRefresh={loadAll} />}
    </div>
  );
}
