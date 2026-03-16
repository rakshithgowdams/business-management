import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Eye, EyeOff, HelpCircle, X, Save, GripVertical, ArrowUp, ArrowDown } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import type { ClientPortal, PortalFAQ } from '../../../../lib/portal/types';
import toast from 'react-hot-toast';

interface Props { portal: ClientPortal; }

export default function PortalFAQTab({ portal }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<PortalFAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<PortalFAQ> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('portal_faq')
      .select('*')
      .eq('portal_id', portal.id)
      .order('sort_order');
    setItems((data || []) as PortalFAQ[]);
    setLoading(false);
  }, [portal.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editing || !user) return;
    if (!editing.question?.trim()) { toast.error('Question is required'); return; }
    if (!editing.answer?.trim()) { toast.error('Answer is required'); return; }
    setSaving(true);

    const payload = {
      question: editing.question,
      answer: editing.answer,
      sort_order: editing.sort_order ?? items.length,
      is_visible: editing.is_visible !== false,
    };

    if (editing.id) {
      await supabase.from('portal_faq').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('portal_faq').insert({ ...payload, user_id: user.id, portal_id: portal.id });
    }

    setSaving(false);
    setEditing(null);
    load();
    toast.success(editing.id ? 'Updated' : 'FAQ added');
  };

  const handleDelete = async (id: string) => {
    await supabase.from('portal_faq').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Deleted');
  };

  const toggleVisibility = async (item: PortalFAQ) => {
    await supabase.from('portal_faq').update({ is_visible: !item.is_visible }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_visible: !i.is_visible } : i));
  };

  const moveItem = async (index: number, direction: 'up' | 'down') => {
    const newItems = [...items];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= items.length) return;

    [newItems[index], newItems[swapIndex]] = [newItems[swapIndex], newItems[index]];

    await Promise.all(
      newItems.map((item, i) =>
        supabase.from('portal_faq').update({ sort_order: i }).eq('id', item.id)
      )
    );

    setItems(newItems);
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{items.length} FAQ item{items.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setEditing({ question: '', answer: '', is_visible: true, sort_order: items.length })} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> Add FAQ
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="text-center py-16 text-gray-500">
          <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="mb-2">No FAQ items yet</p>
          <p className="text-xs">Add frequently asked questions to help your clients</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className={`bg-dark-800 border rounded-xl p-4 ${item.is_visible ? 'border-white/[0.06]' : 'border-red-500/20 opacity-60'}`}>
            <div className="flex items-start gap-3">
              <div className="flex flex-col items-center gap-0.5 shrink-0">
                <button onClick={() => moveItem(index, 'up')} disabled={index === 0} className="p-1 rounded hover:bg-white/5 text-gray-500 disabled:opacity-20">
                  <ArrowUp className="w-3 h-3" />
                </button>
                <span className="text-[10px] text-gray-600 font-mono">{index + 1}</span>
                <button onClick={() => moveItem(index, 'down')} disabled={index === items.length - 1} className="p-1 rounded hover:bg-white/5 text-gray-500 disabled:opacity-20">
                  <ArrowDown className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-medium">{item.question}</h4>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.answer}</p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={() => setEditing(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                  <Save className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => toggleVisibility(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400">
                  {item.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h3 className="font-semibold">{editing.id ? 'Edit' : 'Add'} FAQ</h3>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Question *</label>
                <input type="text" value={editing.question || ''} onChange={e => setEditing({ ...editing, question: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Answer *</label>
                <textarea value={editing.answer || ''} onChange={e => setEditing({ ...editing, answer: e.target.value })} rows={5} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none resize-none" />
              </div>
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
