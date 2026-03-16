import { useState, useEffect } from 'react';
import { Plus, X, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { formatDate } from '../../../../lib/format';
import { TASK_PRIORITIES, TASK_STATUSES, TASK_PRIORITY_COLORS } from '../../../../lib/employees/constants';
import type { EmployeeTask } from '../../../../lib/employees/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';

interface Props {
  employeeId: string;
  tasks: EmployeeTask[];
  onRefresh: () => void;
}

export default function EmpTasksTab({ employeeId, tasks, onRefresh }: Props) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [form, setForm] = useState({
    task_name: '', project_id: '', description: '', due_date: '', priority: 'Medium' as string, status: 'Pending' as string,
  });

  useEffect(() => {
    if (!user) return;
    supabase.from('projects').select('id, name').eq('user_id', user.id).order('name').then(({ data }) => {
      setProjects(data || []);
    });
  }, [user]);

  const resetForm = () => {
    setShowForm(false);
    setForm({ task_name: '', project_id: '', description: '', due_date: '', priority: 'Medium', status: 'Pending' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.task_name.trim()) { toast.error('Task name is required'); return; }

    const { error } = await supabase.from('employee_tasks').insert({
      employee_id: employeeId,
      user_id: user!.id,
      task_name: form.task_name.trim(),
      project_id: form.project_id || null,
      description: form.description.trim(),
      due_date: form.due_date || null,
      priority: form.priority,
      status: form.status,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Task added');
    resetForm();
    onRefresh();
  };

  const updateStatus = async (taskId: string, status: string) => {
    await supabase.from('employee_tasks').update({ status }).eq('id', taskId);
    onRefresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('employee_tasks').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Task deleted');
    onRefresh();
  };

  const getProjectName = (pid: string | null) => projects.find((p) => p.id === pid)?.name || '';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Tasks ({tasks.length})</h3>
        <button onClick={() => setShowForm(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg gradient-orange text-white flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add Task
        </button>
      </div>

      {tasks.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-gray-500 text-sm">No tasks assigned yet.</div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <div key={t.id} className="glass-card rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium text-white">{t.task_name}</span>
                    <span className={`px-2 py-0.5 text-[10px] rounded-md border ${TASK_PRIORITY_COLORS[t.priority] || ''}`}>{t.priority}</span>
                    {t.project_id && <span className="text-xs text-gray-500">{getProjectName(t.project_id)}</span>}
                  </div>
                  {t.description && <p className="text-sm text-gray-400 mt-1">{t.description}</p>}
                  {t.due_date && <p className="text-xs text-gray-500 mt-1">Due: {formatDate(t.due_date)}</p>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)} className="px-2 py-1 text-xs bg-dark-800 border border-white/10 rounded-lg text-white focus:outline-none">
                    {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  <button onClick={() => setDeleteId(t.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Task</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm text-gray-400 mb-1">Task Name *</label><input type="text" value={form.task_name} onChange={(e) => setForm({ ...form, task_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Project</label>
                <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
                  <option value="">None</option>
                  {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div><label className="block text-sm text-gray-400 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm text-gray-400 mb-1">Due Date</label><input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
                <div>
                  <label className="block text-sm text-gray-400 mb-1">Priority</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
                    {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <button type="submit" className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold">Add Task</button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Task" message="Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
