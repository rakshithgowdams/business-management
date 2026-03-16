import { useState, useMemo } from 'react';
import { FileText, Upload, LayoutTemplate, Search, ChevronDown, Eye, Download, Trash2, AlertTriangle, Users, Briefcase, Clock, FolderOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDate } from '../../../lib/format';
import { generateDocumentPdf } from '../../../lib/documentPdf';
import UploadDocumentModal from './UploadDocumentModal';
import DocumentTemplates from './DocumentTemplates';

interface VaultDoc {
  id: string;
  name: string;
  type: string;
  linkedType: string;
  linkedId: string;
  linkedName: string;
  date: string;
  expiryDate?: string;
  notes: string;
  status: string;
  content?: string;
  fileBase64?: string;
  fileName?: string;
  createdAt: string;
}

const LS_KEY = 'mfo_documents';
const DOC_TYPES = ['Client Agreement', 'NDA', 'Purchase Order', 'Project Proposal', 'Completion Certificate', 'Invoice/Receipt', 'Offer Letter', 'Employee ID Proof', 'Bank Details Form', 'Salary Slip', 'Freelancer Agreement', 'Partnership Agreement', 'Business License', 'Custom'];
const TABS = ['All', 'Client Agreements', 'Employee Docs', 'Projects', 'Invoices & Finance', 'Templates'];

const getStatusBadge = (status: string) => {
  if (status === 'Active') return 'bg-green-500/10 text-green-400 border-green-500/20';
  if (status === 'Expiring Soon') return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
  if (status === 'Expired') return 'bg-red-500/10 text-red-400 border-red-500/20';
  if (status === 'Signed') return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
};

const getTypeBadge = (type: string) => {
  if (type.includes('Agreement') || type === 'NDA') return 'bg-purple-500/10 text-purple-400';
  if (type.includes('Invoice') || type.includes('Receipt')) return 'bg-emerald-500/10 text-emerald-400';
  if (type.includes('Employee') || type.includes('Offer') || type.includes('Salary') || type.includes('Bank')) return 'bg-blue-500/10 text-blue-400';
  if (type.includes('Project') || type.includes('Completion') || type.includes('Purchase')) return 'bg-amber-500/10 text-amber-400';
  return 'bg-gray-500/10 text-gray-400';
};

const loadDocs = (): VaultDoc[] => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
};

const saveDocs = (docs: VaultDoc[]) => localStorage.setItem(LS_KEY, JSON.stringify(docs));

