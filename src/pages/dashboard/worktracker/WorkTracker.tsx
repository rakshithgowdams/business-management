import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, LayoutGrid, List, Calendar, Clock, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../lib/format';
import {
  TASK_PRIORITIES,
  TASK_STATUS_COLORS, TASK_PRIORITY_COLORS,
} from '../../../lib/worktracker/constants';
import type { WorkTask } from '../../../lib/worktracker/types';
import KanbanBoard from './KanbanBoard';
import TaskFormModal from './TaskFormModal';

type ViewMode = 'kanban' | 'list' | 'calendar';

export default function WorkTracker() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState<WorkTask[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('kanban');
  const [search, setSearch] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterProject, setFilterProject] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());

  const load = async () => {
    if (!user) return;
    const [tRes, pRes] = await Promise.all([
      supabase.from('work_tasks').select('*').eq('user_id', user.id).order('sort_order'),
      supabase.from('projects').select('id, name').eq('user_id', user.id).order('name'),
    ]);
    setTasks((tRes.data || []) as WorkTask[]);
    setProjects(pRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const filtered = useMemo(() => {
    let list = tasks;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.title.toLowerCase().includes(q) || t.labels.toLowerCase().includes(q));
    }
    if (filterPriority !== 'All') list = list.filter((t) => t.priority === filterPriority);
    if (filterProject !== 'All') list = list.filter((t) => t.project_id === filterProject);
    return list;
  }, [tasks, search, filterPriority, filterProject]);

  const summary = useMemo(() => ({
    total: tasks.length,
    todo: tasks.filter((t) => t.status === 'To Do').length,
    inProgress: tasks.filter((t) => t.status === 'In Progress').length,
    done: tasks.filter((t) => t.status === 'Done').length,
  }), [tasks]);

  const getProjectName = (pid: string | null) => projects.find((p) => p.id === pid)?.name || '';

  const calDays = useMemo(() => {
    const firstDay = new Date(calYear, calMonth, 1).getDay();
    const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calMonth, calYear]);

  const calTaskMap = useMemo(() => {
    const map: Record<number, WorkTask[]> = {};
    for (const t of filtered) {
      if (!t.due_date) continue;
      const d = new Date(t.due_date);
      if (d.getMonth() === calMonth && d.getFullYear() === calYear) {
        const day = d.getDate();
        if (!map[day]) map[day] = [];
        map[day].push(t);
      }
    }
    return map;
  }, [filtered, calMonth, calYear]);

  const onTaskCreated = () => {
    setShowForm(false);
    load();
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Work Tracker</h1>
          <p className="text-sm text-gray-500 mt-1">{summary.total} tasks -- {summary.inProgress} in progress</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/dashboard/work-tracker/timesheet')} className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm flex items-center gap-2">
            <Clock className="w-4 h-4" /> Timesheet
          </button>
          <button onClick={() => setShowForm(true)} className="px-4 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Task
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">To Do</p>
          <p className="text-xl font-bold text-gray-400">{summary.todo}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">In Progress</p>
          <p className="text-xl font-bold text-blue-400">{summary.inProgress}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Done</p>
          <p className="text-xl font-bold text-green-400">{summary.done}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Total</p>
          <p className="text-xl font-bold">{summary.total}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search tasks..." className="w-full pl-10 pr-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
              <option value="All">All Priority</option>
              {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
              <option value="All">All Projects</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <div className="flex bg-dark-800 border border-white/10 rounded-xl overflow-hidden">
            <button onClick={() => setView('kanban')} className={`px-3 py-2.5 ${view === 'kanban' ? 'bg-brand-500/20 text-brand-400' : 'text-gray-400 hover:text-white'}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setView('list')} className={`px-3 py-2.5 ${view === 'list' ? 'bg-brand-500/20 text-brand-400' : 'text-gray-400 hover:text-white'}`}><List className="w-4 h-4" /></button>
            <button onClick={() => setView('calendar')} className={`px-3 py-2.5 ${view === 'calendar' ? 'bg-brand-500/20 text-brand-400' : 'text-gray-400 hover:text-white'}`}><Calendar className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {view === 'kanban' && (
        <KanbanBoard tasks={filtered} onRefresh={load} getProjectName={getProjectName} />
      )}

      {view === 'list' && (
        <div className="glass-card rounded-xl overflow-hidden">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No tasks found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-white/5">
                    <th className="px-4 py-3 font-medium">Task</th>
                    <th className="px-4 py-3 font-medium">Project</th>
                    <th className="px-4 py-3 font-medium">Priority</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Due Date</th>
                    <th className="px-4 py-3 font-medium text-right">Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer" onClick={() => navigate(`/dashboard/work-tracker/task/${t.id}`)}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-white">{t.title}</p>
                        {t.labels && <p className="text-xs text-gray-500 mt-0.5">{t.labels}</p>}
                      </td>
                      <td className="px-4 py-3 text-gray-400">{getProjectName(t.project_id) || '--'}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs rounded-md border ${TASK_PRIORITY_COLORS[t.priority] || ''}`}>{t.priority}</span></td>
                      <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs rounded-md border ${TASK_STATUS_COLORS[t.status] || ''}`}>{t.status}</span></td>
                      <td className="px-4 py-3 text-gray-400">{t.due_date ? formatDate(t.due_date) : '--'}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{t.logged_hours}/{t.estimated_hours}h</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {view === 'calendar' && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(calYear - 1); } else setCalMonth(calMonth - 1); }} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
            <h3 className="text-lg font-semibold">{MONTH_NAMES[calMonth]} {calYear}</h3>
            <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(calYear + 1); } else setCalMonth(calMonth + 1); }} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
            ))}
            {calDays.map((day, i) => {
              const dayTasks = day ? calTaskMap[day] || [] : [];
              const isToday = day === new Date().getDate() && calMonth === new Date().getMonth() && calYear === new Date().getFullYear();
              return (
                <div key={i} className={`min-h-[80px] rounded-lg p-1.5 ${day ? 'bg-dark-700/30 hover:bg-dark-700/50' : ''} ${isToday ? 'ring-1 ring-brand-500/30' : ''}`}>
                  {day && (
                    <>
                      <p className={`text-xs font-medium mb-1 ${isToday ? 'text-brand-400' : 'text-gray-500'}`}>{day}</p>
                      <div className="space-y-0.5">
                        {dayTasks.slice(0, 3).map((t) => (
                          <button key={t.id} onClick={() => navigate(`/dashboard/work-tracker/task/${t.id}`)} className={`w-full text-left px-1.5 py-0.5 rounded text-[10px] truncate ${TASK_PRIORITY_COLORS[t.priority]?.split(' ')[0] || 'bg-gray-500/10'} text-white`}>
                            {t.title}
                          </button>
                        ))}
                        {dayTasks.length > 3 && <p className="text-[10px] text-gray-500 px-1">+{dayTasks.length - 3} more</p>}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showForm && (
        <TaskFormModal projects={projects} onClose={() => setShowForm(false)} onSaved={onTaskCreated} />
      )}
    </div>
  );
}
