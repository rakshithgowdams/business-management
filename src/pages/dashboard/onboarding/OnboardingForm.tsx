import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import {
  ONBOARDING_TYPES, ONBOARDING_STATUSES, PRIORITIES,
  CHECKLIST_TEMPLATES,
} from '../../../lib/onboarding/constants';

const defaultForm = {
  full_name: '', email: '', phone: '', role: '',
  onboarding_type: 'Employee' as string, status: 'Not Started' as string,
  assigned_to: '', start_date: '', expected_end_date: '',
  priority: 'Medium' as string, internal_notes: '', welcome_message: '',
};

export default function OnboardingForm() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [form, setForm] = useState(defaultForm);
  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newItem, setNewItem] = useState('');
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [templateApplied, setTemplateApplied] = useState(false);

  useEffect(() => {
    if (isEdit && user) {
      (async () => {
        const { data } = await supabase.from('onboardings').select('*').eq('id', id).eq('user_id', user.id).maybeSingle();
        if (!data) { navigate('/dashboard/onboarding'); return; }
        setForm({
          full_name: data.full_name || '', email: data.email || '', phone: data.phone || '',
          role: data.role || '', onboarding_type: data.onboarding_type || 'Employee',
          status: data.status || 'Not Started', assigned_to: data.assigned_to || '',
          start_date: data.start_date || '', expected_end_date: data.expected_end_date || '',
          priority: data.priority || 'Medium', internal_notes: data.internal_notes || '',
          welcome_message: data.welcome_message || '',
        });
        const { data: cl } = await supabase.from('onboarding_checklist').select('label').eq('onboarding_id', id).order('sort_order');
        if (cl) setChecklistItems(cl.map((c: { label: string }) => c.label));
        setTemplateApplied(true);
        setLoading(false);
      })();
    }
  }, [id, user]);

  const set = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const applyTemplate = () => {
    const tmpl = CHECKLIST_TEMPLATES[form.onboarding_type];
    if (tmpl) {
      setChecklistItems(tmpl);
      setTemplateApplied(true);
    }
  };

  const addCustomItem = () => {
    if (!newItem.trim()) return;
    setChecklistItems((prev) => [...prev, newItem.trim()]);
    setNewItem('');
  };

  const removeItem = (idx: number) => {
    setChecklistItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim()) { toast.error('Full name is required'); return; }
    if (!form.role.trim()) { toast.error('Role is required'); return; }
    if (!form.start_date) { toast.error('Start date is required'); return; }

    setSaving(true);
    const payload = { ...form, updated_at: new Date().toISOString() };

    if (isEdit) {
      const { error } = await supabase.from('onboardings').update(payload).eq('id', id);
      if (error) { toast.error(error.message); setSaving(false); return; }

      await supabase.from('onboarding_checklist').delete().eq('onboarding_id', id);
      if (checklistItems.length > 0) {
        const rows = checklistItems.map((label, i) => ({
          onboarding_id: id, user_id: user!.id, label, sort_order: i, is_checked: false,
        }));
        await supabase.from('onboarding_checklist').insert(rows);
      }

      toast.success('Onboarding updated');
      navigate(`/dashboard/onboarding/${id}`);
    } else {
      const { data, error } = await supabase.from('onboardings').insert({ ...payload, user_id: user!.id }).select('id').maybeSingle();
      if (error || !data) { toast.error(error?.message || 'Failed'); setSaving(false); return; }

      if (checklistItems.length > 0) {
        const rows = checklistItems.map((label, i) => ({
          onboarding_id: data.id, user_id: user!.id, label, sort_order: i, is_checked: false,
        }));
        await supabase.from('onboarding_checklist').insert(rows);
      }

      await supabase.from('onboarding_activities').insert({
        onboarding_id: data.id, user_id: user!.id,
        activity_type: 'System', description: 'Onboarding created',
        activity_date: new Date().toISOString().split('T')[0],
      });

      toast.success('Onboarding created');
      navigate('/dashboard/onboarding');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const inputClass = 'w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500';
  const labelClass = 'block text-sm text-gray-400 mb-1';

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="text-2xl font-bold">{isEdit ? 'Edit Onboarding' : 'New Onboarding'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <section className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b border-white/5 pb-3">Person Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Full Name *</label><input type="text" value={form.full_name} onChange={(e) => set('full_name', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Role / Position *</label><input type="text" value={form.role} onChange={(e) => set('role', e.target.value)} className={inputClass} placeholder="e.g. Frontend Developer" /></div>
            <div><label className={labelClass}>Email</label><input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Phone</label><input type="tel" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} /></div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b border-white/5 pb-3">Onboarding Settings</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Type</label>
              <select value={form.onboarding_type} onChange={(e) => { set('onboarding_type', e.target.value); setTemplateApplied(false); }} className={inputClass}>
                {ONBOARDING_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Status</label>
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                {ONBOARDING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className={labelClass}>Priority</label>
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className={inputClass}>
                {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><label className={labelClass}>Assigned To</label><input type="text" value={form.assigned_to} onChange={(e) => set('assigned_to', e.target.value)} className={inputClass} placeholder="Manager name" /></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelClass}>Start Date *</label><input type="date" value={form.start_date} onChange={(e) => set('start_date', e.target.value)} className={inputClass} /></div>
            <div><label className={labelClass}>Expected End Date</label><input type="date" value={form.expected_end_date} onChange={(e) => set('expected_end_date', e.target.value)} className={inputClass} /></div>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-white/5 pb-3">
            <h2 className="text-lg font-semibold">Checklist ({checklistItems.length} items)</h2>
            {!templateApplied && CHECKLIST_TEMPLATES[form.onboarding_type] && (
              <button type="button" onClick={applyTemplate} className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                Load {form.onboarding_type} Template
              </button>
            )}
          </div>

          {checklistItems.length > 0 && (
            <div className="space-y-2">
              {checklistItems.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-dark-700/50 rounded-lg px-3 py-2">
                  <span className="text-xs text-gray-500 w-6">{idx + 1}.</span>
                  <span className="text-sm text-gray-300 flex-1">{item}</span>
                  <button type="button" onClick={() => removeItem(idx)} className="text-gray-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input type="text" value={newItem} onChange={(e) => setNewItem(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomItem(); } }} placeholder="Add custom checklist item..." className={inputClass + ' flex-1'} />
            <button type="button" onClick={addCustomItem} className="px-3 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </section>

        <section className="glass-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold border-b border-white/5 pb-3">Additional</h2>
          <div><label className={labelClass}>Welcome Message</label><textarea value={form.welcome_message} onChange={(e) => set('welcome_message', e.target.value)} rows={3} className={inputClass + ' resize-none'} placeholder="Welcome note for the new person..." /></div>
          <div><label className={labelClass}>Internal Notes</label><textarea value={form.internal_notes} onChange={(e) => set('internal_notes', e.target.value)} rows={2} className={inputClass + ' resize-none'} /></div>
        </section>

        <button type="submit" disabled={saving} className="w-full py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2">
          <Save className="w-4 h-4" /> {saving ? 'Saving...' : isEdit ? 'Update Onboarding' : 'Create Onboarding'}
        </button>
      </form>
    </div>
  );
}
