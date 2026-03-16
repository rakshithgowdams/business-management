import { useState, useEffect, useCallback } from 'react';
import {
  X, Clock, User, Tag, Calendar, BarChart3, MessageSquare,
  Pencil, Mail, Trash2, Send, ChevronDown, AlertTriangle,
  CheckCircle2, Loader2, Sparkles,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { callTaskAI } from '../../../lib/ai/api';
import {
  TASK_STATUSES, TASK_STATUS_COLORS, TASK_PRIORITY_COLORS, CATEGORY_COLORS,
} from '../../../lib/taskmanagement/constants';
import type { TaskAssignment, TaskComment } from '../../../lib/taskmanagement/types';
import type { Employee } from '../../../lib/employees/types';
import ConfirmDialog from '../../../components/ConfirmDialog';

interface Props {
  task: TaskAssignment;
  employees: Employee[];
  onClose: () => void;
  onRefresh: () => void;
  onEmail: (task?: TaskAssignment, emp?: Employee) => void;
  onEdit: (task: TaskAssignment) => void;
}

export default function TaskDetailPanel({ task, employees, onClose, onRefresh, onEmail, onEdit }: Props) {
  const { user } = useAuth();
  const [comments, setComments] = useState<TaskComment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [progress, setProgress] = useState(task.progress_percent);
  const [logHours, setLogHours] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const loadComments = useCallback(async () => {
    const { data } = await supabase
      .from('task_comments')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true });
    setComments((data || []) as TaskComment[]);
  }, [task.id]);

  useEffect(() => { loadComments(); }, [loadComments]);

  const handleStatusChange = async (status: string) => {
    const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
    if (status === 'In Progress' && !task.start_date) updates.start_date = new Date().toISOString();
    if (status === 'Completed') {
      updates.completed_at = new Date().toISOString();
      updates.progress_percent = 100;
      setProgress(100);
    }
    await supabase.from('task_assignments').update(updates).eq('id', task.id);

    if (user) {
      await supabase.from('task_comments').insert({
        task_id: task.id,
        user_id: user.id,
        content: `Status changed to "${status}"`,
        comment_type: 'status_change',
      });
    }

    toast.success(`Status updated to ${status}`);
    onRefresh();
  };

  const handleProgressUpdate = async () => {
    await supabase.from('task_assignments').update({
      progress_percent: progress,
      updated_at: new Date().toISOString(),
    }).eq('id', task.id);
    toast.success('Progress updated');
  };

  const handleLogHours = async () => {
    const hours = Number(logHours);
    if (!hours || hours <= 0) return;
    await supabase.from('task_assignments').update({
      logged_hours: task.logged_hours + hours,
      updated_at: new Date().toISOString(),
    }).eq('id', task.id);
    setLogHours('');
    toast.success(`${hours}h logged`);
    onRefresh();
  };

  const handleAddComment = async () => {
    if (!user || !newComment.trim()) return;
    await supabase.from('task_comments').insert({
      task_id: task.id,
      user_id: user.id,
      content: newComment.trim(),
      comment_type: 'comment',
    });
    setNewComment('');
    loadComments();
  };

  const handleDelete = async () => {
    await supabase.from('task_assignments').delete().eq('id', task.id);
    toast.success('Task deleted');
    onRefresh();
  };

  const handleAIAnalyze = async () => {
    setAiLoading(true);
    try {
      if (!user) return;

      const result = await callTaskAI({
        action: 'analyze-tasks',
        tasks: [{
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          category: task.category,
          assigned_to: task.employee?.full_name || 'Unassigned',
          due_date: task.due_date,
          progress: task.progress_percent,
          estimated_hours: task.estimated_hours,
          logged_hours: task.logged_hours,
        }],
      }, 'task_analysis');

      if (result.data?.summary) {
        await supabase.from('task_comments').insert({
          task_id: task.id,
          user_id: user.id,
          content: `AI Analysis: ${result.data.summary}`,
          comment_type: 'ai_suggestion',
        });
        loadComments();
        toast.success('AI analysis added');
      } else if (result.error) {
        toast.error(result.error);
      }
    } catch {
      toast.error('AI analysis failed');
    } finally {
      setAiLoading(false);
    }
  };

  const due = task.due_date ? new Date(task.due_date) : null;
  const isOverdue = due && due < new Date() && task.status !== 'Completed' && task.status !== 'Cancelled';
  const emp = task.employee;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-end">
        <div className="w-full max-w-xl bg-dark-800 border-l border-white/10 h-full flex flex-col animate-in slide-in-from-right duration-300">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <h2 className="text-lg font-bold truncate flex-1 mr-2">{task.title}</h2>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={handleAIAnalyze} disabled={aiLoading} className="p-2 rounded-lg hover:bg-white/5 text-brand-400 transition-colors" title="AI Analyze">
                {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              </button>
              <button onClick={() => onEmail(task, emp ? employees.find(e => e.id === task.employee_id) : undefined)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                <Mail className="w-4 h-4" />
              </button>
              <button onClick={() => onEdit(task)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                <Pencil className="w-4 h-4" />
              </button>
              <button onClick={() => setShowDelete(true)} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            <div className="flex flex-wrap gap-2">
              <span className={`px-2.5 py-1 text-xs rounded-lg border font-medium ${TASK_PRIORITY_COLORS[task.priority] || ''}`}>{task.priority}</span>
              <span className={`px-2.5 py-1 text-xs rounded-lg border ${CATEGORY_COLORS[task.category] || 'border-white/10 text-gray-400'}`}>{task.category}</span>
              <span className="px-2.5 py-1 text-xs rounded-lg border border-white/10 text-gray-400">{task.assigned_to_role}</span>
              {task.recurrence !== 'none' && (
                <span className="px-2.5 py-1 text-xs rounded-lg border border-cyan-500/20 text-cyan-400">{task.recurrence}</span>
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-1 block">Status</label>
              <div className="relative">
                <select
                  value={task.status}
                  onChange={e => handleStatusChange(e.target.value)}
                  className={`w-full appearance-none px-4 py-2.5 rounded-xl border text-sm font-medium focus:outline-none cursor-pointer bg-transparent ${TASK_STATUS_COLORS[task.status] || ''}`}
                >
                  {TASK_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
              </div>
            </div>

            {task.description && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Description</label>
                <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">{task.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              {emp && (
                <div className="p-3 rounded-xl bg-dark-700/50 border border-white/5">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><User className="w-3 h-3" /> Assigned To</div>
                  <p className="text-sm font-medium text-white">{emp.full_name}</p>
                  <p className="text-xs text-gray-400">{emp.job_role} -- {emp.department}</p>
                </div>
              )}
              <div className="p-3 rounded-xl bg-dark-700/50 border border-white/5">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><Calendar className="w-3 h-3" /> Due Date</div>
                <p className={`text-sm font-medium ${isOverdue ? 'text-red-400' : 'text-white'}`}>
                  {due ? due.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Not set'}
                </p>
                {isOverdue && (
                  <p className="text-xs text-red-400 flex items-center gap-1 mt-0.5">
                    <AlertTriangle className="w-3 h-3" /> Overdue
                  </p>
                )}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-500 flex items-center gap-1"><BarChart3 className="w-3 h-3" /> Progress</label>
                <span className="text-xs text-brand-400 font-bold">{progress}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={progress}
                onChange={e => setProgress(Number(e.target.value))}
                onMouseUp={handleProgressUpdate}
                onTouchEnd={handleProgressUpdate}
                className="w-full h-2 bg-dark-600 rounded-full appearance-none cursor-pointer accent-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-dark-700/50 border border-white/5">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><Clock className="w-3 h-3" /> Estimated</div>
                <p className="text-sm font-bold">{task.estimated_hours}h</p>
              </div>
              <div className="p-3 rounded-xl bg-dark-700/50 border border-white/5 flex items-end gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-1"><Clock className="w-3 h-3" /> Logged: {task.logged_hours}h</div>
                  <input
                    type="number"
                    value={logHours}
                    onChange={e => setLogHours(e.target.value)}
                    min="0"
                    step="0.5"
                    placeholder="0"
                    className="w-full px-2 py-1.5 bg-dark-600 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-brand-500"
                  />
                </div>
                <button
                  onClick={handleLogHours}
                  disabled={!logHours || Number(logHours) <= 0}
                  className="px-3 py-1.5 rounded-lg gradient-orange text-white text-xs font-medium disabled:opacity-50 shrink-0"
                >
                  Log
                </button>
              </div>
            </div>

            {task.tags && (
              <div>
                <label className="text-xs text-gray-500 mb-1 block flex items-center gap-1"><Tag className="w-3 h-3" /> Tags</label>
                <div className="flex flex-wrap gap-1.5">
                  {task.tags.split(',').map((tag, i) => (
                    <span key={i} className="px-2 py-1 text-xs bg-dark-600 text-gray-300 rounded-lg">{tag.trim()}</span>
                  ))}
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-gray-500" />
                <h3 className="text-sm font-semibold">Activity & Comments</h3>
                <span className="text-xs text-gray-600">{comments.length}</span>
              </div>

              <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
                {comments.map(c => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-lg text-sm ${
                      c.comment_type === 'status_change'
                        ? 'bg-blue-500/5 border border-blue-500/10 text-blue-400'
                        : c.comment_type === 'ai_suggestion'
                        ? 'bg-brand-600/5 border border-brand-600/10 text-brand-400'
                        : 'bg-dark-700/50 border border-white/5 text-gray-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {c.comment_type === 'status_change' && <CheckCircle2 className="w-3 h-3" />}
                      {c.comment_type === 'ai_suggestion' && <Sparkles className="w-3 h-3" />}
                      <span className="text-[10px] text-gray-500">
                        {new Date(c.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{c.content}</p>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 bg-dark-700 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 transition-colors"
                />
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-3 py-2 rounded-xl gradient-orange text-white disabled:opacity-50 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={showDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${task.title}"? This cannot be undone.`}
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
      />
    </>
  );
}
