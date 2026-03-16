import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Pencil, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { POLICY_CATEGORIES } from '../../../../lib/hr/constants';
import type { HRPolicy } from '../../../../lib/hr/types';
import { formatDate } from '../../../../lib/format';
import ConfirmDialog from '../../../../components/ConfirmDialog';

const inputClass = 'w-full px-3 py-2.5 bg-dark-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500 placeholder-gray-600';
const textareaClass = `${inputClass} resize-none`;

const blank = (): Partial<HRPolicy> => ({
  title: '', category: 'Code of Conduct', content: '', version: '1.0', status: 'Active', effective_date: '', review_date: '',
});

export default function PoliciesModule() {
  const { user } = useAuth();
  const [policies, setPolicies] = useState<HRPolicy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editId, setEditId] = useState<string | 'new' | null>(null);
  const [form, setForm] = useState<Partial<HRPolicy>>(blank());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState('All');

  const load = async () => {
    if (!user) return;
    const { data } = await supabase.from('hr_policies').select('*').eq('user_id', user.id).order('category').order('title');
    setPolicies(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user]);

  const handleSave = async () => {
    if (!user || !form.title?.trim()) { toast.error('Title required'); return; }
    const payload = { ...form, user_id: user.id, effective_date: form.effective_date || null, review_date: form.review_date || null };
    const { error } = editId === 'new'
      ? await supabase.from('hr_policies').insert(payload)
      : await supabase.from('hr_policies').update(payload).eq('id', editId!);
    if (error) { toast.error(error.message); return; }
    toast.success(editId === 'new' ? 'Policy added' : 'Policy updated');
    setEditId(null);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('hr_policies').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Policy deleted');
    load();
  };

  const startEdit = (p: HRPolicy) => {
    setForm({ ...p, effective_date: p.effective_date || '', review_date: p.review_date || '' });
    setEditId(p.id);
  };

  const set = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  const filtered = policies.filter((p) => filterCat === 'All' || p.category === filterCat);

  if (loading) {
    return <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">HR Policies</h2>
          <p className="text-sm text-gray-500">{policies.length} policies</p>
        </div>
        <button
          onClick={() => { setForm(blank()); setEditId('new'); }}
          className="px-4 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Policy
        </button>
      </div>

      {editId && (
        <div className="glass-card rounded-xl p-5 space-y-4 border border-brand-500/20">
          <h3 className="text-sm font-semibold text-gray-300">{editId === 'new' ? 'New Policy' : 'Edit Policy'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs text-gray-400 mb-1.5">Policy Title</label>
              <input type="text" value={form.title || ''} onChange={(e) => set('title', e.target.value)} className={inputClass} placeholder="e.g. Code of Conduct Policy" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Category</label>
              <select value={form.category || ''} onChange={(e) => set('category', e.target.value)} className={inputClass}>
                {POLICY_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Version</label>
              <input type="text" value={form.version || ''} onChange={(e) => set('version', e.target.value)} className={inputClass} placeholder="1.0" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Effective Date</label>
              <input type="date" value={form.effective_date || ''} onChange={(e) => set('effective_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Review Date</label>
              <input type="date" value={form.review_date || ''} onChange={(e) => set('review_date', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Status</label>
              <select value={form.status || 'Active'} onChange={(e) => set('status', e.target.value)} className={inputClass}>
                <option value="Active">Active</option>
                <option value="Draft">Draft</option>
                <option value="Archived">Archived</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Policy Content</label>
            <textarea value={form.content || ''} onChange={(e) => set('content', e.target.value)} rows={8} className={textareaClass} placeholder="Write the full policy content here..." />
          </div>
          <div className="flex gap-2">
            <button onClick={handleSave} className="px-4 py-2 rounded-xl gradient-orange text-white text-sm font-semibold">Save Policy</button>
            <button onClick={() => setEditId(null)} className="px-4 py-2 rounded-xl border border-white/10 text-white text-sm font-semibold hover:bg-white/5">Cancel</button>
          </div>
        </div>
      )}

      <div className="flex gap-2 flex-wrap">
        {['All', ...POLICY_CATEGORIES].map((c) => (
          <button
            key={c}
            onClick={() => setFilterCat(c)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filterCat === c
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="w-12 h-12 text-gray-600 mx-auto mb-3" />
          <p className="text-gray-400 font-medium">No policies found</p>
          <p className="text-sm text-gray-500 mt-1">Add HR policies to share with your team.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((policy) => (
            <div key={policy.id} className="glass-card rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center justify-between p-4 text-left hover:bg-white/2 transition-colors"
                onClick={() => setExpanded(expanded === policy.id ? null : policy.id)}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                  <div>
                    <p className="font-medium text-white text-sm">{policy.title}</p>
                    <p className="text-xs text-gray-500">{policy.category} · v{policy.version}{policy.effective_date ? ` · ${formatDate(policy.effective_date)}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[11px] rounded-md border ${policy.status === 'Active' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' : 'border-gray-500/30 text-gray-400 bg-gray-500/10'}`}>
                    {policy.status}
                  </span>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => startEdit(policy)} className="p-1 rounded hover:bg-white/5 text-gray-400 hover:text-white">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteId(policy.id)} className="p-1 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {expanded === policy.id ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                </div>
              </button>
              {expanded === policy.id && policy.content && (
                <div className="px-5 pb-5 border-t border-white/5">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap mt-4">{policy.content}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Policy"
        message="Delete this HR policy?"
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
}
