import { useState } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { TASK_STATUSES, TASK_PRIORITIES } from '../../../lib/worktracker/constants';

interface Props {
  projects: { id: string; name: string }[];
  onClose: () => void;
  onSaved: () => void;
  initial?: {
    id?: string; title?: string; description?: string; priority?: string;
    status?: string; project_id?: string; start_date?: string; due_date?: string;
    estimated_hours?: number; labels?: string;
  };
}

export default function TaskFormModal({ projects, onClose, onSaved, initial }: Props) {
  const { user } = useAuth();
  const isEdit = !!initial?.id;
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: initial?.title || '',
    description: initial?.description || '',
    priority: initial?.priority || 'Medium',
    status: initial?.status || 'To Do',
    project_id: initial?.project_id || '',
    start_date: initial?.start_date || '',
    due_date: initial?.due_date || '',
    estimated_hours: String(initial?.estimated_hours || ''),
    labels: initial?.labels || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      status: form.status,
      project_id: form.project_id || null,
      start_date: form.start_date || null,
      due_date: form.due_date || null,
      estimated_hours: Number(form.estimated_hours) || 0,
      labels: form.labels.trim(),
      updated_at: new Date().toISOString(),
    };

    if (isEdit) {
      const { error } = await supabase.from('work_tasks').update(payload).eq('id', initial!.id);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Task updated');
    } else {
      const { error } = await supabase.from('work_tasks').insert({ ...payload, user_id: user!.id, sort_order: 0 });
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success('Task created');
    }
    onSaved();
  };

  const inputClass = 'w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className="glass-card rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{isEdit ? 'Edit Task' : 'New Task'}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div><label className="block text-sm text-gray-400 mb-1">Title *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className={inputClass} /></div>
          <div><label className="block text-sm text-gray-400 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className={inputClass + ' resize-none'} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Priority</label>
              <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} className={inputClass}>
                {TASK_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className={inputClass}>
                {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Project</label>
            <select value={form.project_id} onChange={(e) => setForm({ ...form, project_id: e.target.value })} className={inputClass}>
              <option value="">No Project</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-400 mb-1">Start Date</label><input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Due Date</label><input type="date" value={form.due_date} onChange={(e) => setForm({ ...form, due_date: e.target.value })} className={inputClass} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-sm text-gray-400 mb-1">Estimated Hours</label><input type="number" step="0.5" value={form.estimated_hours} onChange={(e) => setForm({ ...form, estimated_hours: e.target.value })} className={inputClass} /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Labels (comma sep.)</label><input type="text" value={form.labels} onChange={(e) => setForm({ ...form, labels: e.target.value })} className={inputClass} placeholder="ui, bug, feature" /></div>
          </div>
          <button type="submit" disabled={saving} className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Saving...' : isEdit ? 'Update Task' : 'Create Task'}
          </button>
        </form>
      </div>
    </div>
  );
}
