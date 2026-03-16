import { useEffect, useState } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { PROJECT_PIPELINE_STAGES, PROJECT_PRIORITIES, MILESTONE_STATUSES } from '../../../../lib/pipeline/constants';
import type { ProjectPipelineEntry, ProjectPipelineMilestone } from '../../../../lib/pipeline/types';

const ic = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';

interface MilestoneRow { title: string; due_date: string; status: string; }

interface Props {
  entry: Partial<ProjectPipelineEntry> | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function ProjectPipelineEntryFormModal({ entry, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<Partial<ProjectPipelineEntry>>({
    title: '', client_name: '', stage: 'Discovery', priority: 'Medium',
    start_date: '', target_end_date: '', budget: 0, notes: '', tags: '',
  });
  const [milestones, setMilestones] = useState<MilestoneRow[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (entry) setForm(entry);
  }, [entry]);

  const set = (field: string, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

  const addMilestone = () => setMilestones((p) => [...p, { title: '', due_date: '', status: 'Pending' }]);
  const setMilestone = (i: number, field: string, value: string) => setMilestones((p) => p.map((m, idx) => idx === i ? { ...m, [field]: value } : m));
  const removeMilestone = (i: number) => setMilestones((p) => p.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!user || !form.title?.trim()) { toast.error('Project title is required'); return; }
    setSaving(true);
    const payload = { ...form, user_id: user.id, updated_at: new Date().toISOString(), start_date: form.start_date || null, target_end_date: form.target_end_date || null };
    if (entry?.id) {
      const { error } = await supabase.from('project_pipeline_entries').update(payload).eq('id', entry.id);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
    } else {
      const { data, error } = await supabase.from('project_pipeline_entries').insert(payload).select().maybeSingle();
      setSaving(false);
      if (error || !data) { toast.error(error?.message || 'Failed'); return; }
      const validMilestones = milestones.filter((m) => m.title.trim());
      if (validMilestones.length > 0) {
        await supabase.from('project_pipeline_milestones').insert(
          validMilestones.map((m, i) => ({ entry_id: data.id, user_id: user.id, title: m.title, due_date: m.due_date || null, status: m.status, sort_order: i }))
        );
      }
    }
    toast.success(entry?.id ? 'Project updated' : 'Project added to pipeline');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-dark-800">
          <h2 className="text-base font-semibold">{entry?.id ? 'Edit Project' : 'Add Project to Pipeline'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Project Title <span className="text-red-400">*</span></label>
              <input value={form.title || ''} onChange={(e) => set('title', e.target.value)} className={ic} placeholder="e.g. E-commerce Website for Client X" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Client Name</label>
              <input value={form.client_name || ''} onChange={(e) => set('client_name', e.target.value)} className={ic} placeholder="Client / company" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Stage</label>
              <select value={form.stage || 'Discovery'} onChange={(e) => set('stage', e.target.value)} className={ic}>
                {PROJECT_PIPELINE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Priority</label>
              <select value={form.priority || 'Medium'} onChange={(e) => set('priority', e.target.value)} className={ic}>
                {PROJECT_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Budget (₹)</label>
              <input type="number" min={0} value={form.budget || 0} onChange={(e) => set('budget', Number(e.target.value))} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Start Date</label>
              <input type="date" value={form.start_date || ''} onChange={(e) => set('start_date', e.target.value)} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Target End Date</label>
              <input type="date" value={form.target_end_date || ''} onChange={(e) => set('target_end_date', e.target.value)} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Tags</label>
              <input value={form.tags || ''} onChange={(e) => set('tags', e.target.value)} className={ic} placeholder="e.g. web, design, urgent" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Notes</label>
              <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={2} className={`${ic} resize-none`} />
            </div>
          </div>

          {!entry?.id && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-gray-400">Milestones (optional)</label>
                <button onClick={addMilestone} className="text-xs text-brand-400 hover:text-brand-300 flex items-center gap-1"><Plus className="w-3 h-3" /> Add Milestone</button>
              </div>
              <div className="space-y-2">
                {milestones.map((m, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input value={m.title} onChange={(e) => setMilestone(i, 'title', e.target.value)} placeholder="Milestone title" className="flex-1 px-3 py-2 bg-dark-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 placeholder-gray-600" />
                    <input type="date" value={m.due_date} onChange={(e) => setMilestone(i, 'due_date', e.target.value)} className="px-3 py-2 bg-dark-900 border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-brand-500 w-36" />
                    <select value={m.status} onChange={(e) => setMilestone(i, 'status', e.target.value)} className="px-2 py-2 bg-dark-900 border border-white/10 rounded-xl text-xs text-white focus:outline-none">
                      {MILESTONE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <button onClick={() => removeMilestone(i)} className="p-1.5 rounded hover:bg-red-500/10 text-gray-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 gradient-orange text-white text-sm font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={onClose} className="px-5 py-2.5 border border-white/10 text-white text-sm rounded-xl hover:bg-white/5">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
