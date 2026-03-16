import { useNavigate } from 'react-router-dom';
import { CheckSquare, ArrowRight, Clock, AlertCircle, CheckCircle2, Circle } from 'lucide-react';
import { formatDate } from '../../../lib/format';

interface TaskData {
  id: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  assigned_to_name?: string;
}

interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
}

const priorityColor: Record<string, string> = {
  urgent: 'text-red-400 bg-red-500/10 border-red-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
};

export default function TasksOverviewWidget({ tasks, stats }: { tasks: TaskData[]; stats: TaskStats }) {
  const nav = useNavigate();
  const completionPct = stats.total > 0 ? (stats.done / stats.total) * 100 : 0;

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CheckSquare className="w-4 h-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-white">Task Overview</h3>
        </div>
        <button
          onClick={() => nav('/dashboard/task-management')}
          className="text-[10px] text-gray-500 hover:text-white flex items-center gap-1 transition-colors"
        >
          View all <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { label: 'Total', value: stats.total, color: 'text-gray-300' },
          { label: 'To Do', value: stats.todo, color: 'text-blue-400' },
          { label: 'In Progress', value: stats.inProgress, color: 'text-amber-400' },
          { label: 'Done', value: stats.done, color: 'text-emerald-400' },
        ].map(s => (
          <div key={s.label} className="text-center p-2 rounded-lg bg-white/[0.02] border border-white/5">
            <p className={`text-lg font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[9px] text-gray-500 uppercase tracking-wider">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="mb-4">
        <div className="flex items-center justify-between text-[10px] text-gray-500 mb-1.5">
          <span>Completion</span>
          <span className="font-semibold text-emerald-400">{completionPct.toFixed(0)}%</span>
        </div>
        <div className="h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-500 transition-all duration-700"
            style={{ width: `${completionPct}%` }}
          />
        </div>
        {stats.overdue > 0 && (
          <div className="flex items-center gap-1.5 mt-2">
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span className="text-[10px] text-red-400">{stats.overdue} overdue task{stats.overdue > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {tasks.length === 0 ? (
        <p className="text-gray-500 text-sm py-2 text-center">No tasks yet</p>
      ) : (
        <div className="space-y-2">
          {tasks.slice(0, 4).map(t => {
            const isOverdue = t.due_date && new Date(t.due_date) < new Date() && t.status !== 'done' && t.status !== 'completed';
            return (
              <div key={t.id} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.02] transition-colors">
                {t.status === 'done' || t.status === 'completed' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                ) : t.status === 'in_progress' || t.status === 'in-progress' ? (
                  <Clock className="w-4 h-4 text-amber-400 flex-shrink-0" />
                ) : (
                  <Circle className="w-4 h-4 text-gray-600 flex-shrink-0" />
                )}
                <span className="text-xs text-white flex-1 truncate">{t.title}</span>
                {t.priority && (
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${priorityColor[t.priority] || priorityColor.low}`}>
                    {t.priority}
                  </span>
                )}
                {t.due_date && (
                  <span className={`text-[10px] flex-shrink-0 ${isOverdue ? 'text-red-400' : 'text-gray-500'}`}>
                    {formatDate(t.due_date)}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
