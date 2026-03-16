import { useEffect, useState, useRef } from 'react';
import {
  Plus, Download, Eye, Trash2, Pencil, Search, Copy, FileText,
  Filter, CheckCircle, XCircle, Send, X, TrendingUp, BarChart2,
  Calendar, Tag, Clock, AlertTriangle,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import toast from 'react-hot-toast';
import { generateInvoicePDF } from '../../../lib/invoicePdf';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../context/AuthContext';
import { formatCurrency, formatDate } from '../../../lib/format';
import ConfirmDialog from '../../../components/ConfirmDialog';
import EmptyState from '../../../components/EmptyState';
import InvoicePreviewTemplate from '../../../components/InvoicePreviewTemplate';
import type { Quotation, BankDetails } from '../../../lib/invoicing/types';
import QuotationForm from './QuotationForm';

const statusColor = (s: string) => {
  if (s === 'accepted') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
  if (s === 'rejected') return 'bg-red-500/10 text-red-400 border border-red-500/20';
  if (s === 'sent') return 'bg-blue-500/10 text-blue-400 border border-blue-500/20';
  if (s === 'expired') return 'bg-gray-500/10 text-gray-500 border border-gray-500/20';
  return 'bg-amber-500/10 text-amber-400 border border-amber-500/20';
};

const STATUSES = ['all', 'draft', 'sent', 'accepted', 'rejected', 'expired'] as const;
const SORT_OPTIONS = [
  { label: 'Date (Newest)', key: 'date_desc' },
  { label: 'Date (Oldest)', key: 'date_asc' },
  { label: 'Amount (High)', key: 'amount_desc' },
  { label: 'Amount (Low)', key: 'amount_asc' },
  { label: 'Client Name', key: 'client' },
] as const;

type ViewMode = 'table' | 'analytics';

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#111] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }} className="font-semibold">
          {p.name}: {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(p.value)}
        </p>
      ))}
    </div>
  );
};

