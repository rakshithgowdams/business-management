import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, X, Save, ArrowRight } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { CASE_STUDY_INDUSTRIES } from '../../../../lib/portal/constants';
import type { ClientPortal, PortalCaseStudy, PortalMetric } from '../../../../lib/portal/types';
import toast from 'react-hot-toast';

interface Props { portal: ClientPortal; }

export default function PortalCaseStudiesTab({ portal }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<PortalCaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<PortalCaseStudy> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('portal_case_studies').select('*').eq('portal_id', portal.id).order('sort_order');
    setItems((data || []) as PortalCaseStudy[]);
    setLoading(false);
  }, [portal.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editing || !user) return;
    if (!editing.title?.trim()) { toast.error('Title is required'); return; }
    setSaving(true);

    const payload = {
      title: editing.title, client_name: editing.client_name || '', industry: editing.industry || '',
      challenge: editing.challenge || '', solution: editing.solution || '', results: editing.results || '',
      before_image_url: editing.before_image_url || '', after_image_url: editing.after_image_url || '',
      before_metrics: editing.before_metrics || [], after_metrics: editing.after_metrics || [],
      tags: editing.tags || '', testimonial_quote: editing.testimonial_quote || '',
      testimonial_author: editing.testimonial_author || '', is_featured: editing.is_featured || false,
      is_visible: editing.is_visible !== false,
    };

    if (editing.id) {
      await supabase.from('portal_case_studies').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id);
    } else {
      await supabase.from('portal_case_studies').insert({ ...payload, user_id: user.id, portal_id: portal.id, sort_order: items.length });
    }

    setSaving(false);
    setEditing(null);
    load();
    toast.success(editing.id ? 'Updated' : 'Created');
  };

  const handleDelete = async (id: string) => {
    await supabase.from('portal_case_studies').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Deleted');
  };

  const toggleVisibility = async (item: PortalCaseStudy) => {
    await supabase.from('portal_case_studies').update({ is_visible: !item.is_visible }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_visible: !i.is_visible } : i));
  };

  const addMetric = (field: 'before_metrics' | 'after_metrics') => {
    if (!editing) return;
    const current = (editing[field] || []) as PortalMetric[];
    setEditing({ ...editing, [field]: [...current, { label: '', value: '' }] });
  };

  const updateMetric = (field: 'before_metrics' | 'after_metrics', idx: number, key: keyof PortalMetric, val: string) => {
    if (!editing) return;
    const current = [...((editing[field] || []) as PortalMetric[])];
    current[idx] = { ...current[idx], [key]: val };
    setEditing({ ...editing, [field]: current });
  };

  const removeMetric = (field: 'before_metrics' | 'after_metrics', idx: number) => {
    if (!editing) return;
    const current = [...((editing[field] || []) as PortalMetric[])];
    current.splice(idx, 1);
    setEditing({ ...editing, [field]: current });
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{items.length} case stud{items.length !== 1 ? 'ies' : 'y'}</p>
        <button onClick={() => setEditing({ title: '', is_visible: true, is_featured: false, before_metrics: [], after_metrics: [] })} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Case Study
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-2">No case studies yet</p>
          <p className="text-xs">Showcase your best results with before/after comparisons</p>
        </div>
      )}

      <div className="grid gap-4">
        {items.map(item => (
          <div key={item.id} className={`bg-dark-800 border rounded-xl p-5 transition-all ${item.is_visible ? 'border-white/[0.06]' : 'border-red-500/20 opacity-60'}`}>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold truncate">{item.title}</h4>
                  {item.is_featured && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">FEATURED</span>}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                  {item.client_name && <span>{item.client_name}</span>}
                  {item.industry && <span className="px-1.5 py-0.5 bg-dark-700 rounded">{item.industry}</span>}
                </div>
                {item.challenge && <p className="text-sm text-gray-400 mt-2 line-clamp-2">{item.challenge}</p>}

                {(item.before_image_url || item.after_image_url) && (
                  <div className="flex items-center gap-3 mt-3">
                    {item.before_image_url && (
                      <div className="relative">
                        <img src={item.before_image_url} alt="Before" className="w-20 h-14 rounded-lg object-cover" />
                        <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-red-500/80 text-white px-1 rounded">Before</span>
                      </div>
                    )}
                    {item.before_image_url && item.after_image_url && <ArrowRight className="w-4 h-4 text-gray-600 shrink-0" />}
                    {item.after_image_url && (
                      <div className="relative">
                        <img src={item.after_image_url} alt="After" className="w-20 h-14 rounded-lg object-cover" />
                        <span className="absolute bottom-0.5 left-0.5 text-[9px] bg-green-500/80 text-white px-1 rounded">After</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => setEditing(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => toggleVisibility(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                  {item.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06] sticky top-0 bg-dark-800 z-10">
              <h3 className="font-semibold">{editing.id ? 'Edit' : 'Add'} Case Study</h3>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Title *</label>
                  <input type="text" value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Client Name</label>
                  <input type="text" value={editing.client_name || ''} onChange={e => setEditing({ ...editing, client_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Industry</label>
                  <select value={editing.industry || ''} onChange={e => setEditing({ ...editing, industry: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none">
                    <option value="">Select industry</option>
                    {CASE_STUDY_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Tags</label>
                  <input type="text" value={editing.tags || ''} onChange={e => setEditing({ ...editing, tags: e.target.value })} placeholder="design, marketing, growth" className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Challenge</label>
                <textarea value={editing.challenge || ''} onChange={e => setEditing({ ...editing, challenge: e.target.value })} rows={3} placeholder="What was the problem?" className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Solution</label>
                <textarea value={editing.solution || ''} onChange={e => setEditing({ ...editing, solution: e.target.value })} rows={3} placeholder="How did you solve it?" className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Results</label>
                <textarea value={editing.results || ''} onChange={e => setEditing({ ...editing, results: e.target.value })} rows={3} placeholder="What were the outcomes?" className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none resize-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Before Image URL</label>
                  <input type="url" value={editing.before_image_url || ''} onChange={e => setEditing({ ...editing, before_image_url: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">After Image URL</label>
                  <input type="url" value={editing.after_image_url || ''} onChange={e => setEditing({ ...editing, after_image_url: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">Before Metrics</label>
                    <button onClick={() => addMetric('before_metrics')} className="text-xs text-brand-400 hover:text-brand-300">+ Add</button>
                  </div>
                  {((editing.before_metrics || []) as PortalMetric[]).map((m, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" value={m.label} onChange={e => updateMetric('before_metrics', i, 'label', e.target.value)} placeholder="Label" className="flex-1 px-3 py-1.5 bg-dark-700 border border-white/10 rounded-lg text-xs focus:border-brand-500/50 focus:outline-none" />
                      <input type="text" value={m.value} onChange={e => updateMetric('before_metrics', i, 'value', e.target.value)} placeholder="Value" className="w-24 px-3 py-1.5 bg-dark-700 border border-white/10 rounded-lg text-xs focus:border-brand-500/50 focus:outline-none" />
                      <button onClick={() => removeMetric('before_metrics', i)} className="p-1 text-gray-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-300">After Metrics</label>
                    <button onClick={() => addMetric('after_metrics')} className="text-xs text-brand-400 hover:text-brand-300">+ Add</button>
                  </div>
                  {((editing.after_metrics || []) as PortalMetric[]).map((m, i) => (
                    <div key={i} className="flex gap-2 mb-2">
                      <input type="text" value={m.label} onChange={e => updateMetric('after_metrics', i, 'label', e.target.value)} placeholder="Label" className="flex-1 px-3 py-1.5 bg-dark-700 border border-white/10 rounded-lg text-xs focus:border-brand-500/50 focus:outline-none" />
                      <input type="text" value={m.value} onChange={e => updateMetric('after_metrics', i, 'value', e.target.value)} placeholder="Value" className="w-24 px-3 py-1.5 bg-dark-700 border border-white/10 rounded-lg text-xs focus:border-brand-500/50 focus:outline-none" />
                      <button onClick={() => removeMetric('after_metrics', i)} className="p-1 text-gray-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Client Testimonial Quote</label>
                <textarea value={editing.testimonial_quote || ''} onChange={e => setEditing({ ...editing, testimonial_quote: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Testimonial Author</label>
                <input type="text" value={editing.testimonial_author || ''} onChange={e => setEditing({ ...editing, testimonial_author: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.is_featured || false} onChange={e => setEditing({ ...editing, is_featured: e.target.checked })} className="sr-only" />
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${editing.is_featured ? 'bg-amber-500 border-amber-500' : 'border-gray-600'}`}>
                  {editing.is_featured && <Star className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm">Featured case study</span>
              </label>
            </div>
            <div className="p-5 border-t border-white/[0.06] flex justify-end gap-3">
              <button onClick={() => setEditing(null)} className="px-4 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-5 py-2 rounded-xl gradient-orange text-white text-sm font-medium disabled:opacity-50">
                <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
