import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Eye, EyeOff, Star, GripVertical, ExternalLink, X, Save } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { PORTFOLIO_CATEGORIES } from '../../../../lib/portal/constants';
import type { ClientPortal, PortalPortfolioItem } from '../../../../lib/portal/types';
import toast from 'react-hot-toast';

interface Props { portal: ClientPortal; }

const emptyItem = (): Partial<PortalPortfolioItem> => ({
  title: '', description: '', category: '', thumbnail_url: '',
  gallery_urls: [], project_url: '', technologies: '', is_featured: false, is_visible: true, sort_order: 0,
});

export default function PortalPortfolioTab({ portal }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<PortalPortfolioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<PortalPortfolioItem> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('portal_portfolio_items')
      .select('*')
      .eq('portal_id', portal.id)
      .order('sort_order');
    setItems((data || []) as PortalPortfolioItem[]);
    setLoading(false);
  }, [portal.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editing || !user) return;
    if (!editing.title?.trim()) { toast.error('Title is required'); return; }
    setSaving(true);

    if (editing.id) {
      const { error } = await supabase.from('portal_portfolio_items').update({
        title: editing.title, description: editing.description, category: editing.category,
        thumbnail_url: editing.thumbnail_url, gallery_urls: editing.gallery_urls,
        project_url: editing.project_url, technologies: editing.technologies,
        is_featured: editing.is_featured, is_visible: editing.is_visible,
        completion_date: editing.completion_date || null,
        updated_at: new Date().toISOString(),
      }).eq('id', editing.id);
      if (error) toast.error('Failed to save');
      else toast.success('Updated');
    } else {
      const { error } = await supabase.from('portal_portfolio_items').insert({
        user_id: user.id, portal_id: portal.id,
        title: editing.title, description: editing.description, category: editing.category,
        thumbnail_url: editing.thumbnail_url, gallery_urls: editing.gallery_urls || [],
        project_url: editing.project_url, technologies: editing.technologies,
        is_featured: editing.is_featured, is_visible: editing.is_visible,
        sort_order: items.length, completion_date: editing.completion_date || null,
      });
      if (error) toast.error('Failed to create');
      else toast.success('Created');
    }

    setSaving(false);
    setEditing(null);
    load();
  };

  const handleDelete = async (id: string) => {
    await supabase.from('portal_portfolio_items').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Deleted');
  };

  const toggleVisibility = async (item: PortalPortfolioItem) => {
    await supabase.from('portal_portfolio_items').update({ is_visible: !item.is_visible }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_visible: !i.is_visible } : i));
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{items.length} portfolio item{items.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setEditing(emptyItem())}
          className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium"
        >
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="text-center py-16 text-gray-500">
          <p className="mb-2">No portfolio items yet</p>
          <p className="text-xs">Add your best work to showcase to clients</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className={`bg-dark-800 border rounded-xl overflow-hidden group transition-all ${item.is_visible ? 'border-white/[0.06]' : 'border-red-500/20 opacity-60'}`}>
            {item.thumbnail_url ? (
              <div className="aspect-video bg-dark-700 relative overflow-hidden">
                <img src={item.thumbnail_url} alt={item.title} className="w-full h-full object-cover" />
                {item.is_featured && (
                  <div className="absolute top-2 left-2 px-2 py-0.5 bg-amber-500/90 text-white text-[10px] font-bold rounded-md flex items-center gap-1">
                    <Star className="w-3 h-3" /> FEATURED
                  </div>
                )}
              </div>
            ) : (
              <div className="aspect-video bg-dark-700 flex items-center justify-center text-gray-600">
                No Image
              </div>
            )}
            <div className="p-4">
              <h4 className="font-medium text-sm truncate">{item.title}</h4>
              {item.category && <span className="text-xs text-gray-500">{item.category}</span>}
              <div className="flex items-center gap-1.5 mt-3">
                <button onClick={() => setEditing(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => toggleVisibility(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                  {item.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                {item.project_url && (
                  <a href={item.project_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><ExternalLink className="w-3.5 h-3.5" /></a>
                )}
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400 ml-auto"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06] sticky top-0 bg-dark-800 z-10">
              <h3 className="font-semibold">{editing.id ? 'Edit' : 'Add'} Portfolio Item</h3>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Title *</label>
                <input type="text" value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Description</label>
                <textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Category</label>
                  <select value={editing.category || ''} onChange={e => setEditing({ ...editing, category: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none">
                    <option value="">Select category</option>
                    {PORTFOLIO_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Completion Date</label>
                  <input type="date" value={editing.completion_date || ''} onChange={e => setEditing({ ...editing, completion_date: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Thumbnail URL</label>
                <input type="url" value={editing.thumbnail_url || ''} onChange={e => setEditing({ ...editing, thumbnail_url: e.target.value })} placeholder="https://images.pexels.com/..." className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Live Project URL</label>
                <input type="url" value={editing.project_url || ''} onChange={e => setEditing({ ...editing, project_url: e.target.value })} placeholder="https://..." className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Technologies / Tools Used</label>
                <input type="text" value={editing.technologies || ''} onChange={e => setEditing({ ...editing, technologies: e.target.value })} placeholder="React, Figma, Node.js..." className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={editing.is_featured || false} onChange={e => setEditing({ ...editing, is_featured: e.target.checked })} className="sr-only" />
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center ${editing.is_featured ? 'bg-amber-500 border-amber-500' : 'border-gray-600'}`}>
                    {editing.is_featured && <Star className="w-3 h-3 text-white" />}
                  </div>
                  <span className="text-sm">Featured item</span>
                </label>
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
