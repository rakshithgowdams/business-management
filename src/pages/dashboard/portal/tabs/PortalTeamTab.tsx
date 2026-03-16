import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Save, Users } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import type { ClientPortal, PortalTeamMember } from '../../../../lib/portal/types';
import toast from 'react-hot-toast';

interface Props { portal: ClientPortal; }

export default function PortalTeamTab({ portal }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<PortalTeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<PortalTeamMember> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('portal_team_showcase').select('*').eq('portal_id', portal.id).order('sort_order');
    setItems((data || []) as PortalTeamMember[]);
    setLoading(false);
  }, [portal.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editing || !user) return;
    if (!editing.name?.trim()) { toast.error('Name is required'); return; }
    setSaving(true);

    const payload = {
      name: editing.name, title: editing.title || '', avatar_url: editing.avatar_url || '',
      bio: editing.bio || '', is_visible: editing.is_visible !== false,
    };

    if (editing.id) {
      await supabase.from('portal_team_showcase').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('portal_team_showcase').insert({ ...payload, user_id: user.id, portal_id: portal.id, sort_order: items.length });
    }

    setSaving(false);
    setEditing(null);
    load();
    toast.success(editing.id ? 'Updated' : 'Created');
  };

  const handleDelete = async (id: string) => {
    await supabase.from('portal_team_showcase').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Deleted');
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{items.length} team member{items.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setEditing({ name: '', is_visible: true })} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Member
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="text-center py-16 text-gray-500">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="mb-2">No team members added</p>
          <p className="text-xs">Showcase your team to build client confidence</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-dark-800 border border-white/[0.06] rounded-xl p-5 text-center">
            {item.avatar_url ? (
              <img src={item.avatar_url} alt={item.name} className="w-16 h-16 rounded-full object-cover mx-auto mb-3" />
            ) : (
              <div className="w-16 h-16 rounded-full gradient-orange flex items-center justify-center text-white font-bold text-lg mx-auto mb-3">
                {item.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)}
              </div>
            )}
            <h4 className="font-semibold text-sm">{item.name}</h4>
            {item.title && <p className="text-xs text-gray-400 mt-0.5">{item.title}</p>}
            {item.bio && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.bio}</p>}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <button onClick={() => setEditing(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h3 className="font-semibold">{editing.id ? 'Edit' : 'Add'} Team Member</h3>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Name *</label>
                <input type="text" value={editing.name || ''} onChange={e => setEditing({ ...editing, name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Title / Role</label>
                <input type="text" value={editing.title || ''} onChange={e => setEditing({ ...editing, title: e.target.value })} placeholder="Lead Designer, CTO..." className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Avatar URL</label>
                <input type="url" value={editing.avatar_url || ''} onChange={e => setEditing({ ...editing, avatar_url: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Bio</label>
                <textarea value={editing.bio || ''} onChange={e => setEditing({ ...editing, bio: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none resize-none" />
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
