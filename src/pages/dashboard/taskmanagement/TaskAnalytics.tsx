import { useState, useMemo } from 'react';
import {
  Sparkles, Loader2, TrendingUp, AlertTriangle, Users, CheckCircle2,
  Clock, BarChart3, Target, Award, ArrowUpRight, ArrowDownRight,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../../context/AuthContext';
import { callTaskAI } from '../../../lib/ai/api';
import {
  TASK_PRIORITY_COLORS, TASK_STATUS_COLORS, CATEGORY_COLORS,
} from '../../../lib/taskmanagement/constants';
import type { TaskAssignment, TaskAlert, AITaskAnalysis } from '../../../lib/taskmanagement/types';
import type { Employee } from '../../../lib/employees/types';
import { getInitials, getAvatarColor } from '../../../lib/employees/constants';

interface Props {
  tasks: TaskAssignment[];
  employees: Employee[];
  alerts: TaskAlert[];
  onRefresh: () => void;
}

export default function TaskAnalytics({ tasks, employees, alerts, onRefresh }: Props) {
  const { user } = useAuth();
  const [aiAnalysis, setAiAnalysis] = useState<AITaskAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const metrics = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed').length;
    const overdue = tasks.filter(t => t.status === 'Overdue').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

    const completedTasks = tasks.filter(t => t.completed_at && t.start_date);
    const avgHours = completedTasks.length > 0
      ? completedTasks.reduce((sum, t) => {
          const start = new Date(t.start_date!).getTime();
          const end = new Date(t.completed_at!).getTime();
          return sum + (end - start) / (1000 * 60 * 60);
        }, 0) / completedTasks.length
      : 0;

    const byPriority = {
      Critical: tasks.filter(t => t.priority === 'Critical').length,
      High: tasks.filter(t => t.priority === 'High').length,
      Medium: tasks.filter(t => t.priority === 'Medium').length,
      Low: tasks.filter(t => t.priority === 'Low').length,
    };

    const byCategory: Record<string, number> = {};
    tasks.forEach(t => {
      byCategory[t.category] = (byCategory[t.category] || 0) + 1;
    });

    const byEmployee: Record<string, { name: string; assigned: number; completed: number; overdue: number }> = {};
    tasks.forEach(t => {
      if (t.employee_id && t.employee?.full_name) {
        if (!byEmployee[t.employee_id]) {
          byEmployee[t.employee_id] = { name: t.employee.full_name, assigned: 0, completed: 0, overdue: 0 };
        }
        byEmployee[t.employee_id].assigned++;
        if (t.status === 'Completed') byEmployee[t.employee_id].completed++;
        if (t.status === 'Overdue') byEmployee[t.employee_id].overdue++;
      }
    });

    return { total, completed, overdue, inProgress, completionRate, avgHours, byPriority, byCategory, byEmployee };
  }, [tasks]);

  const runAIAnalysis = async () => {
    setAiLoading(true);
    try {
      const taskData = tasks.map(t => ({
        title: t.title,
        status: t.status,
        priority: t.priority,
        category: t.category,
        assigned_to: t.employee?.full_name || 'Unassigned',
        due_date: t.due_date,
        progress: t.progress_percent,
        estimated_hours: t.estimated_hours,
        logged_hours: t.logged_hours,
      }));

      const result = await callTaskAI({ action: 'analyze-tasks', tasks: taskData }, 'task_analysis');
      if (result.data) {
        setAiAnalysis(result.data as unknown as AITaskAnalysis);
        toast.success('AI analysis complete');
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch {
      toast.error('Failed to run AI analysis');
    } finally {
      setAiLoading(false);
    }
  };

  const maxCategory = Math.max(...Object.values(metrics.byCategory), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Analytics & AI Insights</h2>
        <button
          onClick={runAIAnalysis}
          disabled={aiLoading || tasks.length === 0}
          className="px-4 py-2 rounded-xl bg-brand-600/20 text-brand-400 text-sm font-medium flex items-center gap-2 hover:bg-brand-600/30 transition-colors disabled:opacity-50"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          Run AI Analysis
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <MetricCard icon={Target} label="Completion Rate" value={`${metrics.completionRate}%`} color="text-green-400" />
        <MetricCard icon={Clock} label="Avg. Completion" value={`${metrics.avgHours.toFixed(1)}h`} color="text-cyan-400" />
        <MetricCard icon={AlertTriangle} label="Overdue Tasks" value={String(metrics.overdue)} color="text-red-400" />
        <MetricCard icon={TrendingUp} label="Active Tasks" value={String(metrics.inProgress)} color="text-blue-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-400" />
            Priority Distribution
          </h3>
          <div className="space-y-3">
            {Object.entries(metrics.byPriority).map(([priority, count]) => (
              <div key={priority}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className={`px-2 py-0.5 text-xs rounded border ${TASK_PRIORITY_COLORS[priority] || ''}`}>{priority}</span>
                  <span className="text-gray-400">{count}</span>
                </div>
                <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      priority === 'Critical' ? 'bg-red-500' :
                      priority === 'High' ? 'bg-orange-500' :
                      priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${metrics.total > 0 ? (count / metrics.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-brand-400" />
            Category Breakdown
          </h3>
          <div className="space-y-3">
            {Object.entries(metrics.byCategory).sort((a, b) => b[1] - a[1]).map(([cat, count]) => (
              <div key={cat}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className={`px-2 py-0.5 text-xs rounded border ${CATEGORY_COLORS[cat] || 'border-white/10 text-gray-400'}`}>{cat}</span>
                  <span className="text-gray-400">{count}</span>
                </div>
                <div className="w-full h-2 bg-dark-600 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-400 transition-all duration-700"
                    style={{ width: `${(count / maxCategory) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5">
        <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
          <Users className="w-4 h-4 text-brand-400" />
          Employee Workload
        </h3>
        {Object.keys(metrics.byEmployee).length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-6">No employee assignments yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(metrics.byEmployee)
              .sort((a, b) => b[1].assigned - a[1].assigned)
              .map(([empId, data]) => {
                const rate = data.assigned > 0 ? Math.round((data.completed / data.assigned) * 100) : 0;
                return (
                  <div key={empId} className="p-3 rounded-lg bg-dark-700/50 border border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(data.name)} flex items-center justify-center text-white text-[10px] font-bold`}>
                        {getInitials(data.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-white truncate">{data.name}</p>
                        <p className="text-xs text-gray-500">{data.assigned} tasks</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-lg font-bold text-green-400">{data.completed}</p>
                        <p className="text-[10px] text-gray-500">Done</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-red-400">{data.overdue}</p>
                        <p className="text-[10px] text-gray-500">Overdue</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-brand-400">{rate}%</p>
                        <p className="text-[10px] text-gray-500">Rate</p>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {aiAnalysis && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-400" />
            AI Analysis Results
          </h3>

          {aiAnalysis.summary && (
            <div className="glass-card rounded-xl p-5">
              <p className="text-sm text-gray-300 leading-relaxed">{aiAnalysis.summary}</p>
              {aiAnalysis.productivity_score !== undefined && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-gray-500">Productivity Score:</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 h-2 bg-dark-600 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          aiAnalysis.productivity_score >= 70 ? 'bg-green-500' :
                          aiAnalysis.productivity_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${aiAnalysis.productivity_score}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold">{aiAnalysis.productivity_score}/100</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {aiAnalysis.risk_tasks && aiAnalysis.risk_tasks.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-red-400">
                <AlertTriangle className="w-4 h-4" /> At-Risk Tasks
              </h4>
              <div className="space-y-2">
                {aiAnalysis.risk_tasks.map((r, i) => (
                  <div key={i} className="p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                    <p className="text-sm font-medium text-white">{r.task_title}</p>
                    <p className="text-xs text-red-400 mt-1">{r.risk_reason}</p>
                    <p className="text-xs text-gray-400 mt-1">{r.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiAnalysis.priority_recommendations && aiAnalysis.priority_recommendations.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-amber-400">
                <Award className="w-4 h-4" /> Priority Recommendations
              </h4>
              <div className="space-y-2">
                {aiAnalysis.priority_recommendations.map((r, i) => (
                  <div key={i} className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/10 flex items-center gap-3">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-white">{r.task_title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{r.reason}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs shrink-0">
                      <span className={`px-2 py-0.5 rounded border ${TASK_PRIORITY_COLORS[r.current_priority] || ''}`}>{r.current_priority}</span>
                      <ArrowUpRight className="w-3 h-3 text-amber-400" />
                      <span className={`px-2 py-0.5 rounded border ${TASK_PRIORITY_COLORS[r.suggested_priority] || ''}`}>{r.suggested_priority}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aiAnalysis.deadline_alerts && aiAnalysis.deadline_alerts.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-cyan-400">
                <Clock className="w-4 h-4" /> Deadline Alerts
              </h4>
              <div className="space-y-2">
                {aiAnalysis.deadline_alerts.map((d, i) => (
                  <div key={i} className="p-3 rounded-lg bg-cyan-500/5 border border-cyan-500/10 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-white">{d.task_title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{d.action}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded ${
                      d.risk_level === 'high' ? 'bg-red-500/20 text-red-400' :
                      d.risk_level === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {d.days_remaining}d left
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricCard({ icon: Icon, label, value, color }: { icon: React.ElementType; label: string; value: string; color: string }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <Icon className={`w-5 h-5 ${color} mb-2`} />
      <p className={`text-2xl font-bold ${color}`}>{value}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}
