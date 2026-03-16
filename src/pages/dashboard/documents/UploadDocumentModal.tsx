import { useState, useEffect, useCallback } from 'react';
import { X, Upload, FileUp, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
}

const DOC_TYPES = ['Client Agreement', 'NDA', 'Purchase Order', 'Project Proposal', 'Completion Certificate', 'Invoice/Receipt', 'Offer Letter', 'Employee ID Proof', 'Bank Details Form', 'Salary Slip', 'Freelancer Agreement', 'Partnership Agreement', 'Business License', 'Custom'];
const LS_KEY = 'mfo_documents';
const ACCEPTED = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
const MAX_SIZE = 10 * 1024 * 1024;

export default function UploadDocumentModal({ open, onClose, onSave }: Props) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [type, setType] = useState(DOC_TYPES[0]);
  const [linkedType, setLinkedType] = useState<'client' | 'employee' | 'project' | 'general'>('general');
  const [linkedId, setLinkedId] = useState('');
  const [linkedName, setLinkedName] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [expiryDate, setExpiryDate] = useState('');
  const [notes, setNotes] = useState('');
  const [fileBase64, setFileBase64] = useState('');
  const [fileName, setFileName] = useState('');
  const [sizeWarning, setSizeWarning] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [employees, setEmployees] = useState<{ id: string; name: string }[]>([]);
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    if (!open || !user) return;
    supabase.from('clients').select('id, company_name').eq('user_id', user.id).then(({ data }) => setClients((data || []).map((c: any) => ({ id: c.id, name: c.company_name }))));
    supabase.from('employees').select('id, full_name').eq('user_id', user.id).then(({ data }) => setEmployees((data || []).map((e: any) => ({ id: e.id, name: e.full_name }))));
    supabase.from('projects').select('id, name').eq('user_id', user.id).then(({ data }) => setProjects((data || []).map((p: any) => ({ id: p.id, name: p.name }))));
  }, [open, user]);

  const processFile = (file: File) => {
    if (file.size > MAX_SIZE) { toast.error('File exceeds 10MB limit'); return; }
    setSizeWarning(file.size > 5 * 1024 * 1024);
    setFileName(file.name);
    if (!name) setName(file.name.replace(/\.[^.]+$/, ''));
    const reader = new FileReader();
    reader.onload = () => setFileBase64(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }, [name]);

  const handleLinkedChange = (id: string) => {
    setLinkedId(id);
    const list = linkedType === 'client' ? clients : linkedType === 'employee' ? employees : projects;
    const found = list.find((i) => i.id === id);
    setLinkedName(found?.name || '');
  };

  const resetForm = () => {
    setName(''); setType(DOC_TYPES[0]); setLinkedType('general'); setLinkedId(''); setLinkedName('');
    setDate(new Date().toISOString().split('T')[0]); setExpiryDate(''); setNotes('');
    setFileBase64(''); setFileName(''); setSizeWarning(false);
  };

  const handleSave = () => {
    if (!name.trim()) { toast.error('Document name is required'); return; }
    const docs = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    const now = new Date();
    let status = 'Active';
    if (expiryDate) {
      const exp = new Date(expiryDate);
      if (exp < now) status = 'Expired';
      else if (exp.getTime() - now.getTime() < 30 * 86400000) status = 'Expiring Soon';
    }
    const doc = {
      id: crypto.randomUUID(),
      name: name.trim(),
      type,
      linkedType,
      linkedId,
      linkedName,
      date,
      expiryDate: expiryDate || undefined,
      notes,
      status,
      fileBase64: fileBase64 || undefined,
      fileName: fileName || undefined,
      createdAt: now.toISOString(),
    };
    docs.unshift(doc);
    localStorage.setItem(LS_KEY, JSON.stringify(docs));
    toast.success('Document saved to vault');
    resetForm();
    onSave();
  };

  if (!open) return null;

  const linkOptions = linkedType === 'client' ? clients : linkedType === 'employee' ? employees : linkedType === 'project' ? projects : [];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto py-8 px-4" onClick={onClose}>
      <div className="glass-card rounded-2xl p-6 max-w-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Upload Document</h2>
          <button onClick={() => { resetForm(); onClose(); }} className="text-gray-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Document Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter document name" className="w-full px-3 py-2.5 bg-[#141414] border border-[#1f1f1f] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00]" />
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Document Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className="w-full px-3 py-2.5 bg-[#141414] border border-[#1f1f1f] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00]">
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-2">Link to</label>
            <div className="flex gap-2 mb-3">
              {(['client', 'employee', 'project', 'general'] as const).map((lt) => (
                <button key={lt} onClick={() => { setLinkedType(lt); setLinkedId(''); setLinkedName(''); }} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${linkedType === lt ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF9A00] text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>{lt}</button>
              ))}
            </div>
            {linkedType !== 'general' && (
              <select value={linkedId} onChange={(e) => handleLinkedChange(e.target.value)} className="w-full px-3 py-2.5 bg-[#141414] border border-[#1f1f1f] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00]">
                <option value="">Select {linkedType}...</option>
                {linkOptions.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
              </select>
            )}
          </div>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${dragging ? 'border-[#FF6B00] bg-[#FF6B00]/5' : 'border-[#1f1f1f] hover:border-[#FF6B00]/50'}`}
          >
            <FileUp className="w-8 h-8 mx-auto mb-2 text-gray-500" />
            {fileName ? (
              <div><p className="text-sm text-white font-medium">{fileName}</p><button onClick={() => { setFileBase64(''); setFileName(''); setSizeWarning(false); }} className="text-xs text-red-400 mt-1">Remove</button></div>
            ) : (
              <div>
                <p className="text-sm text-gray-400 mb-1">Drag & drop your file here, or</p>
                <label className="text-sm text-[#FF6B00] font-medium cursor-pointer hover:underline">
                  browse files<input type="file" accept={ACCEPTED} onChange={handleFileChange} className="hidden" />
                </label>
                <p className="text-xs text-gray-600 mt-2">PDF, DOC, JPG, PNG (max 10MB)</p>
              </div>
            )}
          </div>

          {sizeWarning && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" /> File is larger than 5MB. This may cause localStorage limits to be exceeded.
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Document Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 bg-[#141414] border border-[#1f1f1f] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00]" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Expiry Date (optional)</label>
              <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-full px-3 py-2.5 bg-[#141414] border border-[#1f1f1f] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00]" />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Additional notes..." className="w-full px-3 py-2.5 bg-[#141414] border border-[#1f1f1f] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00] resize-none" />
          </div>

          <button onClick={handleSave} className="w-full py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Save to Vault</button>
        </div>
      </div>
    </div>
  );
}
