import { useEffect, useState } from 'react';
import { Plus, Trophy, X, Clock, TrendingUp, Target, CheckCircle, Pencil, BarChart2, Flag } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import toast from 'react-hot-toast';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { formatINR, daysRemaining } from '../../lib/format';
import ConfirmDialog from '../../components/ConfirmDialog';
import EmptyState from '../../components/EmptyState';

const GOAL_TYPES = ['Save Money', 'Earn Revenue', 'Reduce Spending', 'Business Milestone', 'Investment Target', 'Debt Payoff'];

const TYPE_COLORS: Record<string, string> = {
  'Save Money': '#22C55E',
  'Earn Revenue': '#3B82F6',
  'Reduce Spending': '#EF4444',
  'Business Milestone': '#F59E0B',
  'Investment Target': '#06B6D4',
  'Debt Payoff': '#FF6B00',
};

interface Goal {
  id: string;
  name: string;
  type: string;
  target_amount: number;
  current_amount: number;
  target_date: string;
  description: string;
  status: string;
}

type ViewMode = 'active' | 'completed' | 'overview';

const inputCls = 'w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 text-sm';

export default function Goals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<Goal | null>(null);
  const [showProgress, setShowProgress] = useState<string | null>(null);
  const [progressAmount, setProgressAmount] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('active');
  const [form, setForm] = useState({
    name: '', type: GOAL_TYPES[0], target_amount: '',
    current_amount: '0', target_date: '', description: '',
  });

  useEffect(() => {
    if (user) loadGoals();
  }, [user]);

  const loadGoals = async () => {
    const { data } = await supabase
      .from('goals').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
    setGoals(
      (data || []).map((d) => ({
        ...d,
        target_amount: Number(d.target_amount),
        current_amount: Number(d.current_amount),
      }))
    );
  };

  const resetForm = () => {
    setShowForm(false);
    setEditGoal(null);
    setForm({ name: '', type: GOAL_TYPES[0], target_amount: '', current_amount: '0', target_date: '', description: '' });
  };

  const openEdit = (goal: Goal) => {
    setEditGoal(goal);
    setForm({
      name: goal.name, type: goal.type,
      target_amount: String(goal.target_amount),
      current_amount: String(goal.current_amount),
      target_date: goal.target_date || '',
      description: goal.description || '',
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.target_amount || Number(form.target_amount) <= 0) {
      toast.error('Please fill in name and target amount'); return;
    }
    const payload = {
      name: form.name, type: form.type,
      target_amount: Number(form.target_amount),
      current_amount: Number(form.current_amount),
      target_date: form.target_date || null,
      description: form.description,
    };
    if (editGoal) {
      const newStatus = Number(form.current_amount) >= Number(form.target_amount) ? 'completed' : 'on_track';
      const { error } = await supabase.from('goals').update({ ...payload, status: newStatus }).eq('id', editGoal.id);
      if (error) { toast.error(error.message); return; }
      toast.success('Goal updated');
    } else {
      const { error } = await supabase.from('goals').insert({ ...payload, user_id: user!.id, status: 'on_track' });
      if (error) { toast.error(error.message); return; }
      toast.success('Goal created!');
    }
    resetForm();
    loadGoals();
  };

  const addProgress = async () => {
    if (!showProgress || !progressAmount || Number(progressAmount) <= 0) return;
    const goal = goals.find((g) => g.id === showProgress);
    if (!goal) return;
    const newAmount = Math.min(goal.current_amount + Number(progressAmount), goal.target_amount);
    const newStatus = newAmount >= goal.target_amount ? 'completed' : computeStatus(goal, newAmount);
    await supabase.from('goals').update({ current_amount: newAmount, status: newStatus }).eq('id', showProgress);
    if (newStatus === 'completed') toast.success('Goal completed! Congratulations!');
    else toast.success('Progress updated');
    setShowProgress(null);
    setProgressAmount('');
    loadGoals();
  };

  const computeStatus = (goal: Goal, currentAmount: number): string => {
    if (!goal.target_date) return 'on_track';
    const days = daysRemaining(goal.target_date);
    if (days < 0) return 'at_risk';
    const pct = goal.target_amount > 0 ? currentAmount / goal.target_amount : 0;
    const totalDays = (new Date(goal.target_date).getTime() - new Date(goal.target_date.substring(0, 7) + '-01').getTime()) / (1000 * 60 * 60 * 24) + 1;
    const elapsed = totalDays - days;
    const expectedPct = elapsed / totalDays;
    return pct < expectedPct * 0.6 ? 'at_risk' : 'on_track';
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('goals').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Goal deleted');
    loadGoals();
  };

  const getStatusColor = (status: string) => {
    if (status === 'completed') return 'text-green-400 bg-green-500/10 border border-green-500/20';
    if (status === 'at_risk') return 'text-red-400 bg-red-500/10 border border-red-500/20';
    return 'text-blue-400 bg-blue-500/10 border border-blue-500/20';
  };

  const getMilestones = (pct: number) => [25, 50, 75, 100].map((m) => ({ value: m, reached: pct >= m }));

  const activeGoals = goals.filter((g) => g.status !== 'completed');
  const completedGoals = goals.filter((g) => g.status === 'completed');
  const totalTarget = goals.reduce((s, g) => s + g.target_amount, 0);
  const totalAchieved = goals.reduce((s, g) => s + g.current_amount, 0);
  const overallPct = totalTarget > 0 ? (totalAchieved / totalTarget) * 100 : 0;

  const chartData = goals
    .filter(g => g.target_amount > 0)
    .sort((a, b) => b.target_amount - a.target_amount)
    .slice(0, 8)
    .map(g => ({
      name: g.name.length > 14 ? g.name.substring(0, 14) + '…' : g.name,
      Target: g.target_amount,
      Achieved: g.current_amount,
    }));

  const typeBreakdown = GOAL_TYPES
    .map(t => ({
      type: t,
      count: goals.filter(g => g.type === t).length,
      target: goals.filter(g => g.type === t).reduce((s, g) => s + g.target_amount, 0),
    }))
    .filter(t => t.count > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Goals</h1>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-white/10 overflow-hidden text-sm">
            {(['active', 'overview', 'completed'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-4 py-2 capitalize transition-colors ${viewMode === v ? 'bg-brand-600 text-white' : 'text-gray-400 hover:bg-white/5'}`}
              >
                {v === 'active' ? `Active (${activeGoals.length})` : v === 'completed' ? `Done (${completedGoals.length})` : 'Overview'}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 text-sm font-semibold rounded-xl gradient-orange text-white flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Add Goal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-brand-400" />
            <p className="text-sm text-gray-400">Total Targets</p>
          </div>
          <p className="text-2xl font-bold text-brand-400">{formatINR(totalTarget)}</p>
          <p className="text-xs text-gray-500 mt-1">{goals.length} goals set</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <p className="text-sm text-gray-400">Total Achieved</p>
          </div>
          <p className="text-2xl font-bold text-green-400">{formatINR(totalAchieved)}</p>
          <p className="text-xs text-gray-500 mt-1">{overallPct.toFixed(0)}% overall progress</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="w-4 h-4 text-yellow-400" />
            <p className="text-sm text-gray-400">Completed</p>
          </div>
          <p className="text-2xl font-bold text-yellow-400">{completedGoals.length}</p>
          <p className="text-xs text-gray-500 mt-1">of {goals.length} goals</p>
        </div>
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Flag className="w-4 h-4 text-red-400" />
            <p className="text-sm text-gray-400">At Risk</p>
          </div>
          <p className="text-2xl font-bold text-red-400">{activeGoals.filter(g => g.status === 'at_risk').length}</p>
          <p className="text-xs text-gray-500 mt-1">Need attention</p>
        </div>
      </div>

      {viewMode === 'active' && (
        <>
          {activeGoals.length === 0 ? (
            <EmptyState title="No active goals" description="Set your first financial goal and start tracking your progress." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeGoals.map((goal) => {
                const pct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
                const days = goal.target_date ? daysRemaining(goal.target_date) : null;
                const milestones = getMilestones(pct);
                const remaining = goal.target_amount - goal.current_amount;

                return (
                  <div key={goal.id} className="glass-card glass-card-hover rounded-xl p-5 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base truncate">{goal.name}</h3>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${TYPE_COLORS[goal.type] || '#6B7280'}20`, color: TYPE_COLORS[goal.type] || '#6B7280' }}>
                            {goal.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 ml-2 shrink-0">
                        <button onClick={() => openEdit(goal)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"><Pencil className="w-3.5 h-3.5" /></button>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(goal.status)}`}>
                          {goal.status === 'on_track' ? 'On Track' : 'At Risk'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-center my-5">
                      <div className="relative w-24 h-24">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="#2A2A2A" strokeWidth="8" />
                          <circle
                            cx="50" cy="50" r="42" fill="none"
                            stroke={TYPE_COLORS[goal.type] || '#FF6B00'} strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={`${pct * 2.64} ${264 - pct * 2.64}`}
                            style={{ transition: 'stroke-dasharray 0.5s ease' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">{Math.round(pct)}%</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Progress</span>
                        <span className="font-semibold">{formatINR(goal.current_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Target</span>
                        <span className="text-gray-300">{formatINR(goal.target_amount)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-400">Remaining</span>
                        <span className="text-red-400 font-medium">{formatINR(remaining)}</span>
                      </div>
                    </div>

                    <div className="flex justify-center gap-1.5 mb-4">
                      {milestones.map((m) => (
                        <div
                          key={m.value}
                          className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                            m.reached ? 'text-white' : 'bg-dark-600 text-gray-500'
                          }`}
                          style={m.reached ? { background: `${TYPE_COLORS[goal.type] || '#FF6B00'}30`, color: TYPE_COLORS[goal.type] || '#FF6B00' } : {}}
                        >
                          {m.reached && <Trophy className="w-2.5 h-2.5" />}
                          {m.value}%
                        </div>
                      ))}
                    </div>

                    {days !== null && (
                      <div className={`flex items-center justify-center gap-1.5 text-xs mb-4 ${days < 0 ? 'text-red-400' : days <= 30 ? 'text-orange-400' : 'text-gray-400'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        {days > 0 ? `${days} days remaining` : days === 0 ? 'Deadline today!' : `${Math.abs(days)} days overdue`}
                      </div>
                    )}

                    {goal.description && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{goal.description}</p>
                    )}

                    <div className="flex gap-2">
                      <button
                        onClick={() => { setShowProgress(goal.id); setProgressAmount(''); }}
                        className="flex-1 py-2 text-sm font-medium rounded-lg gradient-orange text-white flex items-center justify-center gap-1.5"
                      >
                        <TrendingUp className="w-4 h-4" /> Add Progress
                      </button>
                      <button
                        onClick={() => setDeleteId(goal.id)}
                        className="px-3 py-2 text-sm rounded-lg border border-white/10 text-gray-400 hover:text-red-400 hover:border-red-500/20"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {viewMode === 'overview' && (
        <div className="space-y-6">
          {goals.length === 0 ? (
            <EmptyState title="No goals yet" description="Add your first goal to see the overview." />
          ) : (
            <>
              <div className="glass-card rounded-xl p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold">Overall Progress</h3>
                  <span className="text-sm font-bold text-brand-400">{overallPct.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-dark-600 rounded-full overflow-hidden">
                  <div className="h-full gradient-orange rounded-full transition-all" style={{ width: `${overallPct}%` }} />
                </div>
                <div className="flex justify-between text-xs text-gray-500 mt-1.5">
                  <span>{formatINR(totalAchieved)} achieved</span>
                  <span>{formatINR(totalTarget - totalAchieved)} remaining</span>
                </div>
              </div>

              {chartData.length > 0 && (
                <div className="glass-card rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Goal Progress Comparison</h3>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                      <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} angle={-15} textAnchor="end" />
                      <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: any) => formatINR(v)} />
                      <Bar dataKey="Target" fill="#374151" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="Achieved" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, i) => {
                          const goal = goals.find(g => g.name.startsWith(entry.name.replace('…', '')));
                          return <Cell key={i} fill={TYPE_COLORS[goal?.type || ''] || '#FF6B00'} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="glass-card rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-white/5">
                  <h3 className="text-sm font-semibold">All Goals Summary</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-white/5">
                        <th className="px-4 py-3 font-medium">Goal</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium text-right">Target</th>
                        <th className="px-4 py-3 font-medium text-right">Achieved</th>
                        <th className="px-4 py-3 font-medium text-right">Progress</th>
                        <th className="px-4 py-3 font-medium">Deadline</th>
                        <th className="px-4 py-3 font-medium text-center">Status</th>
                        <th className="px-4 py-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {goals.map((goal) => {
                        const pct = goal.target_amount > 0 ? Math.min((goal.current_amount / goal.target_amount) * 100, 100) : 0;
                        const days = goal.target_date ? daysRemaining(goal.target_date) : null;
                        return (
                          <tr key={goal.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                            <td className="px-4 py-3">
                              <p className="font-medium">{goal.name}</p>
                              {goal.description && <p className="text-xs text-gray-500 truncate max-w-[180px]">{goal.description}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${TYPE_COLORS[goal.type] || '#6B7280'}20`, color: TYPE_COLORS[goal.type] || '#6B7280' }}>
                                {goal.type}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">{formatINR(goal.target_amount)}</td>
                            <td className="px-4 py-3 text-right text-green-400 font-medium">{formatINR(goal.current_amount)}</td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: TYPE_COLORS[goal.type] || '#FF6B00' }} />
                                </div>
                                <span className="text-xs text-gray-400 w-8 text-right">{Math.round(pct)}%</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              {goal.target_date ? (
                                <span className={`text-xs ${days !== null && days < 0 ? 'text-red-400' : days !== null && days <= 30 ? 'text-orange-400' : 'text-gray-400'}`}>
                                  {goal.target_date}
                                </span>
                              ) : (
                                <span className="text-gray-600">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-xs px-2 py-1 rounded-full font-medium ${getStatusColor(goal.status)}`}>
                                {goal.status === 'on_track' ? 'On Track' : goal.status === 'at_risk' ? 'At Risk' : 'Completed'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex justify-end gap-1">
                                {goal.status !== 'completed' && (
                                  <button
                                    onClick={() => { setShowProgress(goal.id); setProgressAmount(''); }}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-green-400 hover:bg-green-500/10"
                                    title="Add Progress"
                                  >
                                    <TrendingUp className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button onClick={() => openEdit(goal)} className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/5"><Pencil className="w-3.5 h-3.5" /></button>
                                <button onClick={() => setDeleteId(goal.id)} className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10"><Trophy className="w-3.5 h-3.5" /></button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {typeBreakdown.length > 0 && (
                <div className="glass-card rounded-xl p-5">
                  <h3 className="text-sm font-semibold mb-4">Goals by Type</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {typeBreakdown.map(t => (
                      <div
                        key={t.type}
                        className="bg-dark-800 rounded-xl p-4 border border-white/5"
                        style={{ borderLeft: `3px solid ${TYPE_COLORS[t.type] || '#6B7280'}` }}
                      >
                        <p className="text-xs text-gray-400 mb-1">{t.type}</p>
                        <p className="text-lg font-bold text-white">{t.count} <span className="text-sm text-gray-400">goals</span></p>
                        <p className="text-xs mt-1" style={{ color: TYPE_COLORS[t.type] || '#6B7280' }}>{formatINR(t.target)} target</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {viewMode === 'completed' && (
        <>
          {completedGoals.length === 0 ? (
            <EmptyState title="No completed goals yet" description="Keep working towards your goals!" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {completedGoals.map((goal) => (
                <div key={goal.id} className="glass-card rounded-xl p-5 border border-green-500/20 bg-green-500/[0.03]">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-yellow-400/10 flex items-center justify-center">
                        <Trophy className="w-5 h-5 text-yellow-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-sm">{goal.name}</h3>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: `${TYPE_COLORS[goal.type] || '#6B7280'}20`, color: TYPE_COLORS[goal.type] || '#6B7280' }}>
                          {goal.type}
                        </span>
                      </div>
                    </div>
                    <button onClick={() => setDeleteId(goal.id)} className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-xs text-gray-500">Achieved</span>
                    <span className="text-lg font-bold text-green-400">{formatINR(goal.target_amount)}</span>
                  </div>
                  {goal.target_date && (
                    <p className="text-xs text-gray-500 mt-1">Target was: {goal.target_date}</p>
                  )}
                  <div className="mt-3 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <span className="text-xs text-green-400 font-medium">Goal Completed!</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editGoal ? 'Edit Goal' : 'New Goal'}</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Goal Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Save for new laptop" />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Type</label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className={inputCls}>
                  {GOAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Target Amount *</label>
                  <input type="number" value={form.target_amount} onChange={(e) => setForm({ ...form, target_amount: e.target.value })} className={inputCls} placeholder="0" />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Current Amount</label>
                  <input type="number" value={form.current_amount} onChange={(e) => setForm({ ...form, current_amount: e.target.value })} className={inputCls} placeholder="0" />
                </div>
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Target Date</label>
                <input type="date" value={form.target_date} onChange={(e) => setForm({ ...form, target_date: e.target.value })} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className={`${inputCls} resize-none`} />
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold">
                {editGoal ? 'Update Goal' : 'Create Goal'}
              </button>
            </form>
          </div>
        </div>
      )}

      {showProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold">Add Progress</h2>
                {showProgress && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    {goals.find(g => g.id === showProgress)?.name}
                  </p>
                )}
              </div>
              <button onClick={() => setShowProgress(null)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            {showProgress && (() => {
              const g = goals.find(x => x.id === showProgress);
              if (!g) return null;
              const remaining = g.target_amount - g.current_amount;
              return (
                <div className="mb-4 p-3 bg-dark-800 rounded-xl">
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>{formatINR(g.current_amount)} of {formatINR(g.target_amount)}</span>
                    <span>{Math.round((g.current_amount / g.target_amount) * 100)}%</span>
                  </div>
                  <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
                    <div className="h-full gradient-orange rounded-full" style={{ width: `${(g.current_amount / g.target_amount) * 100}%` }} />
                  </div>
                  <p className="text-xs text-gray-500 mt-1.5">{formatINR(remaining)} remaining</p>
                </div>
              );
            })()}
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Amount to Add</label>
                <input
                  type="number"
                  value={progressAmount}
                  onChange={(e) => setProgressAmount(e.target.value)}
                  className={inputCls}
                  placeholder="0"
                  autoFocus
                />
              </div>
              <button onClick={addProgress} className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold">
                Update Progress
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Goal"
        message="Are you sure you want to delete this goal?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
