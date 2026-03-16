import { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Save, Briefcase } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { SERVICE_ICONS } from '../../../../lib/portal/constants';
import type { ClientPortal, PortalService } from '../../../../lib/portal/types';
import toast from 'react-hot-toast';

interface Props { portal: ClientPortal; }

export default function PortalServicesTab({ portal }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<PortalService[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<PortalService> | null>(null);
  const [saving, setSaving] = useState(false);
  const [featureInput, setFeatureInput] = useState('');

  const load = useCallback(async () => {
    const { data } = await supabase.from('portal_services').select('*').eq('portal_id', portal.id).order('sort_order');
    setItems((data || []) as PortalService[]);
    setLoading(false);
  }, [portal.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editing || !user) return;
    if (!editing.service_name?.trim()) { toast.error('Service name is required'); return; }
    setSaving(true);

    const payload = {
      service_name: editing.service_name, description: editing.description || '',
      icon: editing.icon || 'briefcase', features: editing.features || [],
      price_range: editing.price_range || '', is_visible: editing.is_visible !== false,
    };

    if (editing.id) {
      await supabase.from('portal_services').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('portal_services').insert({ ...payload, user_id: user.id, portal_id: portal.id, sort_order: items.length });
    }

    setSaving(false);
    setEditing(null);
    setFeatureInput('');
    load();
    toast.success(editing.id ? 'Updated' : 'Created');
  };

  const handleDelete = async (id: string) => {
    await supabase.from('portal_services').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Deleted');
  };

  const addFeature = () => {
    if (!featureInput.trim() || !editing) return;
    setEditing({ ...editing, features: [...(editing.features || []), featureInput.trim()] });
    setFeatureInput('');
  };

  const removeFeature = (idx: number) => {
    if (!editing) return;
    const next = [...(editing.features || [])];
    next.splice(idx, 1);
    setEditing({ ...editing, features: next });
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{items.length} service{items.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setEditing({ service_name: '', features: [], is_visible: true, icon: 'briefcase' })} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Service
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="text-center py-16 text-gray-500">
          <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="mb-2">No services listed yet</p>
          <p className="text-xs">Showcase what you offer to impress clients</p>
        </div>
      )}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-dark-800 border border-white/[0.06] rounded-xl p-5">
            <div className="flex items-start justify-between mb-3">
              <h4 className="font-semibold text-sm">{item.service_name}</h4>
              <div className="flex items-center gap-1">
                <button onClick={() => { setEditing(item); setFeatureInput(''); }} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400"><Pencil className="w-3.5 h-3.5" /></button>
                <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            {item.description && <p className="text-xs text-gray-400 mb-3 line-clamp-2">{item.description}</p>}
            {item.features.length > 0 && (
              <ul className="space-y-1">
                {item.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="text-xs text-gray-400 flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-brand-500 shrink-0" />
                    {f}
                  </li>
                ))}
                {item.features.length > 4 && <li className="text-xs text-gray-500">+{item.features.length - 4} more</li>}
              </ul>
            )}
            {item.price_range && <p className="text-xs text-brand-400 font-medium mt-3">{item.price_range}</p>}
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h3 className="font-semibold">{editing.id ? 'Edit' : 'Add'} Service</h3>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Service Name *</label>
                <input type="text" value={editing.service_name || ''} onChange={e => setEditing({ ...editing, service_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Description</label>
                <textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={3} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none resize-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Icon</label>
                <select value={editing.icon || 'briefcase'} onChange={e => setEditing({ ...editing, icon: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none">
                  {SERVICE_ICONS.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Price Range</label>
                <input type="text" value={editing.price_range || ''} onChange={e => setEditing({ ...editing, price_range: e.target.value })} placeholder="Starting from Rs.10,000" className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Features</label>
                <div className="flex gap-2 mb-2">
                  <input type="text" value={featureInput} onChange={e => setFeatureInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())} placeholder="Add a feature..." className="flex-1 px-4 py-2 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
                  <button onClick={addFeature} className="px-3 py-2 rounded-xl bg-brand-600/10 text-brand-400 text-sm hover:bg-brand-600/20">Add</button>
                </div>
                <div className="space-y-1">
                  {(editing.features || []).map((f, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-1.5 bg-dark-700 rounded-lg">
                      <span className="text-sm text-gray-300">{f}</span>
                      <button onClick={() => removeFeature(i)} className="p-0.5 text-gray-500 hover:text-red-400"><X className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
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
