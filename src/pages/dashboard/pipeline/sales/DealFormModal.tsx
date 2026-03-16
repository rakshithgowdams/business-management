import { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import {
  DEAL_STAGES, DEAL_SOURCES, DEAL_PRIORITIES,
  DEAL_STAGE_DEFAULT_PROBABILITY, DEAL_LOST_REASONS,
} from '../../../../lib/pipeline/constants';
import type { PipelineDeal } from '../../../../lib/pipeline/types';

const ic = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';
const ta = `${ic} resize-none`;

interface Props {
  deal: Partial<PipelineDeal> | null;
  onClose: () => void;
  onSaved: () => void;
}

export default function DealFormModal({ deal, onClose, onSaved }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<Partial<PipelineDeal>>({
    title: '',
    company_name: '',
    contact_name: '',
    contact_email: '',
    contact_phone: '',
    stage: 'Lead',
    deal_value: 0,
    probability: 10,
    expected_close_date: '',
    source: '',
    priority: 'Medium',
    tags: '',
    internal_notes: '',
    lost_reason: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (deal) setForm(deal);
  }, [deal]);

  const set = (field: string, value: string | number) => setForm((p) => ({ ...p, [field]: value }));

  const handleStageChange = (stage: string) => {
    setForm((p) => ({
      ...p,
      stage,
      probability: DEAL_STAGE_DEFAULT_PROBABILITY[stage] ?? p.probability,
    }));
  };

  const handleSave = async () => {
    if (!user || !form.title?.trim()) { toast.error('Deal title is required'); return; }
    setSaving(true);
    const payload = {
      ...form,
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };
    const { error } = deal?.id
      ? await supabase.from('pipeline_deals').update(payload).eq('id', deal.id)
      : await supabase.from('pipeline_deals').insert(payload);
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success(deal?.id ? 'Deal updated' : 'Deal created');
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 sticky top-0 bg-dark-800 z-10">
          <h2 className="text-base font-semibold">{deal?.id ? 'Edit Deal' : 'New Deal'}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Deal Title <span className="text-red-400">*</span></label>
              <input value={form.title || ''} onChange={(e) => set('title', e.target.value)} className={ic} placeholder="e.g. Website Redesign for Acme Corp" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Company Name</label>
              <input value={form.company_name || ''} onChange={(e) => set('company_name', e.target.value)} className={ic} placeholder="Company" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Contact Name</label>
              <input value={form.contact_name || ''} onChange={(e) => set('contact_name', e.target.value)} className={ic} placeholder="Primary contact" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Contact Email</label>
              <input type="email" value={form.contact_email || ''} onChange={(e) => set('contact_email', e.target.value)} className={ic} placeholder="email@example.com" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Contact Phone</label>
              <input value={form.contact_phone || ''} onChange={(e) => set('contact_phone', e.target.value)} className={ic} placeholder="+91 9999 999 999" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Stage</label>
              <select value={form.stage || 'Lead'} onChange={(e) => handleStageChange(e.target.value)} className={ic}>
                {DEAL_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Deal Value (₹)</label>
              <input type="number" min={0} value={form.deal_value || 0} onChange={(e) => set('deal_value', Number(e.target.value))} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Probability ({form.probability}%)</label>
              <input type="range" min={0} max={100} step={5} value={form.probability || 0} onChange={(e) => set('probability', Number(e.target.value))} className="w-full accent-brand-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Priority</label>
              <select value={form.priority || 'Medium'} onChange={(e) => set('priority', e.target.value)} className={ic}>
                {DEAL_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Expected Close Date</label>
              <input type="date" value={form.expected_close_date || ''} onChange={(e) => set('expected_close_date', e.target.value)} className={ic} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Lead Source</label>
              <select value={form.source || ''} onChange={(e) => set('source', e.target.value)} className={ic}>
                <option value="">— Select —</option>
                {DEAL_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            {(form.stage === 'Lost') && (
              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Lost Reason</label>
                <select value={form.lost_reason || ''} onChange={(e) => set('lost_reason', e.target.value)} className={ic}>
                  <option value="">— Select —</option>
                  {DEAL_LOST_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            )}
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Tags (comma separated)</label>
              <input value={form.tags || ''} onChange={(e) => set('tags', e.target.value)} className={ic} placeholder="e.g. enterprise, high-value" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Internal Notes</label>
              <textarea value={form.internal_notes || ''} onChange={(e) => set('internal_notes', e.target.value)} rows={3} className={ta} />
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <button onClick={handleSave} disabled={saving} className="px-5 py-2.5 gradient-orange text-white text-sm font-semibold rounded-xl flex items-center gap-2 disabled:opacity-50">
              <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save Deal'}
            </button>
            <button onClick={onClose} className="px-5 py-2.5 border border-white/10 text-white text-sm rounded-xl hover:bg-white/5">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}
