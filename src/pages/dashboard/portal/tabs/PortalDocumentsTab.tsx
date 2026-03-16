import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, Trash2, Eye, EyeOff, FileText, X, Save, Download, Upload, File, Image, Video, Music, Archive } from 'lucide-react';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { DOCUMENT_TYPES, DOCUMENT_TYPE_COLORS } from '../../../../lib/portal/constants';
import type { ClientPortal, PortalSharedDocument } from '../../../../lib/portal/types';
import toast from 'react-hot-toast';

interface Props { portal: ClientPortal; }

const FILE_ICONS: Record<string, typeof FileText> = {
  pdf: FileText, doc: FileText, docx: FileText, txt: FileText,
  png: Image, jpg: Image, jpeg: Image, gif: Image, svg: Image, webp: Image,
  mp4: Video, mov: Video, avi: Video, webm: Video,
  mp3: Music, wav: Music, ogg: Music,
  zip: Archive, rar: Archive, '7z': Archive, tar: Archive,
};

function getFileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase() || '';
  return FILE_ICONS[ext] || File;
}

function formatFileSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function guessDocType(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['pdf', 'doc', 'docx'].includes(ext)) return 'Proposal';
  if (['ppt', 'pptx', 'key'].includes(ext)) return 'Presentation';
  if (['xls', 'xlsx', 'csv'].includes(ext)) return 'Report';
  if (['zip', 'rar', '7z'].includes(ext)) return 'Deliverable';
  return 'Other';
}

