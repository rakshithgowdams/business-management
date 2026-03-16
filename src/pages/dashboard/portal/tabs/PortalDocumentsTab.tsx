import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, Eye, EyeOff, FileText, X, Save, Download } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { DOCUMENT_TYPES, DOCUMENT_TYPE_COLORS } from '../../../../lib/portal/constants';
import type { ClientPortal, PortalSharedDocument } from '../../../../lib/portal/types';
import toast from 'react-hot-toast';

interface Props { portal: ClientPortal; }

export default function PortalDocumentsTab({ portal }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<PortalSharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<PortalSharedDocument> | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('portal_shared_documents').select('*').eq('portal_id', portal.id).order('created_at', { ascending: false });
    setItems((data || []) as PortalSharedDocument[]);
    setLoading(false);
  }, [portal.id]);

  useEffect(() => { load(); }, [load]);

  const handleSave = async () => {
    if (!editing || !user) return;
    if (!editing.document_name?.trim()) { toast.error('Document name is required'); return; }
    setSaving(true);

    const payload = {
      document_name: editing.document_name, document_type: editing.document_type || 'Other',
      file_url: editing.file_url || '', description: editing.description || '',
      is_visible: editing.is_visible !== false,
    };

    if (editing.id) {
      await supabase.from('portal_shared_documents').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('portal_shared_documents').insert({ ...payload, user_id: user.id, portal_id: portal.id });
    }

    setSaving(false);
    setEditing(null);
    load();
    toast.success(editing.id ? 'Updated' : 'Created');
  };

  const handleDelete = async (id: string) => {
    await supabase.from('portal_shared_documents').delete().eq('id', id);
    setItems(prev => prev.filter(i => i.id !== id));
    toast.success('Deleted');
  };

  const toggleVisibility = async (item: PortalSharedDocument) => {
    await supabase.from('portal_shared_documents').update({ is_visible: !item.is_visible }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_visible: !i.is_visible } : i));
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">{items.length} document{items.length !== 1 ? 's' : ''}</p>
        <button onClick={() => setEditing({ document_name: '', document_type: 'Other', is_visible: true })} className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium">
          <Plus className="w-4 h-4" /> Add Document
        </button>
      </div>

      {items.length === 0 && !editing && (
        <div className="text-center py-16 text-gray-500">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="mb-2">No documents shared yet</p>
          <p className="text-xs">Share proposals, contracts, and deliverables with your client</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => (
          <div key={item.id} className={`bg-dark-800 border rounded-xl p-4 flex items-center gap-4 ${item.is_visible ? 'border-white/[0.06]' : 'border-red-500/20 opacity-60'}`}>
            <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-medium truncate">{item.document_name}</h4>
                <span className={`px-1.5 py-0.5 text-[10px] rounded border ${DOCUMENT_TYPE_COLORS[item.document_type] || DOCUMENT_TYPE_COLORS.Other}`}>
                  {item.document_type}
                </span>
              </div>
              {item.description && <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>}
              <p className="text-[11px] text-gray-600 mt-0.5">{new Date(item.created_at).toLocaleDateString()}</p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {item.file_url && (
                <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                  <Download className="w-3.5 h-3.5" />
                </a>
              )}
              <button onClick={() => toggleVisibility(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400">
                {item.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              </button>
              <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setEditing(null)}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h3 className="font-semibold">{editing.id ? 'Edit' : 'Add'} Document</h3>
              <button onClick={() => setEditing(null)} className="p-2 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Document Name *</label>
                <input type="text" value={editing.document_name || ''} onChange={e => setEditing({ ...editing, document_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Type</label>
                <select value={editing.document_type || 'Other'} onChange={e => setEditing({ ...editing, document_type: e.target.value })} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none">
                  {DOCUMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">File URL</label>
                <input type="url" value={editing.file_url || ''} onChange={e => setEditing({ ...editing, file_url: e.target.value })} placeholder="https://..." className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Description</label>
                <textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none resize-none" />
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
