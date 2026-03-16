import { useState } from 'react';
import { Plus, Trash2, X, Download, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { OB_DOC_TYPES, DOC_STATUSES, DOC_STATUS_COLORS } from '../../../../lib/onboarding/constants';
import type { OnboardingDocument } from '../../../../lib/onboarding/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';

interface Props {
  obId: string;
  documents: OnboardingDocument[];
  onRefresh: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function ObDocumentsTab({ obId, documents, onRefresh }: Props) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [form, setForm] = useState({ doc_name: '', doc_type: OB_DOC_TYPES[0] as string, is_required: false, notes: '' });
  const [file, setFile] = useState<File | null>(null);

  const resetForm = () => {
    setShowForm(false);
    setFile(null);
    setForm({ doc_name: '', doc_type: OB_DOC_TYPES[0] as string, is_required: false, notes: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.doc_name.trim()) { toast.error('Document name is required'); return; }
    if (!file) { toast.error('Please select a file'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const filePath = `${user!.id}/${obId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('onboarding-documents').upload(filePath, file);
    if (uploadError) { toast.error('Upload failed'); setUploading(false); return; }

    const { error } = await supabase.from('onboarding_documents').insert({
      onboarding_id: obId, user_id: user!.id,
      doc_name: form.doc_name.trim(), doc_type: form.doc_type,
      file_path: filePath, file_name: file.name, file_size: file.size,
      is_required: form.is_required, doc_status: 'Received', notes: form.notes.trim(),
    });
    if (error) { toast.error(error.message); setUploading(false); return; }
    toast.success('Document uploaded');
    setUploading(false);
    resetForm();
    onRefresh();
  };

  const handleDownload = async (doc: OnboardingDocument) => {
    setDownloading(doc.id);
    const { data, error } = await supabase.storage.from('onboarding-documents').createSignedUrl(doc.file_path, 60);
    if (error || !data?.signedUrl) { toast.error('Failed to download'); setDownloading(null); return; }
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = doc.file_name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloading(null);
  };

  const updateDocStatus = async (docId: string, status: string) => {
    await supabase.from('onboarding_documents').update({ doc_status: status }).eq('id', docId);
    onRefresh();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const doc = documents.find((d) => d.id === deleteId);
    if (doc) await supabase.storage.from('onboarding-documents').remove([doc.file_path]);
    await supabase.from('onboarding_documents').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Document deleted');
    onRefresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Documents ({documents.length})</h3>
        <button onClick={() => setShowForm(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg gradient-orange text-white flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Upload Document
        </button>
      </div>

      {documents.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center text-gray-500 text-sm">No documents uploaded yet.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {documents.map((doc) => (
            <div key={doc.id} className="glass-card rounded-xl p-4 flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5 text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-medium text-white truncate">{doc.doc_name}</p>
                  {doc.is_required && <span className="text-[10px] text-red-400 border border-red-500/20 px-1.5 py-0.5 rounded">Required</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-500">
                  <span>{doc.doc_type}</span><span>|</span><span>{formatFileSize(doc.file_size)}</span>
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                  {DOC_STATUSES.map((s) => (
                    <button key={s} onClick={() => updateDocStatus(doc.id, s)} className={`px-2 py-0.5 text-[10px] rounded-md transition-all ${doc.doc_status === s ? DOC_STATUS_COLORS[s] + ' font-semibold' : 'text-gray-600 hover:text-gray-400'}`}>{s}</button>
                  ))}
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <button onClick={() => handleDownload(doc)} disabled={downloading === doc.id} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white">
                  {downloading === doc.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                </button>
                <button onClick={() => setDeleteId(doc.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upload Document</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm text-gray-400 mb-1">Document Name *</label><input type="text" value={form.doc_name} onChange={(e) => setForm({ ...form, doc_name: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Document Type</label>
                <select value={form.doc_type} onChange={(e) => setForm({ ...form, doc_type: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500">
                  {OB_DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">File *</label>
                <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" onChange={(e) => setFile(e.target.files?.[0] || null)} className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-500/10 file:text-brand-400 hover:file:bg-brand-500/20" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={form.is_required} onChange={(e) => setForm({ ...form, is_required: e.target.checked })} className="rounded" />
                <span className="text-sm text-gray-400">Required document</span>
              </div>
              <div><label className="block text-sm text-gray-400 mb-1">Notes</label><input type="text" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-brand-500" /></div>
              <button type="submit" disabled={uploading} className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {uploading ? 'Uploading...' : 'Upload Document'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Document" message="This will permanently delete the file. Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
