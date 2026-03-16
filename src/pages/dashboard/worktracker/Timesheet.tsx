import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, ChevronLeft, ChevronRight, Clock } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

interface TimeLog {
  id: string;
  task_id: string;
  date: string;
  hours: number;
  description: string;
}

interface TaskInfo {
  id: string;
  title: string;
  project_id: string | null;
}

export default function Timesheet() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [tasks, setTasks] = useState<TaskInfo[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const weekStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + weekOffset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [weekOffset]);

  const weekDays = useMemo(() => {
    const days: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      days.push(d);
    }
    return days;
  }, [weekStart]);

  const weekEnd = weekDays[6];

  const load = async () => {
    if (!user) return;
    const startStr = weekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];

    const [lRes, tRes, pRes] = await Promise.all([
      supabase.from('work_time_logs').select('id, task_id, date, hours, description').eq('user_id', user.id).gte('date', startStr).lte('date', endStr),
      supabase.from('work_tasks').select('id, title, project_id').eq('user_id', user.id),
      supabase.from('projects').select('id, name').eq('user_id', user.id),
    ]);
    setLogs((lRes.data || []) as TimeLog[]);
    setTasks((tRes.data || []) as TaskInfo[]);
    setProjects(pRes.data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user, weekOffset]);

  const getTaskName = (tid: string) => tasks.find((t) => t.id === tid)?.title || 'Unknown Task';
  const getProjectName = (tid: string) => {
    const task = tasks.find((t) => t.id === tid);
    if (!task?.project_id) return '';
    return projects.find((p) => p.id === task.project_id)?.name || '';
  };

  const taskIds = useMemo(() => [...new Set(logs.map((l) => l.task_id))], [logs]);

  const grid = useMemo(() => {
    const map: Record<string, Record<string, number>> = {};
    for (const tid of taskIds) {
      map[tid] = {};
      for (const day of weekDays) {
        const key = day.toISOString().split('T')[0];
        map[tid][key] = 0;
      }
    }
    for (const log of logs) {
      if (!map[log.task_id]) map[log.task_id] = {};
      map[log.task_id][log.date] = (map[log.task_id][log.date] || 0) + log.hours;
    }
    return map;
  }, [logs, taskIds, weekDays]);

  const dailyTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const day of weekDays) {
      const key = day.toISOString().split('T')[0];
      totals[key] = logs.filter((l) => l.date === key).reduce((s, l) => s + l.hours, 0);
    }
    return totals;
  }, [logs, weekDays]);

  const weekTotal = logs.reduce((s, l) => s + l.hours, 0);

  const exportCSV = () => {
    const headers = ['Task', 'Project', ...weekDays.map((d) => d.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })), 'Total'];
    const rows = taskIds.map((tid) => {
      const taskName = getTaskName(tid);
      const projName = getProjectName(tid);
      const hours = weekDays.map((d) => grid[tid][d.toISOString().split('T')[0]] || 0);
      const total = hours.reduce((s, h) => s + h, 0);
      return [taskName, projName, ...hours.map(String), String(total)];
    });
    const totalRow = ['TOTAL', '', ...weekDays.map((d) => String(dailyTotals[d.toISOString().split('T')[0]] || 0)), String(weekTotal)];
    rows.push(totalRow);

    const csv = [headers, ...rows].map((row) => row.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timesheet_${weekStart.toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const formatWeekRange = () => {
    const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
    return `${weekStart.toLocaleDateString('en-IN', opts)} - ${weekEnd.toLocaleDateString('en-IN', { ...opts, year: 'numeric' })}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/dashboard/work-tracker')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold">Timesheet</h1>
            <p className="text-sm text-gray-500 mt-1">{weekTotal}h logged this week</p>
          </div>
        </div>
        <button onClick={exportCSV} className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-sm flex items-center gap-2">
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex items-center justify-center gap-4">
        <button onClick={() => setWeekOffset(weekOffset - 1)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><ChevronLeft className="w-5 h-5" /></button>
        <div className="text-center">
          <p className="font-semibold">{formatWeekRange()}</p>
          {weekOffset !== 0 && <button onClick={() => setWeekOffset(0)} className="text-xs text-brand-400 hover:underline mt-0.5">Go to current week</button>}
        </div>
        <button onClick={() => setWeekOffset(weekOffset + 1)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><ChevronRight className="w-5 h-5" /></button>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        {taskIds.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No time logged this week.</p>
            <p className="text-gray-600 text-xs mt-1">Log time from task detail pages.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 border-b border-white/5">
                  <th className="px-4 py-3 text-left font-medium min-w-[200px]">Task</th>
                  {weekDays.map((d) => {
                    const isToday = d.toDateString() === new Date().toDateString();
                    return (
                      <th key={d.toISOString()} className={`px-3 py-3 text-center font-medium w-20 ${isToday ? 'text-brand-400' : ''}`}>
                        <div className="text-xs">{d.toLocaleDateString('en-IN', { weekday: 'short' })}</div>
                        <div className={`text-sm ${isToday ? 'text-brand-400 font-bold' : ''}`}>{d.getDate()}</div>
                      </th>
                    );
                  })}
                  <th className="px-4 py-3 text-center font-medium w-20">Total</th>
                </tr>
              </thead>
              <tbody>
                {taskIds.map((tid) => {
                  const rowTotal = weekDays.reduce((s, d) => s + (grid[tid][d.toISOString().split('T')[0]] || 0), 0);
                  return (
                    <tr key={tid} className="border-b border-white/5 hover:bg-white/[0.02]">
                      <td className="px-4 py-3">
                        <button onClick={() => navigate(`/dashboard/work-tracker/task/${tid}`)} className="text-left hover:text-brand-400 transition-colors">
                          <p className="font-medium text-white">{getTaskName(tid)}</p>
                          {getProjectName(tid) && <p className="text-xs text-gray-500">{getProjectName(tid)}</p>}
                        </button>
                      </td>
                      {weekDays.map((d) => {
                        const key = d.toISOString().split('T')[0];
                        const hrs = grid[tid][key] || 0;
                        return (
                          <td key={key} className="px-3 py-3 text-center">
                            <span className={hrs > 0 ? 'text-white font-medium' : 'text-gray-700'}>{hrs > 0 ? `${hrs}h` : '-'}</span>
                          </td>
                        );
                      })}
                      <td className="px-4 py-3 text-center font-semibold text-brand-400">{rowTotal}h</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t border-white/10">
                  <td className="px-4 py-3 font-semibold text-gray-400">Daily Total</td>
                  {weekDays.map((d) => {
                    const key = d.toISOString().split('T')[0];
                    const total = dailyTotals[key] || 0;
                    return (
                      <td key={key} className="px-3 py-3 text-center font-semibold text-blue-400">{total > 0 ? `${total}h` : '-'}</td>
                    );
                  })}
                  <td className="px-4 py-3 text-center font-bold text-lg text-brand-400">{weekTotal}h</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
