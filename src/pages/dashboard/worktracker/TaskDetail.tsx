import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Pencil, Plus, X, Trash2, Clock, CheckCircle2, MessageSquare } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatDate } from '../../../lib/format';
import { TASK_STATUS_COLORS, TASK_PRIORITY_COLORS, TASK_STATUSES } from '../../../lib/worktracker/constants';
import type { WorkTask, WorkSubtask, WorkTimeLog, WorkTaskComment } from '../../../lib/worktracker/types';
import TaskFormModal from './TaskFormModal';
import ConfirmDialog from '../../../components/ConfirmDialog';

export default function TaskDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [task, setTask] = useState<WorkTask | null>(null);
  const [subtasks, setSubtasks] = useState<WorkSubtask[]>([]);
  const [timeLogs, setTimeLogs] = useState<WorkTimeLog[]>([]);
  const [comments, setComments] = useState<WorkTaskComment[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const [newSubtask, setNewSubtask] = useState('');
  const [showTimeLog, setShowTimeLog] = useState(false);
  const [timeForm, setTimeForm] = useState({ date: new Date().toISOString().split('T')[0], hours: '', description: '' });
  const [newComment, setNewComment] = useState('');

  const loadAll = useCallback(async () => {
    if (!user || !id) return;
    const [tRes, sRes, tlRes, cRes, pRes] = await Promise.all([
      supabase.from('work_tasks').select('*').eq('id', id).eq('user_id', user.id).maybeSingle(),
      supabase.from('work_subtasks').select('*').eq('task_id', id).order('sort_order'),
      supabase.from('work_time_logs').select('*').eq('task_id', id).order('date', { ascending: false }),
      supabase.from('work_task_comments').select('*').eq('task_id', id).order('created_at', { ascending: false }),
      supabase.from('projects').select('id, name').eq('user_id', user.id).order('name'),
    ]);
    if (!tRes.data) { navigate('/dashboard/work-tracker'); return; }
    setTask(tRes.data as WorkTask);
    setSubtasks((sRes.data || []) as WorkSubtask[]);
    setTimeLogs((tlRes.data || []) as WorkTimeLog[]);
    setComments((cRes.data || []) as WorkTaskComment[]);
    setProjects(pRes.data || []);
    setLoading(false);
  }, [user, id, navigate]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const addSubtask = async () => {
    if (!newSubtask.trim()) return;
    const maxOrder = subtasks.length > 0 ? Math.max(...subtasks.map((s) => s.sort_order)) + 1 : 0;
    await supabase.from('work_subtasks').insert({ task_id: id, user_id: user!.id, label: newSubtask.trim(), sort_order: maxOrder, is_checked: false });
    setNewSubtask('');
    loadAll();
  };

  const toggleSubtask = async (s: WorkSubtask) => {
    await supabase.from('work_subtasks').update({ is_checked: !s.is_checked }).eq('id', s.id);
    loadAll();
  };

  const deleteSubtask = async (sid: string) => {
    await supabase.from('work_subtasks').delete().eq('id', sid);
    loadAll();
  };

  const addTimeLog = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timeForm.hours || Number(timeForm.hours) <= 0) { toast.error('Hours are required'); return; }
    const hours = Number(timeForm.hours);
    await supabase.from('work_time_logs').insert({ task_id: id, user_id: user!.id, date: timeForm.date, hours, description: timeForm.description.trim() });
    const newLogged = (task?.logged_hours || 0) + hours;
    await supabase.from('work_tasks').update({ logged_hours: newLogged }).eq('id', id);
    setShowTimeLog(false);
    setTimeForm({ date: new Date().toISOString().split('T')[0], hours: '', description: '' });
    toast.success('Time logged');
    loadAll();
  };

  const deleteTimeLog = async (logId: string) => {
    const log = timeLogs.find((l) => l.id === logId);
    if (log) {
      const newLogged = Math.max(0, (task?.logged_hours || 0) - log.hours);
      await supabase.from('work_tasks').update({ logged_hours: newLogged }).eq('id', id);
    }
    await supabase.from('work_time_logs').delete().eq('id', logId);
    loadAll();
  };

  const addComment = async () => {
    if (!newComment.trim()) return;
    await supabase.from('work_task_comments').insert({ task_id: id, user_id: user!.id, comment_type: 'comment', content: newComment.trim() });
    setNewComment('');
    loadAll();
  };

  const updateStatus = async (status: string) => {
    await supabase.from('work_tasks').update({ status }).eq('id', id);
    loadAll();
  };

  const handleDelete = async () => {
    await supabase.from('work_task_comments').delete().eq('task_id', id);
    await supabase.from('work_time_logs').delete().eq('task_id', id);
    await supabase.from('work_subtasks').delete().eq('task_id', id);
    await supabase.from('work_tasks').delete().eq('id', id);
    toast.success('Task deleted');
    navigate('/dashboard/work-tracker');
  };

  if (loading || !task) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const projectName = projects.find((p) => p.id === task.project_id)?.name || '';
  const labels = task.labels ? task.labels.split(',').map((l) => l.trim()).filter(Boolean) : [];
  const subtaskDone = subtasks.filter((s) => s.is_checked).length;
  const subtaskPct = subtasks.length > 0 ? Math.round((subtaskDone / subtasks.length) * 100) : 0;
  const totalLoggedHrs = timeLogs.reduce((s, l) => s + l.hours, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <button onClick={() => navigate('/dashboard/work-tracker')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white mt-1"><ArrowLeft className="w-5 h-5" /></button>
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            {projectName && <p className="text-gray-400 text-sm mt-0.5">{projectName}</p>}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className={`px-2 py-0.5 text-xs rounded-md border ${TASK_STATUS_COLORS[task.status] || ''}`}>{task.status}</span>
              <span className={`px-2 py-0.5 text-xs rounded-md border ${TASK_PRIORITY_COLORS[task.priority] || ''}`}>{task.priority}</span>
              {labels.map((l) => <span key={l} className="px-2 py-0.5 text-xs rounded-md bg-dark-600 text-gray-400">{l}</span>)}
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <select value={task.status} onChange={(e) => updateStatus(e.target.value)} className="px-3 py-2 text-sm bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none">
            {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button onClick={() => setEditing(true)} className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/5 text-sm flex items-center gap-2"><Pencil className="w-4 h-4" /> Edit</button>
          <button onClick={() => setDeleteConfirm(true)} className="p-2 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-5 h-5" /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Due Date</p>
          <p className="text-sm font-semibold">{task.due_date ? formatDate(task.due_date) : '--'}</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Estimated</p>
          <p className="text-sm font-semibold">{task.estimated_hours}h</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Logged</p>
          <p className="text-sm font-semibold text-blue-400">{totalLoggedHrs}h</p>
        </div>
        <div className="glass-card rounded-xl p-4">
          <p className="text-xs text-gray-500 mb-1">Subtasks</p>
          <p className="text-sm font-semibold">{subtaskDone}/{subtasks.length}</p>
        </div>
      </div>

      {task.description && (
        <div className="glass-card rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-2">Description</h3>
          <p className="text-sm text-gray-300 whitespace-pre-wrap">{task.description}</p>
        </div>
      )}

      <div className="glass-card rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Subtasks ({subtaskDone}/{subtasks.length})</h3>
          {subtasks.length > 0 && <span className="text-xs text-gray-500">{subtaskPct}%</span>}
        </div>
        {subtasks.length > 0 && (
          <div className="h-1.5 bg-dark-600 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-brand-600 to-brand-500 rounded-full transition-all" style={{ width: `${subtaskPct}%` }} />
          </div>
        )}
        <div className="space-y-2">
          {subtasks.map((s) => (
            <div key={s.id} className="flex items-center gap-3 group">
              <button onClick={() => toggleSubtask(s)} className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${s.is_checked ? 'bg-green-500 border-green-500' : 'border-gray-600 hover:border-brand-500'}`}>
                {s.is_checked && <CheckCircle2 className="w-3 h-3 text-white" />}
              </button>
              <span className={`text-sm flex-1 ${s.is_checked ? 'line-through text-gray-500' : 'text-white'}`}>{s.label}</span>
              <button onClick={() => deleteSubtask(s.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><X className="w-3.5 h-3.5" /></button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input type="text" value={newSubtask} onChange={(e) => setNewSubtask(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addSubtask(); }} placeholder="Add subtask..." className="flex-1 px-4 py-2 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
          <button onClick={addSubtask} className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white"><Plus className="w-4 h-4" /></button>
        </div>
      </div>

      <div className="glass-card rounded-xl p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Time Logs ({totalLoggedHrs}h total)</h3>
          <button onClick={() => setShowTimeLog(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg gradient-orange text-white flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Log Time
          </button>
        </div>
        {timeLogs.length === 0 ? (
          <p className="text-sm text-gray-500">No time logged yet.</p>
        ) : (
          <div className="space-y-2">
            {timeLogs.map((log) => (
              <div key={log.id} className="flex items-center gap-3 bg-dark-700/50 rounded-lg px-3 py-2 group">
                <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="text-sm font-medium text-blue-400 w-12">{log.hours}h</span>
                <span className="text-sm text-gray-400 flex-1 truncate">{log.description || 'No description'}</span>
                <span className="text-xs text-gray-600">{formatDate(log.date)}</span>
                <button onClick={() => deleteTimeLog(log.id)} className="p-1 rounded-lg hover:bg-red-500/10 text-gray-600 hover:text-red-400 opacity-0 group-hover:opacity-100"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass-card rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Comments ({comments.length})</h3>
        <div className="flex gap-2">
          <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') addComment(); }} placeholder="Add a comment..." className="flex-1 px-4 py-2 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" />
          <button onClick={addComment} className="px-4 py-2 rounded-xl gradient-orange text-white font-semibold text-sm"><MessageSquare className="w-4 h-4" /></button>
        </div>
        {comments.length > 0 && (
          <div className="space-y-2 pt-2">
            {comments.map((c) => (
              <div key={c.id} className="bg-dark-700/50 rounded-lg px-4 py-3">
                <p className="text-sm text-gray-300">{c.content}</p>
                <p className="text-xs text-gray-600 mt-1">{formatDate(c.created_at)}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {showTimeLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Log Time</h2>
              <button onClick={() => setShowTimeLog(false)} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={addTimeLog} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-400 mb-1">Date</label><input type="date" value={timeForm.date} onChange={(e) => setTimeForm({ ...timeForm, date: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
                <div><label className="block text-sm text-gray-400 mb-1">Hours *</label><input type="number" step="0.25" value={timeForm.hours} onChange={(e) => setTimeForm({ ...timeForm, hours: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
              </div>
              <div><label className="block text-sm text-gray-400 mb-1">Description</label><input type="text" value={timeForm.description} onChange={(e) => setTimeForm({ ...timeForm, description: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
              <button type="submit" className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold">Log Time</button>
            </form>
          </div>
        </div>
      )}

      {editing && (
        <TaskFormModal
          projects={projects}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); loadAll(); }}
          initial={{
            id: task.id, title: task.title, description: task.description,
            priority: task.priority, status: task.status, project_id: task.project_id || '',
            start_date: task.start_date || '', due_date: task.due_date,
            estimated_hours: task.estimated_hours, labels: task.labels,
          }}
        />
      )}

      <ConfirmDialog open={deleteConfirm} title="Delete Task" message="This will permanently delete this task and all related data. Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteConfirm(false)} />
    </div>
  );
}