export default function DocumentVault() {
  const [docs, setDocs] = useState<VaultDoc[]>(loadDocs);
  const [tab, setTab] = useState('All');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [showUpload, setShowUpload] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [viewDoc, setViewDoc] = useState<VaultDoc | null>(null);

  const refresh = () => setDocs(loadDocs());

  const handleSave = () => { refresh(); setShowUpload(false); };

  const handleDelete = (id: string) => {
    const updated = docs.filter((d) => d.id !== id);
    saveDocs(updated);
    setDocs(updated);
    toast.success('Document deleted');
  };

  const handleDownload = async (doc: VaultDoc) => {
    if (doc.fileBase64 && doc.fileName) {
      const a = document.createElement('a');
      a.href = doc.fileBase64;
      a.download = doc.fileName;
      a.click();
      return;
    }
    await generateDocumentPdf(doc.content || '', {
      title: doc.name,
      type: doc.type,
      date: doc.date,
      expiryDate: doc.expiryDate,
      status: doc.status,
      linkedName: doc.linkedName || undefined,
      notes: doc.notes || undefined,
    });
  };

  const now = new Date();
  const soon = new Date(now.getTime() + 30 * 86400000);
  const expiringSoon = docs.filter((d) => d.expiryDate && new Date(d.expiryDate) > now && new Date(d.expiryDate) <= soon);

  const filtered = useMemo(() => {
    let list = docs;
    if (tab === 'Client Agreements') list = list.filter((d) => d.linkedType === 'client' || d.type.includes('Agreement') || d.type === 'NDA');
    else if (tab === 'Employee Docs') list = list.filter((d) => d.linkedType === 'employee' || ['Offer Letter', 'Employee ID Proof', 'Bank Details Form', 'Salary Slip'].includes(d.type));
    else if (tab === 'Projects') list = list.filter((d) => d.linkedType === 'project' || ['Project Proposal', 'Completion Certificate', 'Purchase Order'].includes(d.type));
    else if (tab === 'Invoices & Finance') list = list.filter((d) => d.type === 'Invoice/Receipt' || d.type === 'Business License');
    if (search) { const q = search.toLowerCase(); list = list.filter((d) => d.name.toLowerCase().includes(q) || d.linkedName.toLowerCase().includes(q) || d.type.toLowerCase().includes(q)); }
    if (filterType !== 'All') list = list.filter((d) => d.type === filterType);
    if (filterStatus !== 'All') list = list.filter((d) => d.status === filterStatus);
    return list;
  }, [docs, tab, search, filterType, filterStatus]);

  if (showTemplates) return <DocumentTemplates onBack={() => { setShowTemplates(false); refresh(); }} />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Document Vault</h1>
          <p className="text-sm text-gray-500 mt-1">Manage all business documents in one place</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowUpload(true)} className="px-4 py-2.5 rounded-xl gradient-orange text-white font-semibold text-sm flex items-center gap-2"><Upload className="w-4 h-4" /> Upload Document</button>
          <button onClick={() => setShowTemplates(true)} className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white font-semibold text-sm flex items-center gap-2"><LayoutTemplate className="w-4 h-4" /> New From Template</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Documents', value: docs.length, icon: FolderOpen, color: 'text-brand-400' },
          { label: 'Expiring Soon', value: expiringSoon.length, icon: Clock, color: 'text-orange-400' },
          { label: 'Client Documents', value: docs.filter((d) => d.linkedType === 'client').length, icon: Briefcase, color: 'text-blue-400' },
          { label: 'Employee Documents', value: docs.filter((d) => d.linkedType === 'employee').length, icon: Users, color: 'text-purple-400' },
        ].map((c) => (
          <div key={c.label} className="glass-card rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-white/5 ${c.color}`}><c.icon className="w-5 h-5" /></div>
              <div><p className="text-2xl font-bold">{c.value}</p><p className="text-xs text-gray-500">{c.label}</p></div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1">
        {TABS.filter((t) => t !== 'Templates').map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${tab === t ? 'bg-gradient-to-r from-[#FF6B00] to-[#FF9A00] text-white' : 'text-gray-400 hover:bg-white/5'}`}>{t}</button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search documents..." className="w-full pl-10 pr-4 py-2.5 bg-[#141414] border border-[#1f1f1f] rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]" />
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-[#141414] border border-[#1f1f1f] rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]">
              <option value="All">All Types</option>
              {DOC_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
          <div className="relative">
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="appearance-none pl-3 pr-8 py-2.5 bg-[#141414] border border-[#1f1f1f] rounded-xl text-white text-sm focus:outline-none focus:border-[#FF6B00]">
              <option value="All">All Status</option>
              {['Active', 'Expiring Soon', 'Expired', 'Draft', 'Signed'].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-gray-500 border-b border-white/5">
              <th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Type</th><th className="px-4 py-3 font-medium">Linked To</th><th className="px-4 py-3 font-medium">Date</th><th className="px-4 py-3 font-medium">Expiry</th><th className="px-4 py-3 font-medium">Status</th><th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-gray-500"><FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />No documents found</td></tr>
              ) : filtered.map((d) => (
                <tr key={d.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-3 font-medium">{d.name}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-md ${getTypeBadge(d.type)}`}>{d.type}</span></td>
                  <td className="px-4 py-3 text-gray-400">{d.linkedName || '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{d.date ? formatDate(d.date) : '-'}</td>
                  <td className="px-4 py-3 text-gray-400">{d.expiryDate ? formatDate(d.expiryDate) : '-'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-1 text-xs rounded-md border ${getStatusBadge(d.status)}`}>{d.status}</span></td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => setViewDoc(d)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => handleDownload(d)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><Download className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(d.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {expiringSoon.length > 0 && (
        <div className="glass-card rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4"><AlertTriangle className="w-5 h-5 text-orange-400" /><h3 className="font-semibold text-orange-400">Expiry Alerts</h3></div>
          <div className="space-y-2">
            {expiringSoon.map((d) => (
              <div key={d.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-500/5 border border-orange-500/10">
                <div><p className="text-sm font-medium">{d.name}</p><p className="text-xs text-gray-500">{d.type} - {d.linkedName}</p></div>
                <span className="text-xs text-orange-400 font-medium">Expires {formatDate(d.expiryDate!)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {viewDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 overflow-y-auto py-8 px-4" onClick={() => setViewDoc(null)}>
          <div className="glass-card rounded-2xl p-6 max-w-2xl mx-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{viewDoc.name}</h2>
              <button onClick={() => setViewDoc(null)} className="text-gray-400 hover:text-white text-xl">&times;</button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex gap-2"><span className={`px-2 py-1 text-xs rounded-md ${getTypeBadge(viewDoc.type)}`}>{viewDoc.type}</span><span className={`px-2 py-1 text-xs rounded-md border ${getStatusBadge(viewDoc.status)}`}>{viewDoc.status}</span></div>
              {viewDoc.linkedName && <p className="text-gray-400">Linked to: {viewDoc.linkedName}</p>}
              <p className="text-gray-400">Date: {viewDoc.date ? formatDate(viewDoc.date) : '-'}</p>
              {viewDoc.expiryDate && <p className="text-gray-400">Expiry: {formatDate(viewDoc.expiryDate)}</p>}
              {viewDoc.notes && <p className="text-gray-400">Notes: {viewDoc.notes}</p>}
              {viewDoc.content && <div className="mt-4 p-4 rounded-lg bg-[#080808] border border-[#1f1f1f] max-h-80 overflow-y-auto whitespace-pre-wrap text-gray-300">{viewDoc.content}</div>}
              {viewDoc.fileBase64 && viewDoc.fileName && <p className="text-gray-500">Attached file: {viewDoc.fileName}</p>}
            </div>
            <button onClick={() => handleDownload(viewDoc)} className="mt-4 px-4 py-2 rounded-lg gradient-orange text-white text-sm font-medium flex items-center gap-2"><Download className="w-4 h-4" /> Download</button>
          </div>
        </div>
      )}

      <UploadDocumentModal open={showUpload} onClose={() => setShowUpload(false)} onSave={handleSave} />
    </div>
  );
}