export default function QuotationList() {
  const { user } = useAuth();
  const previewRef = useRef<HTMLDivElement>(null);
  const pdfRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editQuotation, setEditQuotation] = useState<Quotation | null>(null);
  const [duplicateQuotation, setDuplicateQuotation] = useState<Quotation | null>(null);
  const [preview, setPreview] = useState<Quotation | null>(null);
  const [pdfQuotation, setPdfQuotation] = useState<Quotation | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState('date_desc');
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [logoSignedUrl, setLogoSignedUrl] = useState('');
  const [signatureSignedUrl, setSignatureSignedUrl] = useState('');
  const [showBankDetails] = useState(true);
  const [bankDetails, setBankDetails] = useState<BankDetails>({ account_holder_name: '', account_number: '', ifsc_code: '', bank_name: '' });

  useEffect(() => {
    if (user) {
      setLoading(true);
      loadQuotations(false);
      loadProfile();
    }
  }, [user]);

  const loadSignedUrl = async (path: string, setter: (v: string) => void) => {
    const { data } = await supabase.storage.from('avatars').createSignedUrl(path, 3600);
    if (data?.signedUrl) setter(data.signedUrl);
  };

  const loadProfile = async () => {
    const { data: d } = await supabase.from('profiles').select('*').eq('id', user!.id).maybeSingle();
    if (!d) return;
    setBankDetails({ account_holder_name: d.bank_account_name || '', account_number: d.bank_account_number || '', ifsc_code: d.bank_ifsc_code || '', bank_name: d.bank_name || '' });
    if (d.business_logo_url) loadSignedUrl(d.business_logo_url, setLogoSignedUrl);
    if (d.signature_url) loadSignedUrl(d.signature_url, setSignatureSignedUrl);
  };

  const loadQuotations = async (_force = false) => {
    type RawQ = Record<string, unknown>;
    const data: RawQ[] = await (async () => {
      const { data: qData } = await supabase.from('quotations').select('*').eq('user_id', user!.id).order('created_at', { ascending: false });
      if (!qData?.length) return [];
      const ids = qData.map((q: RawQ) => q.id as string);
      const { data: allItems } = await supabase.from('quotation_items').select('*').in('quotation_id', ids);
      const itemsByQ: Record<string, unknown[]> = {};
      for (const item of allItems || []) {
        const ii = item as Record<string, unknown>;
        const qid = ii.quotation_id as string;
        if (!itemsByQ[qid]) itemsByQ[qid] = [];
        itemsByQ[qid].push(item);
      }
      return qData.map((q: RawQ) => ({ ...q, _items: itemsByQ[q.id as string] || [] }));
    })();
    const result: Quotation[] = [];
    for (const q of data || []) {
      const itemData = (q._items as Record<string, unknown>[]) || [];
      result.push({
        ...q,
        discount: Number(q.discount),
        discount_type: q.discount_type || 'flat',
        subtotal: Number(q.subtotal),
        tax_amount: Number(q.tax_amount),
        total: Number(q.total),
        to_phone: q.to_phone || '',
        payment_terms: q.payment_terms || '',
        scope_of_work: q.scope_of_work || '',
        delivery_timeline: q.delivery_timeline || '',
        theme_id: q.theme_id || 'classic-bw',
        custom_theme: q.custom_theme || null,
        signatory_name: q.signatory_name || '',
        signatory_designation: q.signatory_designation || '',
        items: (itemData || []).map((i: Record<string, unknown>) => ({
          description: i.description as string,
          hsn_sac: (i.hsn_sac as string) || '',
          unit: (i.unit as string) || 'Nos',
          qty: Number(i.qty),
          rate: Number(i.rate),
          amount: Number(i.amount),
          gst_rate: Number(i.gst_rate),
        })),
      });
    }
    setQuotations(result);
    setLoading(false);
  };

  const getNextQuoteNumber = () => {
    const nums = quotations.map((q) => { const m = q.quote_number.match(/QT-(\d+)/); return m ? parseInt(m[1]) : 0; });
    return `QT-${String((nums.length > 0 ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
  };

  const q = search.toLowerCase();
  const filtered = quotations
    .filter((qt) => (statusFilter === 'all' || qt.status === statusFilter) && (!search || qt.quote_number.toLowerCase().includes(q) || qt.to_client_name.toLowerCase().includes(q)))
    .sort((a, b) => {
      if (sortBy === 'date_desc') return new Date(b.quote_date).getTime() - new Date(a.quote_date).getTime();
      if (sortBy === 'date_asc') return new Date(a.quote_date).getTime() - new Date(b.quote_date).getTime();
      if (sortBy === 'amount_desc') return b.total - a.total;
      if (sortBy === 'amount_asc') return a.total - b.total;
      return a.to_client_name.localeCompare(b.to_client_name);
    });

  const sentQ = quotations.filter((q) => q.status === 'sent');
  const acceptedQ = quotations.filter((q) => q.status === 'accepted');
  const rejectedQ = quotations.filter((q) => q.status === 'rejected');
  const expiredQ = quotations.filter((q) => q.status === 'expired');
  const sumOf = (arr: Quotation[]) => arr.reduce((s, q) => s + q.total, 0);

  const markAsSent = async (id: string) => { await supabase.from('quotations').update({ status: 'sent' }).eq('id', id); toast.success('Marked as sent'); loadQuotations(true); };
  const markAccepted = async (id: string) => { await supabase.from('quotations').update({ status: 'accepted' }).eq('id', id); toast.success('Quotation accepted'); loadQuotations(true); };
  const markRejected = async (id: string) => { await supabase.from('quotations').update({ status: 'rejected' }).eq('id', id); toast.success('Quotation rejected'); loadQuotations(true); };
  const markExpired = async (id: string) => { await supabase.from('quotations').update({ status: 'expired' }).eq('id', id); toast.success('Marked as expired'); loadQuotations(true); };

  const handleDelete = async () => {
    if (!deleteId) return;
    await supabase.from('quotation_items').delete().eq('quotation_id', deleteId);
    await supabase.from('quotations').delete().eq('id', deleteId);
    setDeleteId(null);
    toast.success('Quotation deleted');
    loadQuotations(true);
  };

  const handleDuplicate = (qt: Quotation) => {
    setDuplicateQuotation({ ...qt, id: '', quote_number: getNextQuoteNumber() });
    setEditQuotation(null);
    setShowForm(true);
  };

  const convertToInvoice = async (qt: Quotation) => {
    try {
      const { data: existing, error: fetchError } = await supabase.from('invoices').select('invoice_number').eq('user_id', user!.id);
      if (fetchError) { toast.error('Failed to fetch invoice numbers'); return; }
      const nums = (existing || []).map((i: { invoice_number: string }) => { const m = i.invoice_number.match(/INV-(\d+)/); return m ? parseInt(m[1]) : 0; });
      const nextNum = `INV-${String((nums.length > 0 ? Math.max(...nums) : 0) + 1).padStart(3, '0')}`;
      const { data: inv, error } = await supabase.from('invoices').insert({
        user_id: user!.id, invoice_number: nextNum,
        from_business_name: qt.from_business_name || '', from_address: qt.from_address || '',
        from_gstin: qt.from_gstin || '', from_email: qt.from_email || '', from_phone: qt.from_phone || '',
        to_client_name: qt.to_client_name, to_address: qt.to_address || '', to_gstin: qt.to_gstin || '',
        to_email: qt.to_email || '', to_phone: qt.to_phone || '',
        invoice_date: new Date().toISOString().split('T')[0], due_date: qt.valid_until || null,
        discount: qt.discount || 0, discount_type: qt.discount_type || 'flat',
        subtotal: qt.subtotal, tax_amount: qt.tax_amount, total: qt.total,
        notes: qt.notes || '', terms: qt.terms || '', currency: qt.currency || 'INR', status: 'draft',
        payment_terms: qt.payment_terms || '',
        place_of_supply: '',
        theme_id: qt.theme_id || 'classic-bw',
        custom_theme: qt.custom_theme || null,
        signatory_name: qt.signatory_name || '',
        signatory_designation: qt.signatory_designation || '',
      }).select().single();
      if (error || !inv) { toast.error(error?.message || 'Failed to create invoice'); return; }
      if (qt.items && qt.items.length > 0) {
        const { error: itemsError } = await supabase.from('invoice_items').insert(
          qt.items.map((item) => ({
            invoice_id: inv.id,
            description: item.description,
            hsn_sac: item.hsn_sac || '',
            unit: item.unit || 'Nos',
            qty: item.qty,
            rate: item.rate,
            amount: item.amount,
            gst_rate: item.gst_rate,
          }))
        );
        if (itemsError) { toast.error('Invoice created but items failed: ' + itemsError.message); }
      }
      toast.success(`Converted to Invoice ${nextNum}`);
    } catch {
      toast.error('Something went wrong during conversion');
    }
  };

  const downloadPDF = async (qt: Quotation) => {
    setGeneratingPdf(true);
    toast.loading('Generating PDF...', { id: 'pdf-gen' });
    setPdfQuotation(qt);
    await new Promise((r) => setTimeout(r, 600));
    if (!pdfRef.current) {
      setGeneratingPdf(false);
      setPdfQuotation(null);
      toast.dismiss('pdf-gen');
      toast.error('PDF generation failed');
      return;
    }
    try {
      await generateInvoicePDF(pdfRef.current, `${qt.quote_number}.pdf`, {
        docNumber: qt.quote_number,
        docDate: qt.quote_date,
        clientName: qt.to_client_name,
        isInvoice: false,
      });
      toast.dismiss('pdf-gen');
      toast.success('PDF downloaded');
    } catch {
      toast.dismiss('pdf-gen');
      toast.error('PDF generation failed');
    }
    setPdfQuotation(null);
    setGeneratingPdf(false);
  };

  const downloadPDFFromPreview = async () => {
    if (!preview) return;
    setGeneratingPdf(true);
    toast.loading('Generating PDF...', { id: 'pdf-gen' });
    await new Promise((r) => setTimeout(r, 300));
    if (!previewRef.current) {
      setGeneratingPdf(false);
      toast.dismiss('pdf-gen');
      toast.error('PDF generation failed');
      return;
    }
    try {
      await generateInvoicePDF(previewRef.current, `${preview.quote_number}.pdf`, {
        docNumber: preview.quote_number,
        docDate: preview.quote_date,
        clientName: preview.to_client_name,
        isInvoice: false,
      });
      toast.dismiss('pdf-gen');
      toast.success('PDF downloaded');
    } catch {
      toast.dismiss('pdf-gen');
      toast.error('PDF generation failed');
    }
    setGeneratingPdf(false);
  };

  const onFormClose = () => { setShowForm(false); setEditQuotation(null); setDuplicateQuotation(null); loadQuotations(true); };

  const winRate = quotations.length > 0 ? ((acceptedQ.length / Math.max(sentQ.length + acceptedQ.length + rejectedQ.length, 1)) * 100).toFixed(0) : '0';
  const avgValue = quotations.length > 0 ? sumOf(quotations) / quotations.length : 0;
  const pipeline = sumOf(sentQ);

  const monthlyChartData = (() => {
    const map: Record<string, { sent: number; accepted: number }> = {};
    quotations.forEach((qt) => {
      const m = qt.quote_date?.slice(0, 7) || '';
      if (!m) return;
      if (!map[m]) map[m] = { sent: 0, accepted: 0 };
      if (qt.status === 'accepted') map[m].accepted += qt.total;
      else if (qt.status !== 'rejected' && qt.status !== 'expired') map[m].sent += qt.total;
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0])).slice(-12).map(([month, vals]) => ({
      name: new Date(month + '-01').toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      ...vals,
    }));
  })();

  const topClients = (() => {
    const map: Record<string, number> = {};
    quotations.filter((q) => q.status === 'accepted').forEach((q) => { map[q.to_client_name] = (map[q.to_client_name] || 0) + q.total; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, value]) => ({ name, value }));
  })();

  const statusPie = [
    { name: 'Accepted', value: acceptedQ.length, fill: '#10B981' },
    { name: 'Rejected', value: rejectedQ.length, fill: '#EF4444' },
    { name: 'Sent', value: sentQ.length, fill: '#3B82F6' },
    { name: 'Draft', value: quotations.filter((q) => q.status === 'draft').length, fill: '#F59E0B' },
    { name: 'Expired', value: expiredQ.length, fill: '#6B7280' },
  ].filter((d) => d.value > 0);

  const CLIENT_COLORS = ['#10B981', '#3B82F6', '#FF6B00', '#F59E0B', '#EC4899', '#8B5CF6'];

  if (showForm) {
    return <QuotationForm quotation={editQuotation || duplicateQuotation || undefined} isEdit={!!editQuotation} onClose={onFormClose} />;
  }

  const cards = [
    { label: 'Total Quotations', count: quotations.length, amount: sumOf(quotations), icon: FileText, a: 'text-blue-400', bg: 'bg-blue-500/10', border: 'border-t-blue-500' },
    { label: 'Sent / Pipeline', count: sentQ.length, amount: sumOf(sentQ), icon: Send, a: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-t-amber-500' },
    { label: 'Accepted / Won', count: acceptedQ.length, amount: sumOf(acceptedQ), icon: CheckCircle, a: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-t-emerald-500' },
    { label: 'Rejected / Lost', count: rejectedQ.length, amount: sumOf(rejectedQ), icon: XCircle, a: 'text-red-400', bg: 'bg-red-500/10', border: 'border-t-red-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Quotations</h1>
          <p className="text-sm text-gray-500 mt-1">Create and manage professional quotes for your clients</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 border border-white/10 rounded-lg p-1">
            <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === 'table' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              <FileText className="w-3.5 h-3.5" /> List
            </button>
            <button onClick={() => setViewMode('analytics')} className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all flex items-center gap-1.5 ${viewMode === 'analytics' ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              <BarChart2 className="w-3.5 h-3.5" /> Analytics
            </button>
          </div>
          <button onClick={() => { setEditQuotation(null); setDuplicateQuotation(null); setShowForm(true); }} className="px-4 py-2.5 text-sm font-semibold rounded-xl gradient-orange text-white flex items-center gap-2">
            <Plus className="w-4 h-4" /> Create Quotation
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div key={c.label} className={`glass-card rounded-xl p-4 border-t-2 ${c.border}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-9 h-9 rounded-lg ${c.bg} flex items-center justify-center`}><c.icon className={`w-4 h-4 ${c.a}`} /></div>
              <span className="text-xs font-medium text-gray-400 uppercase tracking-wide">{c.label}</span>
            </div>
            <p className="text-2xl font-bold">{c.count}</p>
            <p className={`text-sm font-semibold mt-1 ${c.a}`}>{formatCurrency(c.amount)}</p>
          </div>
        ))}
      </div>

      {viewMode === 'analytics' && (
        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Win Rate', value: `${winRate}%`, sub: `${acceptedQ.length} of ${sentQ.length + acceptedQ.length + rejectedQ.length} decided`, icon: TrendingUp, color: 'text-emerald-400' },
              { label: 'Avg Quote Value', value: formatCurrency(avgValue), sub: 'across all quotations', icon: Calendar, color: 'text-blue-400' },
              { label: 'Active Pipeline', value: formatCurrency(pipeline), sub: `${sentQ.length} quotes pending response`, icon: Clock, color: 'text-amber-400' },
            ].map((s) => (
              <div key={s.label} className="glass-card rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <s.icon className={`w-4 h-4 ${s.color}`} />
                  <p className="text-xs text-gray-500">{s.label}</p>
                </div>
                <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                <p className="text-xs text-gray-600 mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className="glass-card rounded-xl p-5 lg:col-span-2">
              <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">Monthly Pipeline — Sent vs Accepted</p>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyChartData}>
                    <defs>
                      <linearGradient id="acceptedGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                    <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area dataKey="accepted" name="Accepted" stroke="#10B981" strokeWidth={2} fill="url(#acceptedGrad)" />
                    <Area dataKey="sent" name="Pending" stroke="#3B82F6" strokeWidth={2} fill="url(#sentGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass-card rounded-xl p-5">
              <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">Status Breakdown</p>
              {statusPie.length > 0 ? (
                <>
                  <div className="h-36">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={statusPie} dataKey="value" cx="50%" cy="50%" outerRadius={60} strokeWidth={2} stroke="#111">
                          {statusPie.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Pie>
                        <Tooltip formatter={(v, n) => [v, n]} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="grid grid-cols-2 gap-1.5 mt-2">
                    {statusPie.map((d) => (
                      <div key={d.name} className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: d.fill }} />
                        <span className="text-[10px] text-gray-400">{d.name} ({d.value})</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-36 flex items-center justify-center text-xs text-gray-600">No data yet</div>
              )}
            </div>
          </div>

          {topClients.length > 0 && (
            <div className="glass-card rounded-xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Tag className="w-4 h-4 text-emerald-400" />
                <p className="text-sm font-semibold">Top Clients by Accepted Value</p>
              </div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topClients} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" horizontal={false} />
                    <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 10 }} axisLine={false} tickLine={false} width={100} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="value" name="Value" radius={[0, 4, 4, 0]}>
                      {topClients.map((_, i) => <Cell key={i} fill={CLIENT_COLORS[i % CLIENT_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {viewMode === 'table' && (
        <>
          <div className="glass-card rounded-xl p-4 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input type="text" placeholder="Search quote # or client..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 bg-dark-800 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-orange-500/50" />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-500 hidden md:block" />
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="px-3 py-2 bg-dark-800 border border-white/10 rounded-lg text-sm text-white focus:outline-none">
                  {SORT_OPTIONS.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STATUSES.map((s) => (
                <button key={s} onClick={() => setStatusFilter(s)} className={`px-3.5 py-1.5 text-xs font-medium rounded-lg capitalize whitespace-nowrap transition-colors ${statusFilter === s ? 'gradient-orange text-white' : 'bg-dark-800 text-gray-400 border border-white/10 hover:border-white/20'}`}>
                  {s === 'all' ? `All (${quotations.length})` : `${s} (${quotations.filter((q) => q.status === s).length})`}
                </button>
              ))}
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState title="No quotations found" description={quotations.length === 0 ? 'Create your first professional quotation.' : 'No quotations match your current filters.'} />
          ) : (
            <div className="glass-card rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-white/5">
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Quote #</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Client</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider hidden md:table-cell">Date</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider hidden lg:table-cell">Valid Until</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider">Status</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider text-right">Amount</th>
                      <th className="px-4 py-3 font-medium text-[11px] uppercase tracking-wider text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((qt) => (
                      <tr key={qt.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group">
                        <td className="px-4 py-3 font-semibold">{qt.quote_number}</td>
                        <td className="px-4 py-3 text-gray-300">{qt.to_client_name}</td>
                        <td className="px-4 py-3 text-gray-400 hidden md:table-cell">{formatDate(qt.quote_date)}</td>
                        <td className="px-4 py-3 text-gray-400 hidden lg:table-cell">
                          {qt.valid_until ? (
                            <span className={new Date(qt.valid_until) < new Date() && qt.status !== 'accepted' && qt.status !== 'rejected' ? 'text-red-400' : ''}>
                              {formatDate(qt.valid_until)}
                            </span>
                          ) : '-'}
                        </td>
                        <td className="px-4 py-3"><span className={`px-2.5 py-1 text-xs rounded-md font-medium capitalize ${statusColor(qt.status)}`}>{qt.status}</span></td>
                        <td className="px-4 py-3 text-right font-bold text-white">{formatCurrency(qt.total, qt.currency)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-0.5 opacity-70 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => setPreview(qt)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white" title="Preview"><Eye className="w-4 h-4" /></button>
                            <button onClick={() => { setEditQuotation(qt); setDuplicateQuotation(null); setShowForm(true); }} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white" title="Edit"><Pencil className="w-4 h-4" /></button>
                            <button onClick={() => downloadPDF(qt)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white" title="Download PDF"><Download className="w-4 h-4" /></button>
                            <button onClick={() => handleDuplicate(qt)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white" title="Duplicate"><Copy className="w-4 h-4" /></button>
                            <button onClick={() => convertToInvoice(qt)} className="p-1.5 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white" title="Convert to Invoice"><FileText className="w-4 h-4" /></button>
                            {qt.status === 'draft' && <button onClick={() => markAsSent(qt.id)} className="p-1.5 rounded-lg hover:bg-blue-500/10 text-gray-400 hover:text-blue-400" title="Mark as Sent"><Send className="w-4 h-4" /></button>}
                            {qt.status !== 'accepted' && qt.status !== 'rejected' && <button onClick={() => markAccepted(qt.id)} className="p-1.5 rounded-lg hover:bg-emerald-500/10 text-gray-400 hover:text-emerald-400" title="Mark Accepted"><CheckCircle className="w-4 h-4" /></button>}
                            {qt.status !== 'accepted' && qt.status !== 'rejected' && <button onClick={() => markRejected(qt.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400" title="Mark Rejected"><XCircle className="w-4 h-4" /></button>}
                            {qt.status !== 'expired' && qt.status !== 'accepted' && <button onClick={() => markExpired(qt.id)} className="p-1.5 rounded-lg hover:bg-gray-500/10 text-gray-400 hover:text-gray-500" title="Mark Expired"><AlertTriangle className="w-4 h-4" /></button>}
                            <button onClick={() => setDeleteId(qt.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-gray-400 hover:text-red-400" title="Delete"><Trash2 className="w-4 h-4" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-4 py-3 border-t border-white/5 flex items-center justify-between">
                <p className="text-xs text-gray-500">{filtered.length} quotation{filtered.length !== 1 ? 's' : ''}</p>
                <p className="text-xs text-gray-500">Total: <span className="text-white font-semibold">{formatCurrency(filtered.reduce((s, q) => s + q.total, 0))}</span></p>
              </div>
            </div>
          )}
        </>
      )}

      {preview && (
        <div className="fixed inset-0 z-50 bg-black/70 overflow-y-auto py-8 px-4">
          <div className="max-w-[850px] mx-auto">
            <div className="flex justify-end gap-2 mb-4">
              <button onClick={downloadPDFFromPreview} disabled={generatingPdf} className="px-4 py-2 text-sm font-medium rounded-lg gradient-orange text-white flex items-center gap-2 disabled:opacity-50">
                <Download className="w-4 h-4" /> {generatingPdf ? 'Generating...' : 'Download PDF'}
              </button>
              <button onClick={() => setPreview(null)} className="px-4 py-2 text-sm font-medium rounded-lg border border-white/10 text-gray-300 hover:bg-white/5 flex items-center gap-2"><X className="w-4 h-4" /> Close</button>
            </div>
            <div className="rounded-xl overflow-hidden shadow-2xl">
              <InvoicePreviewTemplate
                ref={previewRef}
                type="quotation"
                themeId={(preview as any).theme_id || 'classic-bw'}
                customThemeOverrides={(preview as any).custom_theme}
                docNumber={preview.quote_number}
                docDate={preview.quote_date}
                validUntil={preview.valid_until}
                fromBusinessName={preview.from_business_name}
                fromAddress={preview.from_address}
                fromGstin={preview.from_gstin}
                fromEmail={preview.from_email}
                fromPhone={preview.from_phone}
                fromLogoUrl={logoSignedUrl}
                toClientName={preview.to_client_name}
                toAddress={preview.to_address}
                toGstin={preview.to_gstin}
                toEmail={preview.to_email}
                toPhone={preview.to_phone}
                items={preview.items}
                subtotal={preview.subtotal}
                taxAmount={preview.tax_amount}
                discount={preview.discount}
                discountType={preview.discount_type}
                total={preview.total}
                currency={preview.currency}
                notes={preview.notes}
                terms={preview.terms}
                bankDetails={bankDetails}
                showBankDetails={showBankDetails}
                signatureUrl={signatureSignedUrl}
                signatoryName={(preview as any).signatory_name || ''}
                signatoryDesignation={(preview as any).signatory_designation || ''}
                paymentTerms={preview.payment_terms}
                scopeOfWork={preview.scope_of_work}
                deliveryTimeline={preview.delivery_timeline}
              />
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog open={!!deleteId} title="Delete Quotation" message="Are you sure you want to delete this quotation? This action cannot be undone." onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />

      {pdfQuotation && (
        <div style={{ position: 'fixed', left: '-9999px', top: 0, width: '850px', zIndex: -1 }}>
          <InvoicePreviewTemplate
            ref={pdfRef}
            type="quotation"
            themeId={(pdfQuotation as any).theme_id || 'classic-bw'}
            customThemeOverrides={(pdfQuotation as any).custom_theme}
            docNumber={pdfQuotation.quote_number}
            docDate={pdfQuotation.quote_date}
            validUntil={pdfQuotation.valid_until}
            fromBusinessName={pdfQuotation.from_business_name}
            fromAddress={pdfQuotation.from_address}
            fromGstin={pdfQuotation.from_gstin}
            fromEmail={pdfQuotation.from_email}
            fromPhone={pdfQuotation.from_phone}
            fromLogoUrl={logoSignedUrl}
            toClientName={pdfQuotation.to_client_name}
            toAddress={pdfQuotation.to_address}
            toGstin={pdfQuotation.to_gstin}
            toEmail={pdfQuotation.to_email}
            toPhone={pdfQuotation.to_phone}
            items={pdfQuotation.items}
            subtotal={pdfQuotation.subtotal}
            taxAmount={pdfQuotation.tax_amount}
            discount={pdfQuotation.discount}
            discountType={pdfQuotation.discount_type}
            total={pdfQuotation.total}
            currency={pdfQuotation.currency}
            notes={pdfQuotation.notes}
            terms={pdfQuotation.terms}
            bankDetails={bankDetails}
            showBankDetails={showBankDetails}
            signatureUrl={signatureSignedUrl}
            signatoryName={(pdfQuotation as any).signatory_name || ''}
            signatoryDesignation={(pdfQuotation as any).signatory_designation || ''}
            paymentTerms={pdfQuotation.payment_terms}
            scopeOfWork={pdfQuotation.scope_of_work}
            deliveryTimeline={pdfQuotation.delivery_timeline}
          />
        </div>
      )}
    </div>
  );
}
