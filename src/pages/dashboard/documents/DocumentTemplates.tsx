import { useState, useEffect } from 'react';
import { ArrowLeft, FileText, Handshake, ShieldCheck, Award, UserPlus, Users, Sparkles, Download, Save, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { callGeminiFlash } from '../../../lib/ai/gemini';
import { hasOpenRouterKey } from '../../../lib/ai/models';
import { generateDocumentPdf } from '../../../lib/documentPdf';

interface Props { onBack: () => void; }

const LS_KEY = 'mfo_documents';

const TEMPLATES = [
  { key: 'agreement', label: 'Client Agreement', icon: FileText, color: 'from-blue-500 to-blue-700', fields: ['client', 'projectName', 'amount', 'paymentTerms', 'startDate', 'endDate'] },
  { key: 'nda', label: 'NDA', icon: ShieldCheck, color: 'from-purple-500 to-purple-700', fields: ['partyName', 'company', 'confidentialInfo', 'duration'] },
  { key: 'completion', label: 'Project Completion Certificate', icon: Award, color: 'from-green-500 to-green-700', fields: ['client', 'projectName', 'completionDate', 'deliverables'] },
  { key: 'freelancer', label: 'Freelancer Agreement', icon: Handshake, color: 'from-amber-500 to-amber-700', fields: ['freelancerName', 'workDescription', 'rate', 'timeline', 'paymentTerms'] },
  { key: 'offer', label: 'Offer Letter', icon: UserPlus, color: 'from-cyan-500 to-cyan-700', fields: ['employeeName', 'role', 'salary', 'startDate', 'probationPeriod'] },
  { key: 'partnership', label: 'Partnership Agreement', icon: Users, color: 'from-pink-500 to-pink-700', fields: ['partnerName', 'company', 'terms', 'revenueSplit'] },
];

const FIELD_LABELS: Record<string, string> = {
  client: 'Client Name', projectName: 'Project Name', amount: 'Amount (INR)', paymentTerms: 'Payment Terms',
  startDate: 'Start Date', endDate: 'End Date', partyName: 'Party Name', company: 'Company',
  confidentialInfo: 'Confidential Info Description', duration: 'Duration', completionDate: 'Completion Date',
  deliverables: 'Deliverables (comma separated)', freelancerName: 'Freelancer Name', workDescription: 'Work Description',
  rate: 'Rate (INR)', timeline: 'Timeline', employeeName: 'Employee Name', role: 'Role',
  salary: 'Salary (INR)', probationPeriod: 'Probation Period', partnerName: 'Partner Name',
  terms: 'Partnership Terms', revenueSplit: 'Revenue Split %',
};

const buildPrompt = (key: string, vals: Record<string, string>) => {
  const base = `You are a legal document assistant for MyDesignNexus, a Karnataka-based AI automation and design company founded by Rakshith. Generate a professional, legally sound document. Use INR for currency. Jurisdiction: Karnataka, India. Today's date: ${new Date().toLocaleDateString('en-IN')}. Do NOT use markdown formatting - use plain text only with clear section headers.\n\n`;
  if (key === 'agreement') return base + `Generate a Client Service Agreement between MyDesignNexus and ${vals.client} for project "${vals.projectName}". Total: INR ${vals.amount}. Payment terms: ${vals.paymentTerms}. Duration: ${vals.startDate} to ${vals.endDate}. Include scope, deliverables, payment schedule, IP rights, termination clause, and signatures section.`;
  if (key === 'nda') return base + `Generate a Non-Disclosure Agreement between MyDesignNexus and ${vals.partyName} (${vals.company}). Confidential information: ${vals.confidentialInfo}. Duration: ${vals.duration}. Include obligations, exceptions, remedies, and signatures section.`;
  if (key === 'completion') return base + `Generate a Project Completion Certificate for client ${vals.client}, project "${vals.projectName}". Completed on: ${vals.completionDate}. Deliverables: ${vals.deliverables}. Include acceptance clause and signatures.`;
  if (key === 'freelancer') return base + `Generate a Freelancer Agreement between MyDesignNexus and freelancer ${vals.freelancerName}. Work: ${vals.workDescription}. Rate: INR ${vals.rate}. Timeline: ${vals.timeline}. Payment terms: ${vals.paymentTerms}. Include IP rights, confidentiality, and termination clauses.`;
  if (key === 'offer') return base + `Generate an Offer Letter from MyDesignNexus to ${vals.employeeName} for position: ${vals.role}. Salary: INR ${vals.salary}/month. Start date: ${vals.startDate}. Probation: ${vals.probationPeriod}. Include benefits, work expectations, and acceptance section.`;
  return base + `Generate a Partnership Agreement between MyDesignNexus and ${vals.partnerName} (${vals.company}). Terms: ${vals.terms}. Revenue split: ${vals.revenueSplit}%. Include roles, financial terms, IP, dispute resolution, and signatures.`;
};

export default function DocumentTemplates({ onBack }: Props) {
  const { user } = useAuth();
  const [active, setActive] = useState<string | null>(null);
  const [vals, setVals] = useState<Record<string, string>>({});
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState<string[]>([]);
  const [employees, setEmployees] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase.from('clients').select('company_name').eq('user_id', user.id).then(({ data }) => setClients((data || []).map((c: any) => c.company_name)));
    supabase.from('employees').select('full_name').eq('user_id', user.id).then(({ data }) => setEmployees((data || []).map((e: any) => e.full_name)));
  }, [user]);

  const handleGenerate = async () => {
    if (!hasOpenRouterKey()) { toast.error('Add your OpenRouter API key in Settings first'); return; }
    const tmpl = TEMPLATES.find((t) => t.key === active);
    if (!tmpl) return;
    const empty = tmpl.fields.filter((f) => !vals[f]?.trim());
    if (empty.length > 0) { toast.error(`Please fill: ${empty.map((f) => FIELD_LABELS[f]).join(', ')}`); return; }
    setLoading(true);
    try {
      const result = await callGeminiFlash(buildPrompt(active!, vals));
      setContent(result);
      toast.success('Document generated');
    } catch (err: any) {
      toast.error(err.message || 'Generation failed');
    } finally { setLoading(false); }
  };

  const handleDownloadPDF = async () => {
    const tmpl = TEMPLATES.find((t) => t.key === active);
    await generateDocumentPdf(content, {
      title: tmpl?.label || 'Document',
      type: tmpl?.label,
      date: vals.startDate || vals.completionDate || new Date().toISOString().split('T')[0],
      expiryDate: vals.endDate || undefined,
      linkedName: vals.client || vals.employeeName || vals.freelancerName || vals.partnerName || vals.partyName || undefined,
      status: 'Draft',
    });
    toast.success('PDF downloaded');
  };

  const handleSaveToVault = () => {
    const tmpl = TEMPLATES.find((t) => t.key === active);
    const docs = JSON.parse(localStorage.getItem(LS_KEY) || '[]');
    docs.unshift({
      id: crypto.randomUUID(),
      name: `${tmpl?.label} - ${vals[tmpl?.fields[0] || ''] || 'Untitled'}`,
      type: tmpl?.label || 'Custom',
      linkedType: active === 'offer' ? 'employee' : active === 'freelancer' || active === 'partnership' ? 'general' : 'client',
      linkedId: '',
      linkedName: vals.client || vals.employeeName || vals.freelancerName || vals.partnerName || vals.partyName || '',
      date: new Date().toISOString().split('T')[0],
      expiryDate: vals.endDate || undefined,
      notes: '',
      status: 'Draft',
      content,
      createdAt: new Date().toISOString(),
    });
    localStorage.setItem(LS_KEY, JSON.stringify(docs));
    toast.success('Saved to Document Vault');
  };

  const isDateField = (f: string) => f.toLowerCase().includes('date');
  const tmpl = TEMPLATES.find((t) => t.key === active);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-2 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white"><ArrowLeft className="w-5 h-5" /></button>
        <div><h1 className="text-2xl font-bold">Document Templates</h1><p className="text-sm text-gray-500 mt-1">Generate professional documents with AI</p></div>
      </div>

      {!active ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {TEMPLATES.map((t) => (
            <button key={t.key} onClick={() => { setActive(t.key); setVals({}); setContent(''); }} className="glass-card glass-card-hover rounded-xl p-5 text-left transition-all group">
              <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center mb-3`}><t.icon className="w-5 h-5 text-white" /></div>
              <h3 className="font-semibold mb-1 group-hover:text-[#FF9A00] transition-colors">{t.label}</h3>
              <p className="text-xs text-gray-500">AI-powered template with Karnataka jurisdiction</p>
            </button>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              {tmpl && <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${tmpl.color} flex items-center justify-center`}><tmpl.icon className="w-4 h-4 text-white" /></div>}
              <h3 className="font-semibold">{tmpl?.label}</h3>
            </div>
            {tmpl?.fields.map((f) => (
              <div key={f}>
                <label className="block text-xs text-gray-400 mb-1">{FIELD_LABELS[f]}</label>
                {f === 'client' ? (
                  <div><input list="cl-list" value={vals[f] || ''} onChange={(e) => setVals({ ...vals, [f]: e.target.value })} className="w-full px-3 py-2.5 bg-[#141414] border border-[#1f1f1f] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00]" placeholder="Type or select client" /><datalist id="cl-list">{clients.map((c) => <option key={c} value={c} />)}</datalist></div>
                ) : f === 'employeeName' ? (
                  <div><input list="em-list" value={vals[f] || ''} onChange={(e) => setVals({ ...vals, [f]: e.target.value })} className="w-full px-3 py-2.5 bg-[#141414] border border-[#1f1f1f] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00]" placeholder="Type or select employee" /><datalist id="em-list">{employees.map((e) => <option key={e} value={e} />)}</datalist></div>
                ) : f === 'confidentialInfo' || f === 'workDescription' || f === 'deliverables' || f === 'terms' ? (
                  <textarea value={vals[f] || ''} onChange={(e) => setVals({ ...vals, [f]: e.target.value })} rows={2} className="w-full px-3 py-2.5 bg-[#141414] border border-[#1f1f1f] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00] resize-none" />
                ) : (
                  <input type={isDateField(f) ? 'date' : 'text'} value={vals[f] || ''} onChange={(e) => setVals({ ...vals, [f]: e.target.value })} className="w-full px-3 py-2.5 bg-[#141414] border border-[#1f1f1f] rounded-lg text-sm text-white focus:outline-none focus:border-[#FF6B00]" />
                )}
              </div>
            ))}
            <button onClick={handleGenerate} disabled={loading} className="w-full py-3 rounded-xl gradient-orange text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} {loading ? 'Generating...' : 'Generate with AI'}
            </button>
            <div className="flex items-center justify-center gap-1.5 text-[10px] text-gray-600"><Sparkles className="w-3 h-3" /> Powered by Gemini 2.5 Flash</div>
          </div>

          <div className="glass-card rounded-xl p-5 flex flex-col">
            <h3 className="font-semibold mb-3">Preview</h3>
            {loading ? (
              <div className="flex-1 space-y-3 animate-pulse">
                {Array.from({ length: 12 }).map((_, i) => <div key={i} className="h-4 bg-white/5 rounded" style={{ width: `${60 + Math.random() * 40}%` }} />)}
              </div>
            ) : content ? (
              <>
                <textarea value={content} onChange={(e) => setContent(e.target.value)} className="flex-1 min-h-[300px] w-full p-4 bg-[#080808] border border-[#1f1f1f] rounded-lg text-sm text-gray-300 focus:outline-none focus:border-[#FF6B00] resize-none mb-4" />
                <div className="flex gap-2">
                  <button onClick={handleDownloadPDF} className="flex-1 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white font-medium text-sm flex items-center justify-center gap-2"><Download className="w-4 h-4" /> Download as PDF</button>
                  <button onClick={handleSaveToVault} className="flex-1 py-2.5 rounded-xl gradient-orange text-white font-medium text-sm flex items-center justify-center gap-2"><Save className="w-4 h-4" /> Save to Vault</button>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-600 text-sm">Fill the form and click Generate to preview</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
