import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, X, Save, Quote } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import type { ClientPortal, PortalTestimonial } from '../../../../lib/portal/types';
import toast from 'react-hot-toast';

interface Props { portal: ClientPortal; }

export default function PortalTestimonialsTab({ portal }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<PortalTestimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<PortalTestimonial> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('portal_testimonials').select('*').eq('portal_id', portal.id).order('sort_order');
    setItems((data || []) as PortalTestimonial[]);
    setLoading(false);
  }, [portal.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editing || !user) return;
    if (!editing.author_name?.trim() || !editing.quote?.trim()) { toast.error('Author and quote are required'); return; }
    setSaving(true);

    const payload = {
      author_name: editing.author_name, author_title: editing.author_title || '',
      author_company: editing.author_company || '', author_avatar_url: editing.author_avatar_url || '',
      quote: editing.quote, rating: editing.rating || 5, project_name: editing.project_name || '',
      is_featured: editing.is_featured || false, is_visible: editing.is_visible !== false,
    };

    if (editing.id) {
      await supabase.from('portal_testimonials').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('portal_testimonials').insert({ ...payload, user_id: user.id, portal_id: portal.id, sort_order: items.length });
    }

    setSaving(false);
    setEditing(null);
    load();
    toast.success(editing.id ? 'Updated' : 'Created');
  };

  const handleDelete = async (id: string) => {
    await supabase.from('portal_testimonials').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Deleted');
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{items.length} testimonial{items.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setEditing({ author_name: '', quote: '', rating: 5, is_visible: true })} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Testimonial
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="text-center py-16 text-gray-500">
          <Quote className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="mb-2">No testimonials yet</p>
          <p className="text-xs">Add client feedback to build trust</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {items.map(item => (
          <div key={item.id} className={`bg-dark-800 border rounded-xl p-5 ${item.is_visible ? 'border-white/[0.06]' : 'border-red-500/20 opacity-60'}`}>
            <div className="flex items-center gap-1 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className={`w-4 h-4 ${i < item.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-600'}`} />
              ))}
              {item.is_featured && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">FEATURED</span>}
            </div>
            <p className="text-sm text-gray-300 italic mb-3 line-clamp-3">"{item.quote}"</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{item.author_name}</p>
                <p className="text-xs text-gray-500">{[item.author_title, item.author_company].filter(Boolean).join(' at ')}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setEditing(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h3 className="font-semibold">{editing.id ? 'Edit' : 'Add'} Testimonial</h3>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Quote *</label>
                <textarea value={editing.quote || ''} onChange={e => setEditing({ ...editing, quote: e.target.value })} rows={4} placeholder="What did the client say?" className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Author Name *</label>
                  <input type="text" value={editing.author_name || ''} onChange={e => setEditing({ ...editing, author_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Title</label>
                  <input type="text" value={editing.author_title || ''} onChange={e => setEditing({ ...editing, author_title: e.target.value })} placeholder="CEO, Designer..." className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Company</label>
                  <input type="text" value={editing.author_company || ''} onChange={e => setEditing({ ...editing, author_company: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Project Name</label>
                  <input type="text" value={editing.project_name || ''} onChange={e => setEditing({ ...editing, project_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(r => (
                    <button key={r} onClick={() => setEditing({ ...editing, rating: r })} className="p-1">
                      <Star className={`w-6 h-6 transition-colors ${r <= (editing.rating || 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-600 hover:text-gray-400'}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Avatar URL</label>
                <input type="url" value={editing.author_avatar_url || ''} onChange={e => setEditing({ ...editing, author_avatar_url: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={editing.is_featured || false} onChange={e => setEditing({ ...editing, is_featured: e.target.checked })} className="sr-only" />
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${editing.is_featured ? 'bg-amber-500 border-amber-500' : 'border-gray-600'}`}>
                  {editing.is_featured && <Star className="w-3 h-3 text-white" />}
                </div>
                <span className="text-sm">Featured testimonial</span>
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
