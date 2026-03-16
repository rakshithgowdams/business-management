import { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { ONBOARDING_PIPELINE_STAGES, ONBOARDING_STAGE_CHECKLISTS } from '../../../../lib/pipeline/constants';
import type { OnboardingPipelineEntry } from '../../../../lib/pipeline/types';

const ic = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';

interface Props {
  entry: Partial<OnboardingPipelineEntry> | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function OnboardingEntryFormModal({ entry, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<Partial<OnboardingPipelineEntry>>({
    client_name: '',
    client_email: '',
    current_stage: 'Welcome',
    target_go_live_date: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (entry) setForm(entry); }, [entry]);

  const set = (field: string, value: string) => setForm((p) => ({ ...p, [field]: value }));

  const seedChecklist = async (entryId: string, stage: string) => {
    const items = ONBOARDING_STAGE_CHECKLISTS[stage] || [];
    if (items.length === 0) return;
    await supabase.from('onboarding_pipeline_stage_checklist').insert(
      items.map((label, i) => ({ entry_id: entryId, user_id: user!.id, stage_name: stage, label, sort_order: i }))
    );
  };

  const handleSave = async () => {
    if (!user || !form.client_name?.trim()) { toast.error('Client name is required'); return; }
    setSaving(true);
    const payload = {
      ...form,
      user_id: user.id,
      stage_entered_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      target_go_live_date: form.target_go_live_date || null,
    };
    if (entry?.id) {
      const { error } = await supabase.from('onboarding_pipeline_entries').update(payload).eq('id', entry.id);
      setSaving(false);
      if (error) { toast.error(error.message); return; }
    } else {
      const { data, error } = await supabase.from('onboarding_pipeline_entries').insert(payload).select().maybeSingle();
      setSaving(false);
      if (error || !data) { toast.error(error?.message || 'Failed to create'); return; }
      await seedChecklist(data.id, data.current_stage);
    }
    toast.success(entry?.id ? 'Entry updated' : 'Client added to pipeline');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h2 className="text-base font-semibold">{entry?.id ? 'Edit Onboarding Entry' : 'Add Client to Pipeline'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Client Name <span className="text-red-400">*</span></label>
            <input value={form.client_name || ''} onChange={(e) => set('client_name', e.target.value)} className={ic} placeholder="Client or company name" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Client Email</label>
            <input type="email" value={form.client_email || ''} onChange={(e) => set('client_email', e.target.value)} className={ic} placeholder="email@example.com" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Current Stage</label>
            <select value={form.current_stage || 'Welcome'} onChange={(e) => set('current_stage', e.target.value)} className={ic}>
              {ONBOARDING_PIPELINE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Target Go-Live Date</label>
            <input type="date" value={form.target_go_live_date || ''} onChange={(e) => set('target_go_live_date', e.target.value)} className={ic} />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Notes</label>
            <textarea value={form.notes || ''} onChange={(e) => set('notes', e.target.value)} rows={2} className={`${ic} resize-none`} />
          </div>

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
