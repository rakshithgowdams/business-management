import { useState } from 'react';
import { Plus, Trash2, X, Download, FileText, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../../lib/supabase';
import { useAuth } from '../../../../context/AuthContext';
import { AGREEMENT_TYPES } from '../../../../lib/projects/constants';
import type { ProjectAgreement, ProjectTeamEntry } from '../../../../lib/projects/types';
import ConfirmDialog from '../../../../components/ConfirmDialog';

interface Props {
  projectId: string;
  agreements: ProjectAgreement[];
  team: ProjectTeamEntry[];
  onRefresh: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function AgreementsSection({ projectId, agreements, team, onRefresh }: Props) {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    agreement_type: AGREEMENT_TYPES[0] as string,
    team_member_id: '',
    notes: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const resetForm = () => {
    setShowForm(false);
    setFile(null);
    setForm({ title: '', agreement_type: AGREEMENT_TYPES[0] as string, team_member_id: '', notes: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error('Title is required'); return; }
    if (!file) { toast.error('Please select a file'); return; }

    setUploading(true);
    const ext = file.name.split('.').pop();
    const filePath = `${user!.id}/${projectId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('project-agreements')
      .upload(filePath, file);

    if (uploadError) {
      toast.error('Upload failed: ' + uploadError.message);
      setUploading(false);
      return;
    }

    const { error } = await supabase.from('project_agreements').insert({
      project_id: projectId,
      user_id: user!.id,
      team_member_id: form.team_member_id || null,
      title: form.title.trim(),
      agreement_type: form.agreement_type,
      file_path: filePath,
      file_name: file.name,
      file_size: file.size,
      notes: form.notes.trim(),
    });

    if (error) {
      toast.error(error.message);
      setUploading(false);
      return;
    }

    toast.success('Agreement uploaded');
    setUploading(false);
    resetForm();
    onRefresh();
  };

  const handleDownload = async (agreement: ProjectAgreement) => {
    setDownloading(agreement.id);
    const { data, error } = await supabase.storage
      .from('project-agreements')
      .createSignedUrl(agreement.file_path, 60);

    if (error || !data?.signedUrl) {
      toast.error('Failed to generate download link');
      setDownloading(null);
      return;
    }

    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = agreement.file_name;
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setDownloading(null);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const agreement = agreements.find((a) => a.id === deleteId);
    if (agreement) {
      await supabase.storage.from('project-agreements').remove([agreement.file_path]);
    }
    await supabase.from('project_agreements').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Agreement deleted');
    onRefresh();
  };

  const getTeamMemberName = (id: string | null) => {
    if (!id) return null;
    return team.find((t) => t.id === id)?.member_name || null;
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Agreements & Documents</h3>
        <button onClick={() => setShowForm(true)} className="px-3 py-1.5 text-xs font-semibold rounded-lg gradient-orange text-white flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Upload Agreement
        </button>
      </div>

      {agreements.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {agreements.map((a) => {
            const memberName = getTeamMemberName(a.team_member_id);
            return (
              <div key={a.id} className="glass-card rounded-xl p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-brand-500/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-brand-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{a.title}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-xs text-gray-500">{a.agreement_type}</span>
                    <span className="text-xs text-gray-600">|</span>
                    <span className="text-xs text-gray-500">{a.file_name}</span>
                    <span className="text-xs text-gray-600">|</span>
                    <span className="text-xs text-gray-500">{formatFileSize(a.file_size)}</span>
                  </div>
                  {memberName && (
                    <p className="text-xs text-gray-400 mt-1">Assigned to: {memberName}</p>
                  )}
                  {a.notes && <p className="text-xs text-gray-500 mt-1 truncate">{a.notes}</p>}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button
                    onClick={() => handleDownload(a)}
                    disabled={downloading === a.id}
                    className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"
                  >
                    {downloading === a.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setDeleteId(a.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-card rounded-xl p-8 text-center text-gray-500 text-sm">
          No agreements uploaded yet. Upload employee contracts, freelancer agreements, NDAs, or project documents.
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="glass-card rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Upload Agreement</h2>
              <button onClick={resetForm} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500" placeholder="e.g. Freelancer Agreement - John" />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Agreement Type</label>
                <select value={form.agreement_type} onChange={(e) => setForm({ ...form, agreement_type: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                  {AGREEMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Assign to Team Member</label>
                <select value={form.team_member_id} onChange={(e) => setForm({ ...form, team_member_id: e.target.value })} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500">
                  <option value="">None (General)</option>
                  {team.map((t) => <option key={t.id} value={t.id}>{t.member_name} ({t.employment_type})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">File (PDF, DOCX, JPG, PNG) *</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="w-full text-sm text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-brand-500/10 file:text-brand-400 hover:file:bg-brand-500/20"
                />
                {file && <p className="text-xs text-gray-500 mt-1">{file.name} ({formatFileSize(file.size)})</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-4 py-2.5 bg-dark-800 border border-white/10 rounded-xl text-white focus:outline-none focus:border-brand-500 resize-none" placeholder="Optional notes..." />
              </div>
              <button type="submit" disabled={uploading} className="w-full py-2.5 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2">
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {uploading ? 'Uploading...' : 'Upload Agreement'}
              </button>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Agreement" message="This will permanently delete the file from storage. Are you sure?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
    </div>
  );
}
