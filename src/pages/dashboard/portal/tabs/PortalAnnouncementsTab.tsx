import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Eye, EyeOff, Megaphone, X, Save, Pin, PinOff } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { ANNOUNCEMENT_PRIORITIES, PRIORITY_COLORS } from '../../../../lib/portal/constants';
import type { ClientPortal, PortalAnnouncement } from '../../../../lib/portal/types';
import toast from 'react-hot-toast';

interface Props { portal: ClientPortal; }

export default function PortalAnnouncementsTab({ portal }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<PortalAnnouncement[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<PortalAnnouncement> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('portal_announcements')
      .select('*')
      .eq('portal_id', portal.id)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    setItems((data || []) as PortalAnnouncement[]);
    setLoading(false);
  }, [portal.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editing || !user) return;
    if (!editing.title?.trim()) { toast.error('Title is required'); return; }
    setSaving(true);

    const payload = {
      title: editing.title,
      message: editing.message || '',
      priority: editing.priority || 'normal',
      is_pinned: editing.is_pinned || false,
      is_visible: editing.is_visible !== false,
    };

    if (editing.id) {
      await supabase.from('portal_announcements').update({ ...payload, updated_at: new Date().toISOString() }).eq('id', editing.id);
    } else {
      await supabase.from('portal_announcements').insert({ ...payload, user_id: user.id, portal_id: portal.id });
    }

    setSaving(false);
    setEditing(null);
    load();
    toast.success(editing.id ? 'Updated' : 'Announcement created');
  };

  const handleDelete = async (id: string) => {
    await supabase.from('portal_announcements').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Deleted');
  };

  const toggleVisibility = async (item: PortalAnnouncement) => {
    await supabase.from('portal_announcements').update({ is_visible: !item.is_visible }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_visible: !i.is_visible } : i));
  };

  const togglePin = async (item: PortalAnnouncement) => {
    await supabase.from('portal_announcements').update({ is_pinned: !item.is_pinned }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_pinned: !i.is_pinned } : i));
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{items.length} announcement{items.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setEditing({ title: '', message: '', priority: 'normal', is_visible: true, is_pinned: false })} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> New Announcement
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="text-center py-16 text-gray-500">
          <Megaphone className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="mb-2">No announcements yet</p>
          <p className="text-xs">Create announcements to share updates with your client</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => {
          const colors = PRIORITY_COLORS[item.priority] || PRIORITY_COLORS.normal;
          return (
            <div key={item.id} className={`bg-dark-800 border rounded-xl p-4 ${item.is_visible ? 'border-white/[0.06]' : 'border-red-500/20 opacity-60'}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center shrink-0">
                  <Megaphone className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-sm font-medium">{item.title}</h4>
                    <span className={`px-1.5 py-0.5 text-[10px] rounded border ${colors.bg} ${colors.text} ${colors.border}`}>
                      {item.priority}
                    </span>
                    {item.is_pinned && <span className="px-1.5 py-0.5 text-[10px] rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">Pinned</span>}
                  </div>
                  {item.message && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.message}</p>}
                  <p className="text-[11px] text-gray-600 mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => setEditing(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                    <Save className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => togglePin(item)} className={`p-1.5 rounded-lg hover:bg-white/5 ${item.is_pinned ? 'text-amber-400' : 'text-gray-400'}`}>
                    {item.is_pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
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
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h3 className="font-semibold">{editing.id ? 'Edit' : 'New'} Announcement</h3>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Title *</label>
                <input type="text" value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Message</label>
                <textarea value={editing.message || ''} onChange={e => setEditing({ ...editing, message: e.target.value })} rows={4} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">Priority</label>
                  <select value={editing.priority || 'normal'} onChange={e => setEditing({ ...editing, priority: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none capitalize">
                    {ANNOUNCEMENT_PRIORITIES.map(p => <option key={p} value={p} className="capitalize">{p}</option>)}
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 p-2.5 rounded-xl border border-white/[0.06] cursor-pointer hover:bg-white/5 transition-colors w-full">
                    <input type="checkbox" checked={editing.is_pinned || false} onChange={e => setEditing({ ...editing, is_pinned: e.target.checked })} className="sr-only" />
                    <Pin className={`w-4 h-4 ${editing.is_pinned ? 'text-amber-400' : 'text-gray-500'}`} />
                    <span className="text-sm">Pin to top</span>
                  </label>
                </div>
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