export default function PortalDocumentsTab({ portal }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<PortalSharedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<PortalSharedDocument> | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFile, setPendingFile] = useState<globalThis.File | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('portal_shared_documents').select('*').eq('portal_id', portal.id).order('created_at', { ascending: false });
    setItems((data || []) as PortalSharedDocument[]);
    setLoading(false);
  }, [portal.id]);

  useEffect(() => { load(); }, [load]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) {
      toast.error('File size must be under 50MB');
      return;
    }
    setPendingFile(file);
    const name = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setEditing({
      document_name: name,
      document_type: guessDocType(file.name),
      is_visible: true,
      file_size: file.size,
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const uploadFile = async (file: globalThis.File): Promise<{ path: string; url: string }> => {
    if (!user) throw new Error('Not authenticated');
    const ext = file.name.split('.').pop() || 'bin';
    const path = `${user.id}/${portal.id}/${Date.now()}.${ext}`;

    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    const { error } = await supabase.storage
      .from('portal-documents')
      .upload(path, file, { cacheControl: '3600', upsert: false });

    clearInterval(interval);
    setUploadProgress(100);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('portal-documents')
      .getPublicUrl(path);

    return { path, url: urlData.publicUrl };
  };

  const handleSave = async () => {
    if (!editing || !user) return;
    if (!editing.document_name?.trim()) { toast.error('Document name is required'); return; }
    setSaving(true);

    try {
      let filePath = editing.file_path || '';
      let fileUrl = editing.file_url || '';
      let fileSize = editing.file_size || 0;
      let uploadedVia = editing.uploaded_via || 'url';

      if (pendingFile) {
        setUploading(true);
        const result = await uploadFile(pendingFile);
        filePath = result.path;
        fileUrl = result.url;
        fileSize = pendingFile.size;
        uploadedVia = 'upload';
        setUploading(false);
      }

      const payload = {
        document_name: editing.document_name,
        document_type: editing.document_type || 'Other',
        file_url: fileUrl,
        file_path: filePath,
        file_size: fileSize,
        description: editing.description || '',
        uploaded_via: uploadedVia,
        is_visible: editing.is_visible !== false,
      };

      if (editing.id) {
        await supabase.from('portal_shared_documents').update(payload).eq('id', editing.id);
      } else {
        await supabase.from('portal_shared_documents').insert({ ...payload, user_id: user.id, portal_id: portal.id });
      }

      setEditing(null);
      setPendingFile(null);
      setUploadProgress(0);
      load();
      toast.success(editing.id ? 'Updated' : 'Document added');
    } catch (err: any) {
      toast.error(err.message || 'Failed to save');
    } finally {
      setSaving(false);
      setUploading(false);
    }
  };

  const handleDelete = async (item: PortalSharedDocument) => {
    if (item.file_path) {
      await supabase.storage.from('portal-documents').remove([item.file_path]);
    }
    await supabase.from('portal_shared_documents').delete().eq('id', item.id);
    setItems(prev => prev.filter(i => i.id !== item.id));
    toast.success('Deleted');
  };

  const toggleVisibility = async (item: PortalSharedDocument) => {
    await supabase.from('portal_shared_documents').update({ is_visible: !item.is_visible }).eq('id', item.id);
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_visible: !i.is_visible } : i));
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-gray-400">{items.length} document{items.length !== 1 ? 's' : ''}</p>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar,.7z,.png,.jpg,.jpeg,.gif,.svg,.mp4,.mp3,.wav" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/10 text-sm text-gray-300 hover:bg-white/5 transition-colors"
          >
            <Upload className="w-4 h-4" /> Upload File
          </button>
          <button
            onClick={() => setEditing({ document_name: '', document_type: 'Other', is_visible: true, uploaded_via: 'url' })}
            className="flex items-center gap-2 px-4 py-2 rounded-xl gradient-orange text-white text-sm font-medium"
          >
            <Plus className="w-4 h-4" /> Add by URL
          </button>
        </div>
      </div>

      {items.length === 0 && !editing && (
        <div className="text-center py-16 text-gray-500">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="mb-2">No documents shared yet</p>
          <p className="text-xs">Upload files or add URLs to share proposals, contracts, and deliverables</p>
        </div>
      )}

      <div className="space-y-2">
        {items.map(item => {
          const Icon = getFileIcon(item.document_name || item.file_url);
          return (
            <div key={item.id} className={`bg-dark-800 border rounded-xl p-4 flex items-center gap-4 ${item.is_visible ? 'border-white/[0.06]' : 'border-red-500/20 opacity-60'}`}>
              <div className="w-10 h-10 rounded-lg bg-dark-700 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-gray-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-sm font-medium truncate">{item.document_name}</h4>
                  <span className={`px-1.5 py-0.5 text-[10px] rounded border ${DOCUMENT_TYPE_COLORS[item.document_type] || DOCUMENT_TYPE_COLORS.Other}`}>
                    {item.document_type}
                  </span>
                  {item.uploaded_via === 'upload' && (
                    <span className="px-1.5 py-0.5 text-[10px] rounded bg-green-500/10 text-green-400 border border-green-500/20">Uploaded</span>
                  )}
                </div>
                {item.description && <p className="text-xs text-gray-500 truncate mt-0.5">{item.description}</p>}
                <div className="flex items-center gap-3 mt-0.5">
                  <p className="text-[11px] text-gray-600">{new Date(item.created_at).toLocaleDateString()}</p>
                  {item.file_size > 0 && <p className="text-[11px] text-gray-600">{formatFileSize(item.file_size)}</p>}
                  {item.download_count > 0 && <p className="text-[11px] text-gray-600">{item.download_count} downloads</p>}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {(item.file_url || item.file_path) && (
                  <a href={item.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                    <Download className="w-3.5 h-3.5" />
                  </a>
                )}
                <button onClick={() => toggleVisibility(item)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400">
                  {item.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                </button>
                <button onClick={() => handleDelete(item)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setEditing(null); setPendingFile(null); }}>
          <div className="bg-dark-800 border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-white/[0.06]">
              <h3 className="font-semibold">{pendingFile ? 'Upload Document' : editing.id ? 'Edit Document' : 'Add Document by URL'}</h3>
              <button onClick={() => { setEditing(null); setPendingFile(null); }} className="p-2 rounded-lg hover:bg-white/5 text-gray-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-5 space-y-4">
              {pendingFile && (
                <div className="flex items-center gap-3 p-3 bg-dark-700 rounded-xl">
                  <File className="w-5 h-5 text-brand-400 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{pendingFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(pendingFile.size)}</p>
                  </div>
                </div>
              )}
              {uploading && (
                <div>
                  <div className="flex justify-between text-xs text-gray-400 mb-1">
                    <span>Uploading...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-600 to-brand-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
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
              {!pendingFile && (
                <div>
                  <label className="text-sm font-medium text-gray-300 mb-1 block">File URL</label>
                  <input type="url" value={editing.file_url || ''} onChange={e => setEditing({ ...editing, file_url: e.target.value })} placeholder="https://..." className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none" />
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1 block">Description</label>
                <textarea value={editing.description || ''} onChange={e => setEditing({ ...editing, description: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-dark-700 border border-white/10 rounded-xl text-sm focus:border-brand-500/50 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="p-5 border-t border-white/[0.06] flex justify-end gap-3">
              <button onClick={() => { setEditing(null); setPendingFile(null); }} className="px-4 py-2 rounded-xl border border-white/10 text-sm hover:bg-white/5">Cancel</button>
              <button onClick={handleSave} disabled={saving || uploading} className="flex items-center gap-2 px-5 py-2 rounded-xl gradient-orange text-white text-sm font-medium disabled:opacity-50">
                {pendingFile ? <Upload className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saving || uploading ? 'Saving...' : pendingFile ? 'Upload & Save' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
