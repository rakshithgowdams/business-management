import { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Plus, Search, ChevronDown, LayoutGrid, List, Bell, Mail, BarChart3,
  AlertTriangle, CheckCircle2, Clock, Users, Briefcase, Shield, UserCheck,
  Filter, RefreshCw, Sparkles,
} from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import {
  TASK_CATEGORIES, TASK_PRIORITIES, TASK_STATUSES, ASSIGNED_TO_ROLES,
  TASK_STATUS_COLORS, TASK_PRIORITY_COLORS,
} from '../../../lib/taskmanagement/constants';
import type { TaskAssignment, TaskAlert } from '../../../lib/taskmanagement/types';
import type { Employee } from '../../../lib/employees/types';
import { DEPARTMENTS } from '../../../lib/employees/constants';
import TaskBoard from './TaskBoard';
import TaskAssignModal from './TaskAssignModal';
import TaskAnalytics from './TaskAnalytics';
import AlertCenter from './AlertCenter';
import EmailComposer from './EmailComposer';
import TaskDetailPanel from './TaskDetailPanel';

type ViewMode = 'board' | 'list' | 'analytics';
type RoleFilter = 'All' | 'HR' | 'Manager' | 'Employee';

export default function TaskManagement() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState<TaskAssignment[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [alerts, setAlerts] = useState<TaskAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('board');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterDept, setFilterDept] = useState('All');
  const [filterRole, setFilterRole] = useState<RoleFilter>('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [selectedTask, setSelectedTask] = useState<TaskAssignment | null>(null);
  const [editTask, setEditTask] = useState<TaskAssignment | null>(null);
  const [emailContext, setEmailContext] = useState<{ task?: TaskAssignment; employee?: Employee } | null>(null);

  const load = useCallback(async () => {
    if (!user) return;
    const [tRes, eRes, aRes] = await Promise.all([
      supabase
        .from('task_assignments')
        .select('*, employee:employees(full_name, job_role, department, work_email, personal_email)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase.from('employees').select('*').eq('user_id', user.id).eq('status', 'Active').order('full_name'),
      supabase.from('task_alerts').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(50),
    ]);
    setTasks((tRes.data || []).map(t => ({
      ...t,
      estimated_hours: Number(t.estimated_hours),
      logged_hours: Number(t.logged_hours),
    })) as TaskAssignment[]);
    setEmployees((eRes.data || []).map(e => ({
      ...e,
      monthly_salary: Number(e.monthly_salary),
      hourly_rate: Number(e.hourly_rate),
    })) as Employee[]);
    setAlerts((aRes.data || []) as TaskAlert[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    tasks.forEach(async (t) => {
      if (t.due_date && t.status !== 'Completed' && t.status !== 'Cancelled') {
        const due = new Date(t.due_date);
        if (due < now && t.status !== 'Overdue') {
          await supabase
            .from('task_assignments')
            .update({ status: 'Overdue' })
            .eq('id', t.id);
          await supabase.from('task_alerts').insert({
            user_id: user.id,
            task_id: t.id,
            employee_id: t.employee_id,
            alert_type: 'overdue',
            severity: 'critical',
            title: `Task Overdue: ${t.title}`,
            message: `"${t.title}" has passed its deadline.`,
            action_url: `/dashboard/task-management`,
          });
        }
      }
    });
  }, [tasks, user]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.tags.toLowerCase().includes(q) ||
        t.employee?.full_name?.toLowerCase().includes(q)
      );
    }
    if (filterPriority !== 'All') list = list.filter(t => t.priority === filterPriority);
    if (filterCategory !== 'All') list = list.filter(t => t.category === filterCategory);
    if (filterDept !== 'All') list = list.filter(t => t.department === filterDept);
    if (filterRole !== 'All') list = list.filter(t => t.assigned_to_role === filterRole);
    if (filterStatus !== 'All') list = list.filter(t => t.status === filterStatus);
    return list;
  }, [tasks, search, filterPriority, filterCategory, filterDept, filterRole, filterStatus]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const overdue = tasks.filter(t => t.status === 'Overdue').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const unreadAlerts = alerts.filter(a => !a.is_read).length;
    return { total, completed, overdue, inProgress, unreadAlerts };
  }, [tasks, alerts]);

  const handleSendEmail = (task?: TaskAssignment, employee?: Employee) => {
    setEmailContext({ task, employee });
    setShowEmailComposer(true);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            Task Management
            <span className="text-xs font-normal px-2 py-0.5 rounded-md bg-brand-600/20 text-brand-400 border border-brand-600/20">Enterprise</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {stats.total} tasks -- {stats.inProgress} active -- {stats.overdue > 0 ? `${stats.overdue} overdue` : 'No overdue'}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setShowAlerts(true)}
            className="relative px-3 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm flex items-center gap-2 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {stats.unreadAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                {stats.unreadAlerts}
              </span>
            )}
          </button>
          <button
            onClick={() => handleSendEmail()}
            className="px-3 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm flex items-center gap-2 transition-colors"
          >
            <Mail className="w-4 h-4" /> Email
          </button>
          <button
            onClick={() => setShowAssignModal(true)}
            className="px-4 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Assign Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Briefcase} label="Total Tasks" value={stats.total} color="text-white" />
        <StatCard icon={Clock} label="In Progress" value={stats.inProgress} color="text-cyan-400" />
        <StatCard icon={CheckCircle2} label="Completed" value={stats.completed} color="text-green-400" />
        <StatCard icon={AlertTriangle} label="Overdue" value={stats.overdue} color="text-red-400" pulse={stats.overdue > 0} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <RoleCard
          icon={Shield}
          label="HR Tasks"
          count={tasks.filter(t => t.assigned_to_role === 'HR').length}
          active={filterRole === 'HR'}
          onClick={() => setFilterRole(filterRole === 'HR' ? 'All' : 'HR')}
          color="rose"
        />
        <RoleCard
          icon={Users}
          label="Manager Tasks"
          count={tasks.filter(t => t.assigned_to_role === 'Manager').length}
          active={filterRole === 'Manager'}
          onClick={() => setFilterRole(filterRole === 'Manager' ? 'All' : 'Manager')}
          color="blue"
        />
        <RoleCard
          icon={UserCheck}
          label="Employee Tasks"
          count={tasks.filter(t => t.assigned_to_role === 'Employee').length}
          active={filterRole === 'Employee'}
          onClick={() => setFilterRole(filterRole === 'Employee' ? 'All' : 'Employee')}
          color="teal"
        />
        <RoleCard
          icon={Sparkles}
          label="AI Insights"
          count={alerts.filter(a => a.alert_type === 'ai_insight').length}
          active={view === 'analytics'}
          onClick={() => setView(view === 'analytics' ? 'board' : 'analytics')}
          color="amber"
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tasks, employees, tags..."
            className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <FilterSelect value={filterStatus} onChange={setFilterStatus} label="Status" options={['All', ...TASK_STATUSES]} />
          <FilterSelect value={filterPriority} onChange={setFilterPriority} label="Priority" options={['All', ...TASK_PRIORITIES]} />
          <FilterSelect value={filterCategory} onChange={setFilterCategory} label="Category" options={['All', ...TASK_CATEGORIES]} />
          <FilterSelect value={filterDept} onChange={setFilterDept} label="Dept" options={['All', ...DEPARTMENTS]} />
          <div className="flex bg-dark-800 border border-white/10 rounded-xl overflow-hidden">
            <button onClick={() => setView('board')} className={`px-3 py-2.5 transition-colors ${view === 'board' ? 'bg-brand-500/20 text-brand-400' : 'text-gray-400 hover:text-white'}`}>
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button onClick={() => setView('list')} className={`px-3 py-2.5 transition-colors ${view === 'list' ? 'bg-brand-500/20 text-brand-400' : 'text-gray-400 hover:text-white'}`}>
              <List className="w-4 h-4" />
            </button>
            <button onClick={() => setView('analytics')} className={`px-3 py-2.5 transition-colors ${view === 'analytics' ? 'bg-brand-500/20 text-brand-400' : 'text-gray-400 hover:text-white'}`}>
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {view === 'board' && (
        <TaskBoard
          tasks={filtered}
          employees={employees}
          onRefresh={load}
          onSelect={setSelectedTask}
          onEmail={handleSendEmail}
        />
      )}

      {view === 'list' && (
        <TaskListView
          tasks={filtered}
          onSelect={setSelectedTask}
          onEdit={t => { setEditTask(t); setShowAssignModal(true); }}
          onEmail={handleSendEmail}
          onRefresh={load}
        />
      )}

      {view === 'analytics' && (
        <TaskAnalytics tasks={tasks} employees={employees} alerts={alerts} onRefresh={load} />
      )}

      {showAssignModal && (
        <TaskAssignModal
          employees={employees}
          editTask={editTask}
          onClose={() => { setShowAssignModal(false); setEditTask(null); }}
          onSaved={() => { setShowAssignModal(false); setEditTask(null); load(); }}
        />
      )}

      {selectedTask && (
        <TaskDetailPanel
          task={selectedTask}
          employees={employees}
          onClose={() => setSelectedTask(null)}
          onRefresh={() => { setSelectedTask(null); load(); }}
          onEmail={handleSendEmail}
          onEdit={t => { setSelectedTask(null); setEditTask(t); setShowAssignModal(true); }}
        />
      )}

      {showAlerts && (
        <AlertCenter
          alerts={alerts}
          onClose={() => setShowAlerts(false)}
          onRefresh={load}
        />
      )}

      {showEmailComposer && (
        <EmailComposer
          task={emailContext?.task}
          employee={emailContext?.employee}
          employees={employees}
          onClose={() => { setShowEmailComposer(false); setEmailContext(null); }}
          onSent={() => { setShowEmailComposer(false); setEmailContext(null); load(); }}
        />
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color, pulse }: { icon: React.ElementType; label: string; value: number; color: string; pulse?: boolean }) {
  return (
    <div className="glass-card glass-card-hover rounded-xl p-4 transition-all duration-200">
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${color} ${pulse ? 'animate-pulse' : ''}`} />
      </div>
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function RoleCard({ icon: Icon, label, count, active, onClick, color }: {
  icon: React.ElementType; label: string; count: number; active: boolean; onClick: () => void; color: string;
}) {
  const colorMap: Record<string, string> = {
    rose: active ? 'border-rose-500/40 bg-rose-500/10' : 'border-white/[0.06]',
    blue: active ? 'border-blue-500/40 bg-blue-500/10' : 'border-white/[0.06]',
    teal: active ? 'border-teal-500/40 bg-teal-500/10' : 'border-white/[0.06]',
    amber: active ? 'border-amber-500/40 bg-amber-500/10' : 'border-white/[0.06]',
  };
  const textColor: Record<string, string> = {
    rose: 'text-rose-400',
    blue: 'text-blue-400',
    teal: 'text-teal-400',
    amber: 'text-amber-400',
  };

  return (
    <button
      onClick={onClick}
      className={`rounded-xl p-3 border transition-all duration-200 text-left hover:bg-white/[0.03] ${colorMap[color]}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${textColor[color]}`} />
        <span className={`text-lg font-bold ${active ? textColor[color] : 'text-white'}`}>{count}</span>
      </div>
      <p className="text-xs text-gray-500">{label}</p>
    </button>
  );
}

function FilterSelect({ value, onChange, label, options }: {
  value: string; onChange: (v: string) => void; label: string; options: readonly string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
      >
        {options.map(o => (
          <option key={o} value={o}>{o === 'All' ? `All ${label}` : o}</option>
        ))}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
    </div>
  );
}

function TaskListView({ tasks, onSelect, onEdit, onEmail, onRefresh }: {
  tasks: TaskAssignment[];
  onSelect: (t: TaskAssignment) => void;
  onEdit: (t: TaskAssignment) => void;
  onEmail: (task?: TaskAssignment, emp?: Employee) => void;
  onRefresh: () => void;
}) {
  const handleStatusChange = async (task: TaskAssignment, newStatus: string) => {
    const updates: Record<string, unknown> = { status: newStatus, updated_at: new Date().toISOString() };
    if (newStatus === 'In Progress' && !task.start_date) updates.start_date = new Date().toISOString();
    if (newStatus === 'Completed') {
      updates.completed_at = new Date().toISOString();
      updates.progress_percent = 100;
    }
    await supabase.from('task_assignments').update(updates).eq('id', task.id);
    onRefresh();
  };

  if (tasks.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 text-center">
        <p className="text-gray-500 text-sm">No tasks match your filters.</p>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b border-white/5">
              <th className="px-4 py-3 font-medium">Task</th>
              <th className="px-4 py-3 font-medium">Assigned To</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Due Date</th>
              <th className="px-4 py-3 font-medium">Progress</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(t => {
              const due = t.due_date ? new Date(t.due_date) : null;
              const isOverdue = due && due < new Date() && t.status !== 'Completed' && t.status !== 'Cancelled';
              return (
                <tr
                  key={t.id}
                  className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                  onClick={() => onSelect(t)}
                >
                  <td className="px-4 py-3">
                    <p className="font-medium text-white">{t.title}</p>
                    {t.tags && <p className="text-xs text-gray-500 mt-0.5">{t.tags}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-300">{t.employee?.full_name || 'Unassigned'}</p>
                    <p className="text-xs text-gray-500">{t.assigned_to_role}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-400">{t.category}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 text-xs rounded-md border ${TASK_PRIORITY_COLORS[t.priority] || ''}`}>{t.priority}</span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={t.status}
                      onChange={e => { e.stopPropagation(); handleStatusChange(t, e.target.value); }}
                      onClick={e => e.stopPropagation()}
                      className={`text-xs rounded-md border px-2 py-1 bg-transparent focus:outline-none cursor-pointer ${TASK_STATUS_COLORS[t.status] || ''}`}
                    >
                      {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className={`px-4 py-3 text-sm ${isOverdue ? 'text-red-400' : 'text-gray-400'}`}>
                    {due ? due.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '--'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-dark-600 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-500"
                          style={{ width: `${t.progress_percent}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">{t.progress_percent}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onEmail(t, undefined)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <Mail className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => onEdit(t)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                        <Filter className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
